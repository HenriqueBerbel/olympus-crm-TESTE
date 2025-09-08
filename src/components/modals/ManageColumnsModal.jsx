import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/NotificationContext';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { cn } from '../../utils';
import { GripVerticalIcon, CheckSquareIcon, ZapIcon, ArchiveIcon, Trash2Icon } from '../Icons';

// --- MELHORIA: Implementação do Drag-and-Drop ---
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente auxiliar para um item de coluna arrastável
const SortableColumnItem = ({ col, onTitleChange, onSetSpecial, onDelete, isSaving, isDeleting }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
            <button {...attributes} {...listeners} className="cursor-move p-1" disabled={isSaving || isDeleting}><GripVerticalIcon className="h-5 w-5 text-gray-400" /></button>
            <Input value={col.title} onChange={(e) => onTitleChange(col.id, e.target.value)} className="flex-grow" disabled={isSaving || isDeleting} />
            
            {/* Lógica dos botões de ação simplificada */}
            <button onClick={() => onSetSpecial('isConclusion', col.id)} title="Marcar como coluna de Conclusão" className={cn("p-2 rounded-full", col.isConclusion ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400")} disabled={isSaving || isDeleting}><CheckSquareIcon className="h-4 w-4" /></button>
            <button onClick={() => onSetSpecial('isConversion', col.id)} title="Marcar como coluna de Conversão" className={cn("p-2 rounded-full", col.isConversion ? "bg-cyan-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-cyan-400")} disabled={isSaving || isDeleting}><ZapIcon className="h-4 w-4" /></button>
            <button onClick={() => onSetSpecial('isArchiveColumn', col.id)} title="Marcar como coluna de Arquivo/Descarte" className={cn("p-2 rounded-full", col.isArchiveColumn ? "bg-yellow-600 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-yellow-500")} disabled={isSaving || isDeleting}><ArchiveIcon className="h-4 w-4" /></button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => onDelete(col.id, col.title)} disabled={isSaving || isDeleting}><Trash2Icon className="h-4 w-4" /></Button>
        </div>
    );
};

const ManageColumnsModal = ({ isOpen, onClose, onSave, columns, boardId, title }) => {
    const { deleteKanbanColumn, leads, tasks } = useData();
    const { toast } = useToast();
    
    const [localColumns, setLocalColumns] = useState([]);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initializedColumns = (columns || []).map(col => ({
                ...col, isConversion: col.isConversion || false,
                isArchiveColumn: col.isArchiveColumn || false, isConclusion: col.isConclusion || false,
            }));
            setLocalColumns(initializedColumns);
        }
    }, [columns, isOpen]);

    const handleTitleChange = (id, newTitle) => setLocalColumns(prev => prev.map(col => col.id === id ? { ...col, title: newTitle } : col));

    const handleSetSpecial = (type, id) => {
        setLocalColumns(prev => prev.map(col => {
            if (col.id === id) {
                // Ao marcar um tipo, desmarca os outros
                return { ...col, isConclusion: type === 'isConclusion' ? !col.isConclusion : false, isConversion: type === 'isConversion' ? !col.isConversion : false, isArchiveColumn: type === 'isArchiveColumn' ? !col.isArchiveColumn : false };
            }
            // Garante que só uma coluna de cada tipo especial exista
            return { ...col, [type]: false };
        }));
    };

    const handleAddNewColumn = () => {
        if (newColumnTitle.trim() === "") return;
        const newColumn = {
            id: `temp_${Date.now()}`, title: newColumnTitle.trim(), color: '#3B82F6', isConversion: false,
            isConclusion: false, isArchiveColumn: false, order: localColumns.length, boardId: boardId,
        };
        setLocalColumns(prev => [...prev, newColumn]);
        setNewColumnTitle("");
    };

    const handleDelete = async (id, title) => {
        if (isSaving || isDeleting) return;
        if (id.startsWith('temp_')) {
            setLocalColumns(prev => prev.filter(col => col.id !== id));
            return;
        }

        const itemsInColumn = boardId === 'leads' ? leads.filter(l => l.status === title).length : tasks.filter(t => t.status === title).length;
        if (itemsInColumn > 0) {
            toast({ title: "Coluna não está vazia!", description: `Mova os ${itemsInColumn} itens para outra coluna antes de excluir.`, variant: 'destructive' });
            return;
        }

        setIsDeleting(true);
        try {
            await deleteKanbanColumn(id);
            setLocalColumns(prev => prev.filter(col => col.id !== id));
            toast({ title: "Coluna removida" });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível remover a coluna.", variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleSave = async () => {
        if (isSaving || isDeleting) return;
        setIsSaving(true);
        try {
            await onSave(localColumns);
            toast({ title: "Sucesso!", description: "Ordem das colunas salva com sucesso." });
            // O componente pai fecha o modal
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    // Lógica do Drag-and-Drop
    const sensors = useSensors(useSensor(PointerSensor));
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setLocalColumns((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl" closeOnClickOutside={false}>
            <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Arraste <GripVerticalIcon className="inline h-4 w-4"/> para reordenar. Defina as colunas especiais de ação.</p>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localColumns} strategy={verticalListSortingStrategy}>
                            {localColumns.map(col => (
                                <SortableColumnItem 
                                    key={col.id} 
                                    col={col} 
                                    onTitleChange={handleTitleChange}
                                    onSetSpecial={handleSetSpecial}
                                    onDelete={handleDelete}
                                    isSaving={isSaving}
                                    isDeleting={isDeleting}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Adicionar Nova Coluna</h3>
                    <div className="flex gap-3 mt-2">
                        <Input value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Nome da nova coluna" disabled={isSaving || isDeleting}/>
                        <Button onClick={handleAddNewColumn} disabled={isSaving || isDeleting || !newColumnTitle.trim()}>Adicionar</Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>Cancelar</Button>
                <Button variant="violet" onClick={handleSave} disabled={isSaving || isDeleting}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </Modal>
    );
};

export default ManageColumnsModal;