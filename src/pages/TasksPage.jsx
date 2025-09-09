import React, { useState, useMemo, memo, useEffect } from 'react';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { motion } from 'framer-motion';

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
import { Avatar } from '../components/Avatar';

// Ícones e Utilitários
import { cn, formatDate } from '../utils';
import { PaletteIcon, PlusCircleIcon, PencilIcon, Trash2Icon, CheckSquareIcon, AlertTriangleIcon, ClockIcon } from '../components/Icons';

// =================================================================================
// VARIANTES DE ANIMAÇÃO
// =================================================================================
const boardVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const columnVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } } };
const cardVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } };

// =================================================================================
// SUBCOMPONENTES DA PÁGINA (Refinados e Animados)
// =================================================================================

const TaskViewModal = memo(({ isOpen, onClose, task, users, clients, leads }) => {
    if (!task) return null;
    const assignedUser = (users || []).find(u => u.id === task.assignedTo);
    const linkedItem = task.linkedToType === 'client' ? (clients || []).find(c => c.id === task.linkedToId) : (leads || []).find(l => l.id === task.linkedToId);
    const linkedItemName = linkedItem ? (linkedItem.general?.companyName || linkedItem.general?.holderName || linkedItem.name) : null;
    const renderDescription = (desc) => { if (!desc) return <p className="text-gray-500 italic">Nenhuma descrição fornecida.</p>; return (desc || '').split('\n').map((line, i) => <p key={i}>{line}</p>); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes: ${task.title}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <DetailItem label="Status" value={task.status} />
                    <DetailItem label="Prioridade"><Badge variant={task.priority === 'Alta' ? 'danger' : task.priority === 'Média' ? 'warning' : 'secondary'}>{task.priority}</Badge></DetailItem>
                    <DetailItem label="Prazo" value={formatDate(task.dueDate)} />
                    <DetailItem label="Responsável" value={assignedUser?.name} />
                    {linkedItemName && (<DetailItem label={`Vinculado a ${task.linkedToType === 'client' ? 'Cliente' : 'Lead'}`} value={linkedItemName} />)}
                </div>
                <div>
                    <Label>Descrição</Label>
                    <div className="mt-1 text-md text-gray-800 dark:text-gray-100 prose dark:prose-invert max-w-none">{renderDescription(task.description)}</div>
                </div>
            </div>
            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-white/10"><Button variant="outline" onClick={onClose}>Fechar</Button></div>
        </Modal>
    );
});

