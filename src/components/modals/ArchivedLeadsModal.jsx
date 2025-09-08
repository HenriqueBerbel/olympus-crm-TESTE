import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import EmptyState from '../EmptyState';
import { formatDateTime } from '../../utils';
import { useToast } from '../../contexts/NotificationContext';

const ArchivedLeadsModal = ({ isOpen, onClose, allLeads, onUnarchive }) => {
    const { toast } = useToast();
    // MELHORIA: Estado para rastrear o ID do lead sendo restaurado
    const [restoringLeadId, setRestoringLeadId] = useState(null);

    // MELHORIA: O cálculo da lista é memorizado para melhor performance.
    // Ele só será refeito se a lista 'allLeads' mudar.
    const archivedLeads = useMemo(() => {
        return (allLeads || [])
            .filter(l => l.archived)
            .sort((a, b) => (b.archivedAt?.toDate() || 0) - (a.archivedAt?.toDate() || 0));
    }, [allLeads]);

    // MELHORIA: Função robusta para lidar com a restauração
    const handleUnarchive = async (lead) => {
        if (restoringLeadId) return; // Impede outra ação se uma já estiver em andamento

        setRestoringLeadId(lead.id);
        try {
            await onUnarchive(lead.id);
            toast({ title: "Sucesso!", description: `O lead "${lead.name}" foi restaurado.` });
            // Não precisamos fechar o modal, a lista se atualizará automaticamente
        } catch (error) {
            console.error("Falha ao restaurar lead:", error);
            toast({ title: "Erro", description: "Não foi possível restaurar o lead.", variant: "destructive" });
        } finally {
            setRestoringLeadId(null);
        }
    };

    return (
        // MELHORIA: Adicionado closeOnClickOutside={false}
        <Modal isOpen={isOpen} onClose={onClose} title="Leads Arquivados" size="5xl" closeOnClickOutside={false}>
            <div className="max-h-[60vh] overflow-y-auto">
                {archivedLeads.length > 0 ? (
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10 sticky top-0 bg-gray-50 dark:bg-[#0D1117]">
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
                                        {/* MELHORIA: Botão com estado de carregamento */}
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleUnarchive(lead)}
                                            disabled={restoringLeadId !== null} // Desabilita todos os botões durante uma ação
                                        >
                                            {restoringLeadId === lead.id ? 'Restaurando...' : 'Restaurar'}
                                        </Button>
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
                <Button variant="outline" onClick={onClose} disabled={restoringLeadId !== null}>Fechar</Button>
            </div>
        </Modal>
    )
};

export default ArchivedLeadsModal;