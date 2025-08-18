import React, { useState, useMemo, memo, useEffect } from 'react';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TaskModal from '../components/modals/TaskModal';
import ManageColumnsModal from '../components/modals/ManageColumnsModal';
import DetailItem from '../components/DetailItem';
import Badge from '../components/Badge';
import Label from '../components/Label';
import EmptyState from '../components/EmptyState';

// Ícones e Utilitários
import { cn, formatDate } from '../utils';
import { PaletteIcon, PlusCircleIcon, PencilIcon, Trash2Icon, CheckSquareIcon, ArchiveIcon } from '../components/Icons';


// =================================================================================
// SUBCOMPONENTES DA PÁGINA (MOVEMOS PARA FORA PARA MELHOR PERFORMANCE)
// =================================================================================

const TaskViewModal = memo(({ isOpen, onClose, task, users, clients, leads }) => {
    if (!task) return null;

    const assignedUser = (users || []).find(u => u.id === task.assignedTo);
    const linkedItem = task.linkedToType === 'client' 
        ? (clients || []).find(c => c.id === task.linkedToId) 
        : (leads || []).find(l => l.id === task.linkedToId);
    
    const linkedItemName = linkedItem 
        ? linkedItem.general?.companyName || linkedItem.general?.holderName || linkedItem.name 
        : null;

    const renderDescription = (desc) => { 
        if (!desc) return <p className="text-gray-500 italic">Nenhuma descrição fornecida.</p>;
        return (desc || '').split('\n').map((line, i) => <p key={i}>{line}</p>); 
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes: ${task.title}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <DetailItem label="Status" value={task.status} />
                    <DetailItem label="Prioridade">
                        <Badge variant={task.priority === 'Alta' ? 'danger' : task.priority === 'Média' ? 'warning' : 'secondary'}>
                            {task.priority}
                        </Badge>
                    </DetailItem>
                    <DetailItem label="Prazo" value={formatDate(task.dueDate)} />
                    <DetailItem label="Responsável" value={assignedUser?.name} />
                    {linkedItemName && (
                         <DetailItem label={`Vinculado a ${task.linkedToType === 'client' ? 'Cliente' : 'Lead'}`} value={linkedItemName} />
                    )}
                </div>
                <div>
                    <Label>Descrição</Label>
                    <div className="mt-1 text-md text-gray-800 dark:text-gray-100 prose dark:prose-invert max-w-none">
                        {renderDescription(task.description)}
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    );
});

const TaskCard = memo(({ task, onEdit, onDelete, onView, users, clients, leads }) => {
    const assignedUser = (users || []).find(u => u.id === task.assignedTo);
    const linkedItem = task.linkedToType === 'client' 
        ? (clients || []).find(c => c.id === task.linkedToId) 
        : (leads || []).find(l => l.id === task.linkedToId);
    
    const linkedItemName = linkedItem ? (linkedItem.general?.companyName || linkedItem.general?.holderName || linkedItem.name) : '';

    return (
        <GlassPanel 
            className="p-4 cursor-grab active:cursor-grabbing group border-l-4"
            style={{ borderColor: task.color || '#6B7280' }}
            onDoubleClick={() => onView(task)}
        >
            <div className="flex justify-between items-start">
                <p className="font-bold text-gray-900 dark:text-white flex-grow truncate" title={task.title}>{task.title}</p>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(task); }}><PencilIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(task); }}><Trash2Icon className="h-4 w-4" /></Button>
                </div>
            </div>
            
            {linkedItem && (
                <p className="text-xs mt-2 text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded-md inline-block">
                    {task.linkedToType === 'client' ? 'CLIENTE: ' : 'LEAD: '} {linkedItemName}
                </p>
            )}
            
            <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
                <span>Prazo: {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}</span>
                {assignedUser && <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 border-2 border-violet-400 dark:border-violet-700" title={assignedUser.name}>{assignedUser.name?.[0]}</div>}
            </div>
        </GlassPanel>
    );
});

