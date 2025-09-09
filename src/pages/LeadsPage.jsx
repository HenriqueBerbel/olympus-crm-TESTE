import React, { useState, useMemo, memo } from 'react';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { motion } from 'framer-motion';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';

// Serviços e Utilitários
import { cn, formatDateTime } from '../utils';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

// Modais Específicos
import LeadModal from '../components/modals/LeadModal';
import ManageColumnsModal from '../components/modals/ManageColumnsModal';
import ShareModal from '../components/modals/ShareModal';

// Ícones
import { ArchiveIcon, PaletteIcon, PlusCircleIcon, PencilIcon, Trash2Icon, ZapIcon, Share2Icon } from '../components/Icons';

// =============================================================================
// VARIANTES DE ANIMAÇÃO (Receitas para as Animações)
// =============================================================================
const boardVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const columnVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.07,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};


// =============================================================================
// SUBCOMPONENTES
// =============================================================================

const ArchivedLeadsModal = memo(({ isOpen, onClose, allLeads, onUnarchive }) => {
    const archivedLeads = useMemo(() =>
        (Array.isArray(allLeads) ? allLeads : [])
            .filter(l => l.archived)
            .sort((a, b) => (b.archivedAt?.toDate() || 0) - (a.archivedAt?.toDate() || 0)),
        [allLeads]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Leads Arquivados" size="5xl">
            <div className="max-h-[60vh] overflow-y-auto">
                {archivedLeads.length > 0 ? (
                    <table className="min-w-full">
                         <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Nome do Lead</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Empresa</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Data do Arquivamento</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-500 dark:text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {archivedLeads.map(lead => (
                                <tr key={lead.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lead.company || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDateTime(lead.archivedAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" onClick={() => onUnarchive(lead.id)}>Restaurar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState title="Nenhum Lead Arquivado" message="Quando você mover um lead para a coluna de descarte, ele aparecerá aqui." />
                )}
            </div>
            <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    );
});

const LeadCard = memo(({ lead, onEdit, onDelete, onShare }) => (
    <motion.div whileHover={{ scale: 1.03, zIndex: 10 }} whileTap={{ scale: 0.98 }}>
        <GlassPanel className="p-3 cursor-grab active:cursor-grabbing group">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-sm text-gray-900 dark:text-white flex-grow truncate" title={lead.name}>{lead.name}</p>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Compartilhar" onClick={() => onShare(lead)}><Share2Icon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => onEdit(lead)}><PencilIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70" title="Excluir" onClick={() => onDelete(lead)}><Trash2Icon className="h-4 w-4" /></Button>
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lead.company || 'Sem empresa'}</p>
        </GlassPanel>
    </motion.div>
));

const KanbanBoard = memo(({ columns, onDragEnd, children }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const handleDragStart = (e, item, sourceColumnId) => {
        setDraggedItem({ item, sourceColumnId });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    };
    const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
    const handleDrop = (e, targetColumnId) => {
        e.preventDefault();
        if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) {
            onDragEnd(draggedItem.item, targetColumnId);
        }
        setDraggedItem(null);
        setDragOverColumn(null);
    };
    const handleDragLeave = () => { setDragOverColumn(null); };

    const sortedColumns = useMemo(() =>
        Object.values(columns || {}).sort((a, b) => a.order - b.order),
        [columns]
    );

    return (
        <motion.div className="flex gap-6 overflow-x-auto p-2" variants={boardVariants} initial="hidden" animate="visible">
            {sortedColumns.map((column) => (
                <motion.div
                    key={column.id}
                    variants={columnVariants}
                    className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === column.id ? 'bg-gray-200/50 dark:bg-white/10' : '')}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDrop={(e) => handleDrop(e, column.id)}
                    onDragLeave={handleDragLeave}
                >
                    <div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.color || '#3B82F6' }}>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">{column.title}</h3>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span>
                    </div>
                    <div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">
                        {column.items.length > 0 ? (
                            column.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    variants={cardVariants}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item, column.id)}
                                >
                                    {typeof children === 'function' && children(item)}
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">Nenhum lead aqui.</div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
});


// =============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// =============================================================================
const LeadsPage = ({ onNavigate }) => {
    // Hooks
    const { leads, users, updateLead, addLead, deleteLead, leadColumns } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();
    const db = getFirestore();

    // Estados dos Modais
    const [isLeadModalOpen, setLeadModalOpen] = useState(false);
    const [isManageColumnsModalOpen, setManageColumnsModalOpen] = useState(false);
    const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [sharingLead, setSharingLead] = useState(null);

    const columnsForBoard = useMemo(() => {
        const safeLeadColumns = Array.isArray(leadColumns) ? leadColumns : [];
        const safeLeads = Array.isArray(leads) ? leads : [];
        const visibleLeads = safeLeads.filter(lead => !lead.archived);
        return safeLeadColumns.reduce((acc, column) => {
            acc[column.id] = { ...column, items: visibleLeads.filter(l => l.status === column.title) };
            return acc;
        }, {});
    }, [leadColumns, leads]);

    const handleDragEnd = async (item, targetColumnId) => {
        const targetColumn = leadColumns.find(c => c.id === targetColumnId);
        if (!targetColumn) return;
        try {
            if (targetColumn.isConversion) {
                onNavigate('convert-lead', item.id);
            } else if (targetColumn.isArchiveColumn) {
                await confirm({ title: `Arquivar Lead?`, description: `"${item.name}" será removido do funil, mas poderá ser restaurado.` });
                await updateLead(item.id, { ...item, archived: true, status: targetColumn.title, archivedAt: serverTimestamp() });
            } else {
                const newStatus = targetColumn.title;
                await updateLead(item.id, { ...item, status: newStatus });
            }
        } catch (error) {
            if (error) { console.log("Ação de arrastar cancelada ou falhou."); }
        }
    };
    
    const handleSaveColumns = async (updatedColumns) => {
        const batch = writeBatch(db);
        updatedColumns.forEach((col, index) => {
            const { id, ...data } = col;
            const docRef = id.startsWith('temp_') ? doc(collection(db, 'kanban_columns')) : doc(db, 'kanban_columns', id);
            batch.set(docRef, { ...data, order: index, boardId: 'leads' }, { merge: true });
        });
        try {
            await batch.commit();
            toast({ title: "Sucesso!", description: "Estrutura do funil foi salva." });
            setManageColumnsModalOpen(false);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: 'destructive' });
        }
    };

    const handleUnarchive = async (leadId) => {
        const sortedColumns = [...(leadColumns || [])].sort((a, b) => a.order - b.order);
        const firstColumn = sortedColumns.find(c => !c.isArchiveColumn && !c.isConversion);
        if (!firstColumn) {
            toast({ title: "Erro", description: "Nenhuma coluna de funil válida encontrada.", variant: 'destructive' });
            return;
        }
        await updateLead(leadId, { archived: false, archivedAt: null, status: firstColumn.title });
    };

    const handleOpenLeadModal = (lead = null) => {
        setEditingLead(lead);
        setLeadModalOpen(true);
    };

    const handleDeleteLead = async (lead) => {
        try {
            await confirm({
                title: `Excluir o lead ${lead.name}?`,
                description: "Esta ação é permanente e não pode ser desfeita.",
                confirmText: "Sim, Excluir",
                cancelText: "Cancelar"
            });
            await deleteLead(lead.id, lead.name);
        } catch (rejection) {
            console.log("Ação de exclusão cancelada pelo usuário.");
        }
    };

    const handleSaveLead = async (leadData) => {
        try {
            if (leadData.id) {
                await updateLead(leadData.id, leadData);
            } else {
                const firstColumn = (leadColumns || []).sort((a, b) => a.order - b.order)[0];
                const status = firstColumn ? firstColumn.title : 'Novo';
                await addLead({ ...leadData, status, archived: false });
            }
            setLeadModalOpen(false);
        } catch (error) {
             toast({ title: "Erro ao Salvar", description: error.message, variant: 'destructive' });
        }
    };

    const handleOpenShareModal = (lead) => {
        setSharingLead(lead);
        setShareModalOpen(true);
    };

    const handleSaveShare = async (leadId, data) => { await updateLead(leadId, data); };
    
    const isLoading = leadColumns === undefined;
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <motion.h2 className="text-3xl font-bold text-gray-900 dark:text-white" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    Funil de Leads
                </motion.h2>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setManageColumnsModalOpen(true)}><PaletteIcon className="h-4 w-4 mr-2"/>Gerenciar Colunas</Button>
                    <Button variant="outline" onClick={() => setArchiveModalOpen(true)}><ArchiveIcon className="h-4 w-4 mr-2"/>Ver Arquivados</Button>
                    <Button onClick={() => handleOpenLeadModal()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2" />Adicionar Lead</Button>
                </div>
            </header>
            
            <main>
                {isLoading ? (
                    <div className="flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-black/20 h-96">
                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Carregando funil...</p>
                    </div>
                ) : Array.isArray(leadColumns) && leadColumns.length === 0 ? (
                    <GlassPanel className="p-8">
                        <EmptyState
                            title="Crie seu Funil de Vendas"
                            message="Você ainda não configurou nenhuma coluna. Clique em 'Gerenciar Colunas' para começar a organizar seus leads."
                            icon={<PaletteIcon className="w-12 h-12 mb-4 text-gray-400" />}
                            actionText="Gerenciar Colunas"
                            onAction={() => setManageColumnsModalOpen(true)}
                        />
                    </GlassPanel>
                // [LÓGICA DE EXIBIÇÃO CORRIGIDA]
                // Removemos a verificação de leads vazios daqui.
                // Se houver colunas, o KanbanBoard será renderizado, e ele mesmo tratará colunas vazias.
                ) : (
                    <GlassPanel className="p-4">
                        <KanbanBoard columns={columnsForBoard} onDragEnd={handleDragEnd}>
                            {(item) => <LeadCard 
                                            lead={item} 
                                            onEdit={handleOpenLeadModal} 
                                            onDelete={handleDeleteLead}
                                            onShare={handleOpenShareModal}
                                        />}
                        </KanbanBoard>
                    </GlassPanel>
                )}
            </main>

            {/* Modais */}
            <LeadModal 
                isOpen={isLeadModalOpen} 
                onClose={() => setLeadModalOpen(false)} 
                onSave={handleSaveLead} 
                lead={editingLead} 
            />
            <ManageColumnsModal
                isOpen={isManageColumnsModalOpen}
                onClose={() => setManageColumnsModalOpen(false)}
                onSave={handleSaveColumns}
                columns={leadColumns || []}
                boardId="leads"
                title="Gerenciar Colunas do Funil"
            />
            <ArchivedLeadsModal
                isOpen={isArchiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                allLeads={leads}
                onUnarchive={handleUnarchive}
            />
            {sharingLead && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    onSave={handleSaveShare}
                    documentData={sharingLead}
                    allUsers={users}
                />
            )}
        </div>
    );
};

export default LeadsPage;