// src/pages/CommissionsPage.jsx

import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SkeletonRow from '../components/SkeletonRow';
import Badge from '../components/Badge';
import CommissionWizardModal from '../components/modals/CommissionWizardModal';
import { PlusCircleIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

const CommissionsPage = () => {
    const { commissions, addCommission, loading, users, clients } = useData();
    const { toast } = useToast();
    const [isWizardOpen, setWizardOpen] = useState(false);

    const handleSave = async (commissionData) => {
        const result = await addCommission(commissionData);
        if (result) {
            toast({ title: "Sucesso!", description: `Comissão para ${result.clientName} foi lançada.` });
            setWizardOpen(false);
        } else {
            toast({ title: "Erro", description: "Não foi possível salvar a comissão.", variant: 'destructive' });
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Comissões</h2>
                <Button onClick={() => setWizardOpen(true)} variant="violet">
                    <PlusCircleIcon className="h-5 w-5 mr-2" /> Lançar Nova Comissão
                </Button>
            </div>
            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>
                                {['Cliente', 'Corretor', 'Valor Comissão', 'Status', 'Vencimento'].map(h => 
                                    <th key={h} scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {/* --- CORREÇÃO APLICADA AQUI --- */}
                            {/* Verificamos se `commissions` existe ANTES de acessar `commissions.length` */}
                            {loading && (!commissions || commissions.length === 0) ? (
                                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : Array.isArray(commissions) && commissions.length > 0 ? (
                                commissions.map(com => {
                                    const broker = users.find(u => u.id === com.brokerId);
                                    // A taxa de comissão deve ser dividida por 100 se for inserida como porcentagem (ex: 3.5 para 3.5%)
                                    const totalCommission = (com.contractValue || 0) * ((parseFloat(com.commissionRate) || 0) / 100);
                                    return (
                                        <tr key={com.id} className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{com.clientName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{broker?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-white">{formatCurrency(totalCommission)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><Badge>{com.paymentStatus}</Badge></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(com.firstDueDate)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5">
                                        <EmptyState 
                                            title="Nenhuma Comissão Lançada" 
                                            message="Comece lançando sua primeira comissão para vê-la aqui." 
                                            actionText="Lançar Nova Comissão" 
                                            onAction={() => setWizardOpen(true)} 
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassPanel>

            <CommissionWizardModal 
                isOpen={isWizardOpen} 
                onClose={() => setWizardOpen(false)} 
                onSave={handleSave}
                clients={clients}
                users={users}
            />
        </div>
    );
}

export default CommissionsPage;