const KanbanBoard = memo(({ columns, onDragEnd, children }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const handleDragStart = (e, item, sourceColumnId) => { setDraggedItem({ item, sourceColumnId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); };
    const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
    const handleDrop = (e, targetColumnId) => { e.preventDefault(); if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) { onDragEnd(draggedItem.item, targetColumnId); } setDraggedItem(null); setDragOverColumn(null); };

    return (
        <div className="flex gap-6 overflow-x-auto p-2">
            {Object.values(columns).sort((a, b) => a.order - b.order).map((column) => (
                <div key={column.id} className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === column.id ? 'bg-gray-200/50 dark:bg-white/10' : '')} onDragOver={(e) => handleDragOver(e, column.id)} onDrop={(e) => handleDrop(e, column.id)} onDragLeave={() => setDragOverColumn(null)}>
                    <div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.color || '#3B82F6' }}>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {column.title}
                            {column.isConclusion && <CheckSquareIcon className="h-4 w-4 text-green-500" title="Coluna de Conclusão"/>}
                        </h3>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span>
                    </div>
                    <div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">
                        {column.items.length > 0 ? (column.items.map(item => (
                            <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, column.id)}>
                                {typeof children === 'function' && children(item)}
                            </div>
                        ))) : (<div className="text-center text-sm text-gray-500 dark:text-gray-600 p-4">Nenhuma tarefa aqui.</div>)}
                    </div>
                </div>
            ))}
        </div>
    );
});


// =================================================================================
// PÁGINA PRINCIPAL
// =================================================================================