const TaskCard = memo(({ task, onEdit, onDelete, onView, users }) => {
    const assignedUser = (users || []).find(u => u.id === task.assignedTo);
    const isOverdue = task.dueDate && new Date(task.dueDate + 'T23:59:59') < new Date() && task.status !== 'Concluída';

    const priorityClasses = {
        'Alta': 'border-red-500',
        'Média': 'border-yellow-500',
        'Baixa': 'border-gray-400'
    };

    return (
        <motion.div variants={cardVariants} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <GlassPanel 
                className={cn("p-4 cursor-grab active:cursor-grabbing group border-l-4", priorityClasses[task.priority] || 'border-gray-400')}
                onDoubleClick={() => onView(task)}
            >
                <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900 dark:text-white flex-grow truncate pr-2" title={task.title}>{task.title}</p>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(task); }}><PencilIcon className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70" onClick={(e) => { e.stopPropagation(); onDelete(task); }}><Trash2Icon className="h-4 w-4" /></Button>
                    </div>
                </div>
                
                <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <ClockIcon className={cn("h-4 w-4", isOverdue ? "text-red-500" : "text-gray-400")} />
                        <span className={cn(isOverdue && "font-bold text-red-500")}>
                            {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
                        </span>
                    </div>
                    {assignedUser && <Avatar src={assignedUser.avatar} fallbackText={assignedUser.name?.[0]} title={assignedUser.name} className="w-6 h-6 text-xs" />}
                </div>
            </GlassPanel>
        </motion.div>
    );
});

const KanbanBoard = memo(({ columns, onDragEnd, children }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const handleDragStart = (e, item, sourceColumnId) => { setDraggedItem({ item, sourceColumnId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); };
    const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
    const handleDrop = (e, targetColumnId) => { e.preventDefault(); if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) { onDragEnd(draggedItem.item, targetColumnId); } setDraggedItem(null); setDragOverColumn(null); };

    return (
        <motion.div className="flex gap-6 overflow-x-auto p-2" variants={boardVariants} initial="hidden" animate="visible">
            {Object.values(columns).sort((a, b) => a.order - b.order).map((column) => (
                <motion.div key={column.id} variants={columnVariants} className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === column.id ? 'bg-gray-200/50 dark:bg-white/10' : '')} onDragOver={(e) => handleDragOver(e, column.id)} onDrop={(e) => handleDrop(e, column.id)} onDragLeave={() => setDragOverColumn(null)}>
                    <div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.color || '#3B82F6' }}>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {column.title}
                            {column.isConclusion && <CheckSquareIcon className="h-4 w-4 text-green-500" title="Coluna de Conclusão"/>}
                        </h3>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span>
                    </div>
                    <div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">
                        {column.items.length > 0 ? (column.items.map(item => (
                            <motion.div key={item.id} layout draggable onDragStart={(e) => handleDragStart(e, item, column.id)}>
                                {typeof children === 'function' && children(item)}
                            </motion.div>
                        ))) : (<div className="text-center text-sm text-gray-500 dark:text-gray-600 p-4">Nenhuma tarefa aqui.</div>)}
                    </div>
                </motion.div>
            ))}
        </motion.div>
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
    
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isManageColumnsModalOpen, setManageColumnsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);

    useEffect(() => {
        if (!Array.isArray(tasks) || !Array.isArray(taskColumns)) return;
        const conclusionColumn = taskColumns.find(c => c.isConclusion);
        if (!conclusionColumn || tasks.length === 0) return;

        const now = new Date();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const tasksToArchive = tasks.filter(task => {
            if (task.status === conclusionColumn.title && task.completedAt && !task.archived) {
                const completedDate = task.completedAt.toDate();
                return (now - completedDate) > twoDaysInMs;
            }
            return false;
        });

        if (tasksToArchive.length > 0) {
            const batch = writeBatch(db);
            tasksToArchive.forEach(task => {
                const taskRef = doc(db, "tasks", task.id);
                batch.update(taskRef, { archived: true });
            });
            batch.commit().then(() => {
                toast({ title: "Tarefas Arquivadas", description: `${tasksToArchive.length} tarefa(s) foram arquivadas automaticamente.` });
            });
        }
    }, [tasks, taskColumns, db, toast]);

    const columnsForBoard = useMemo(() => {
        const visibleTasks = (tasks || []).filter(task => !task.archived);
        if ((taskColumns || []).length === 0) return {};
        return taskColumns.reduce((acc, column) => {
            acc[column.id] = { ...column, items: visibleTasks.filter(t => t.status === column.title) };
            return acc;
        }, {});
    }, [taskColumns, tasks]);
    
    const handleOpenTaskModal = (task = null) => { setEditingTask(task); setTaskModalOpen(true); };

    const handleDragEnd = async (item, targetColumnId) => {
        const targetColumn = taskColumns.find(c => c.id === targetColumnId);
        if (!targetColumn) return;
        let updateData = { status: targetColumn.title };
        if (targetColumn.isConclusion) {
            updateData.completedAt = serverTimestamp();
            logAction({ actionType: 'CONCLUSÃO', module: 'Tarefas', description: `concluiu a tarefa "${item.title}".` });
        }
        await updateTask(item.id, updateData);
    };

    const handleSaveTask = async (taskData) => {
        if (taskData.id) {
            await updateTask(taskData.id, taskData);
        } else {
            const firstColumn = (taskColumns || []).sort((a,b) => a.order - b.order)[0];
            const status = firstColumn ? firstColumn.title : 'Pendente';
            await addTask({ ...taskData, status, archived: false });
        }
        setTaskModalOpen(false);
    };

    const handleDeleteTask = async (task) => {
        try {
            await confirm({ title: `Excluir Tarefa?`, description: `Tem certeza que deseja excluir "${task.title}"?` });
            await deleteTask(task.id, task.title);
        } catch (e) {}
    };

    const handleSaveColumns = async (updatedColumns) => {
        const batch = writeBatch(db);
        updatedColumns.forEach((col, index) => {
            const { id, ...data } = col;
            const docRef = id.startsWith('temp_') ? doc(collection(db, 'kanban_columns')) : doc(db, 'kanban_columns', id);
            batch.set(docRef, { ...data, boardId: 'tasks', order: index }, { merge: true });
        });
        await batch.commit();
        setManageColumnsModalOpen(false);
    };
    
    const isLoading = taskColumns === undefined;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.header 
                className="flex justify-between items-center mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setManageColumnsModalOpen(true)}><PaletteIcon className="h-4 w-4 mr-2"/>Gerenciar Colunas</Button>
                    <Button onClick={() => handleOpenTaskModal()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2" />Nova Tarefa</Button>
                </div>
            </motion.header>
            
            <main>
                {isLoading ? ( <div className="text-center p-8">Carregando quadro de tarefas...</div>
                ) : Array.isArray(taskColumns) && taskColumns.length === 0 ? (
                    <GlassPanel className="p-8"><EmptyState title="Configure seu Quadro de Tarefas" message="Clique em 'Gerenciar Colunas' para definir as etapas do seu fluxo (Ex: A Fazer, Em Andamento, Concluída)." actionText="Gerenciar Colunas" onAction={() => setManageColumnsModalOpen(true)} icon={<PaletteIcon className="w-12 h-12 mb-4 text-gray-400" />} /></GlassPanel>
                ) : (
                    <GlassPanel className="p-4">
                        <KanbanBoard columns={columnsForBoard} onDragEnd={handleDragEnd}>
                            {(item) => <TaskCard task={item} onEdit={handleOpenTaskModal} onDelete={handleDeleteTask} onView={(task) => setViewingTask(task)} users={users} />}
                        </KanbanBoard>
                    </GlassPanel>
                )}
            </main>

            <TaskModal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} task={editingTask} users={users} clients={clients} leads={leads} />
            <ManageColumnsModal isOpen={isManageColumnsModalOpen} onClose={() => setManageColumnsModalOpen(false)} onSave={handleSaveColumns} columns={taskColumns} boardId="tasks" title="Gerenciar Colunas de Tarefas" />
            <TaskViewModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask} users={users} clients={clients} leads={leads} />
        </div>
    );
};

export default TasksPage;