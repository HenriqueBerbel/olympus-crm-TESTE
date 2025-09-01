import React, { useState, useEffect } from 'react';
// REMOVIDO: As importações do Firestore não são mais necessárias neste componente.
// import { getFirestore, doc, collection, writeBatch } from "firebase/firestore";
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/NotificationContext';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { cn } from '../../utils';
import { GripVerticalIcon, CheckSquareIcon, ZapIcon, ArchiveIcon, Trash2Icon } from '../Icons';


const ManageColumnsModal = ({ isOpen, onClose, onSave, columns, boardId, title, showConversionButton = false, showConclusionButton = false }) => {
    const { deleteKanbanColumn, leads, tasks } = useData();
    const { toast } = useToast();
    // REMOVIDO: A instância do Firestore não é mais criada aqui.
    // const db = getFirestore();

    const [localColumns, setLocalColumns] = useState([]);
    const [newColumnTitle, setNewColumnTitle] = useState("");

    useEffect(() => {
        if (isOpen) {
            const initializedColumns = (columns || []).map(col => ({
                ...col,
                isConversion: col.isConversion || false,
                isArchiveColumn: col.isArchiveColumn || false,
                isConclusion: col.isConclusion || false,
            }));
            setLocalColumns(initializedColumns);
        }
    }, [columns, isOpen]);

    const handleTitleChange = (id, newTitle) => {
        setLocalColumns(prev => prev.map(col => col.id === id ? { ...col, title: newTitle } : col));
    };

    const handleSetConversion = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isConversion: col.id === id, isConclusion: false, isArchiveColumn: col.id === id ? false : col.isArchiveColumn })));
    };
    
    const handleSetConclusion = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isConclusion: col.id === id, isConversion: false, isArchiveColumn: col.id === id ? false : col.isArchiveColumn })));
    };

    const handleSetArchive = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isArchiveColumn: col.id === id, isConversion: false, isConclusion: false })));
    };

    const handleAddNewColumn = () => {
        if (newColumnTitle.trim() === "") return;
        const newColumn = {
            id: `temp_${Date.now()}`,
            title: newColumnTitle,
            color: '#3B82F6',
            isConversion: false,
            isConclusion: false,
            isArchiveColumn: false,
            order: localColumns.length,
            boardId: boardId,
        };
        setLocalColumns(prev => [...prev, newColumn]);
        setNewColumnTitle("");
    };

    const handleDelete = async (id, title) => {
        if (id.startsWith('temp_')) {
            setLocalColumns(prev => prev.filter(col => col.id !== id));
        } else {
            const itemsInColumn = boardId === 'leads' ? (leads || []).filter(l => l.status === title).length : (tasks || []).filter(t => t.status === title).length;
            if (itemsInColumn > 0) {
                toast({ title: "Coluna não está vazia!", description: "Mova os itens para outra coluna antes de excluir.", variant: 'destructive' });
                return;
            }
            if (await deleteKanbanColumn(id)) {
                setLocalColumns(prev => prev.filter(col => col.id !== id));
                toast({ title: "Coluna removida" });
            }
        }
    };
    
    // ALTERADO: A função agora é muito mais simples.
    // Ela apenas entrega o estado atualizado das colunas para o componente pai através do onSave.
    // O componente pai (LeadsPage) será o único responsável por fazer a chamada ao banco de dados.
    const handleSave = () => {
        if (onSave) {
            onSave(localColumns);
        }
        // A responsabilidade de fechar o modal (onClose) foi movida para o componente pai,
        // que o fechará somente após o salvamento ser concluído com sucesso.
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Arraste para reordenar. Defina as colunas especiais.</p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {localColumns.map(col => (
                        <div key={col.id} className="flex items-center gap-3 bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
                            <GripVerticalIcon className="h-5 w-5 text-gray-400 cursor-move" />
                            <Input value={col.title} onChange={(e) => handleTitleChange(col.id, e.target.value)} className="flex-grow"/>
                            
                            {showConclusionButton && (
                                <button onClick={() => handleSetConclusion(col.id)} title="Marcar como coluna de CONCLUSÃO" className={cn("p-2 rounded-full transition-colors", col.isConclusion ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400")}>
                                    <CheckSquareIcon className="h-4 w-4" />
                                </button>
                            )}
                            {showConversionButton && (
                                <button onClick={() => handleSetConversion(col.id)} title="Marcar como coluna de CONVERSÃO" className={cn("p-2 rounded-full transition-colors", col.isConversion ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400")}>
                                    <ZapIcon className={cn("h-4 w-4", col.isConversion && "text-white")} />
                                </button>
                            )}

                            <button onClick={() => handleSetArchive(col.id)} title="Marcar como coluna de ARQUIVO/DESCARTE" className={cn("p-2 rounded-full transition-colors", col.isArchiveColumn ? "bg-red-600 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-red-500")}>
                                <ArchiveIcon className="h-4 w-4" />
                            </button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDelete(col.id, col.title)}>
                                <Trash2Icon className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Adicionar Nova Coluna</h3>
                    <div className="flex gap-3 mt-2">
                        <Input value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Nome da nova coluna" />
                        <Button onClick={handleAddNewColumn}>Adicionar</Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button variant="violet" onClick={handleSave}>Salvar Alterações</Button>
            </div>
        </Modal>
    );
};

export default ManageColumnsModal;