const TasksPage = () => {
    const { tasks, updateTask, addTask, deleteTask, taskColumns, logAction, clients, leads, users } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();
    const db = getFirestore();
    
    // Estados da página
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isManageColumnsModalOpen, setManageColumnsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);

    // Efeito para arquivar tarefas concluídas automaticamente
    useEffect(() => {
        if (!Array.isArray(tasks) || !Array.isArray(taskColumns)) return;

        const conclusionColumn = taskColumns.find(c => c.isConclusion);
        if (!conclusionColumn || tasks.length === 0) return;

        const now = new Date();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const tasksToArchive = [];

        tasks.forEach(task => {
            if (task.status === conclusionColumn.title && task.completedAt && !task.archived) {
                const completedDate = task.completedAt.toDate();
                if ((now - completedDate) > twoDaysInMs) {
                    tasksToArchive.push(task.id);
                }
            }
        });

        if (tasksToArchive.length > 0) {
            const batch = writeBatch(db);
            tasksToArchive.forEach(taskId => {
                const taskRef = doc(db, "tasks", taskId);
                batch.update(taskRef, { archived: true });
            });
            batch.commit().then(() => {
                toast({ title: "Tarefas Arquivadas", description: `${tasksToArchive.length} tarefa(s) foram arquivadas automaticamente.` });
            });
        }
    }, [tasks, taskColumns, db, toast]);

    // Lógica segura para preparar os dados do Kanban
    const columnsForBoard = useMemo(() => {
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        const safeColumns = Array.isArray(taskColumns) ? taskColumns : [];
        const visibleTasks = safeTasks.filter(task => !task.archived);
        if (safeColumns.length === 0) return {};
        return safeColumns.reduce((acc, column) => {
            acc[column.id] = { ...column, items: visibleTasks.filter(t => t.status === column.title) };
            return acc;
        }, {});
    }, [taskColumns, tasks]);
    
    // Handlers
    const handleOpenTaskModal = (task = null) => {
        setEditingTask(task);
        setTaskModalOpen(true);
    };

    const handleDragEnd = async (item, targetColumnId) => {
        const targetColumn = taskColumns.find(c => c.id === targetColumnId);
        if (!targetColumn) return;

        let updateData = { status: targetColumn.title };

        if (targetColumn.isConclusion) {
            updateData.completedAt = serverTimestamp();
            logAction({ actionType: 'CONCLUSÃO', module: 'Tarefas', description: `concluiu a tarefa "${item.title}".` });
            toast({ title: "Tarefa Concluída!", description: `"${item.title}" será arquivada em 2 dias.` });
        }
        
        await updateTask(item.id, updateData);
    };

    const handleSaveTask = async (taskData) => {
        if (taskData.id) {
            await updateTask(taskData.id, taskData);
            toast({ title: "Tarefa Atualizada", description: `"${taskData.title}" atualizada.` });
        } else {
            const firstColumn = taskColumns.sort((a,b) => a.order - b.order)[0];
            const status = firstColumn ? firstColumn.title : 'Pendente';
            await addTask({ ...taskData, status, archived: false });
            toast({ title: "Tarefa Adicionada", description: `"${taskData.title}" criada.` });
        }
        setTaskModalOpen(false);
    };

    const handleDeleteTask = async (task) => {
        try {
            await confirm({ title: `Excluir Tarefa?`, description: `Tem certeza que deseja excluir "${task.title}"?` });
            await deleteTask(task.id, task.title);
            toast({ title: "Tarefa Excluída!" });
        } catch (e) {}
    };

    const handleSaveColumns = async (updatedColumns) => {
        const batch = writeBatch(db);
        updatedColumns.forEach((col, index) => {
            const { id, ...data } = col;
            const docRef = id.startsWith('temp_') ? doc(collection(db, 'kanban_columns')) : doc(db, 'kanban_columns', id);
            batch.set(docRef, { ...data, order: index }, { merge: true });
        });
        try {
            await batch.commit();
            toast({ title: "Sucesso!", description: "Estrutura do quadro de tarefas foi salva." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: 'destructive' });
        }
    };
    
    const isLoading = taskColumns === undefined;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setManageColumnsModalOpen(true)}>
                        <PaletteIcon className="h-4 w-4 mr-2"/>Gerenciar Colunas
                    </Button>
                    <Button onClick={() => handleOpenTaskModal()} variant="violet">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />Nova Tarefa
                    </Button>
                </div>
            </header>
            
            <main>
                {isLoading ? (
                    <div className="text-center p-8">Carregando quadro de tarefas...</div>
                ) : Array.isArray(taskColumns) && taskColumns.length === 0 ? (
                    <GlassPanel className="p-8">
                        <EmptyState
                            title="Configure seu Quadro de Tarefas"
                            message="Você ainda não criou nenhuma coluna. Clique em 'Gerenciar Colunas' para definir as etapas do seu fluxo (Ex: A Fazer, Em Andamento, Concluída)."
                            actionText="Gerenciar Colunas"
                            onAction={() => setManageColumnsModalOpen(true)}
                            icon={<PaletteIcon className="w-12 h-12 mb-4 text-gray-400" />}
                        />
                    </GlassPanel>
                ) : Array.isArray(tasks) && tasks.length === 0 ? (
                     <GlassPanel className="p-8">
                        <EmptyState
                            title="Nenhuma tarefa por aqui"
                            message="Crie sua primeira tarefa para começar a se organizar."
                            actionText="Criar Nova Tarefa"
                            onAction={() => handleOpenTaskModal()}
                            icon={<CheckSquareIcon className="w-12 h-12 mb-4 text-gray-400" />}
                        />
                    </GlassPanel>
                ) : (
                    <GlassPanel className="p-4">
                        <KanbanBoard columns={columnsForBoard} onDragEnd={handleDragEnd}>
                            {(item) => <TaskCard 
                                task={item} 
                                onEdit={handleOpenTaskModal} 
                                onDelete={handleDeleteTask} 
                                onView={(task) => setViewingTask(task)}
                                users={users}
                                clients={clients}
                                leads={leads}
                            />}
                        </KanbanBoard>
                    </GlassPanel>
                )}
            </main>

            <TaskModal 
                isOpen={isTaskModalOpen} 
                onClose={() => setTaskModalOpen(false)} 
                onSave={handleSaveTask} 
                task={editingTask} 
            />
            
            <ManageColumnsModal
                isOpen={isManageColumnsModalOpen}
                onClose={() => setManageColumnsModalOpen(false)}
                onSave={handleSaveColumns}
                columns={taskColumns}
                boardId="tasks"
                title="Gerenciar Colunas de Tarefas"
                showConclusionButton={true}
            />
            
            <TaskViewModal 
                isOpen={!!viewingTask} 
                onClose={() => setViewingTask(null)} 
                task={viewingTask} 
                users={users}
                clients={clients}
                leads={leads}
            />
        </div>
    );
};

export default TasksPage;