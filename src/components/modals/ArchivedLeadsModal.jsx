import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import EmptyState from '../EmptyState';
import { formatDateTime } from '../../utils';

const ArchivedLeadsModal = ({ isOpen, onClose, allLeads, onUnarchive }) => {
    const archivedLeads = (allLeads || []).filter(l => l.archived).sort((a, b) => (b.archivedAt?.toDate() || 0) - (a.archivedAt?.toDate() || 0));

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
    )
};

export default ArchivedLeadsModal;