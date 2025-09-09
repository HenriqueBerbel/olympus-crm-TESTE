import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Hooks e Contextos
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

// ========================================================================
//          *** VARIAÇÕES DE ANIMAÇÃO ***
// ========================================================================
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: index * 0.05, // Efeito cascata suave
            duration: 0.5,
            ease: "easeOut"
        }
    })
};

// ========================================================================
//          *** PÁGINA DE GESTÃO DE COMISSÕES ***
// ========================================================================
const CommissionsPage = () => {
    const { commissions, addCommission, loading, users, clients } = useData();
    const { toast } = useToast();
    const [isWizardOpen, setWizardOpen] = useState(false);

    // [MELHORIA] A função onSave agora é mais robusta
    const handleSave = async (commissionData) => {
        try {
            const result = await addCommission(commissionData);
            // A notificação de sucesso já é tratada pelo DataContext, mas podemos adicionar uma específica se quisermos.
            // toast({ title: "Sucesso!", description: `Comissão para ${result.clientName} foi lançada.` });
            setWizardOpen(false);
        } catch (error) {
            // O DataContext também trata o erro, mas podemos ter um fallback.
            toast({ title: "Erro", description: "Não foi possível salvar a comissão.", variant: 'destructive' });
        }
    };
    
    // [MELHORIA] Ordenando comissões por data para uma visualização mais lógica
    const sortedCommissions = useMemo(() => {
        if (!Array.isArray(commissions)) return [];
        return [...commissions].sort((a, b) => {
            const dateA = a.firstDueDate?.toDate ? a.firstDueDate.toDate() : new Date(0);
            const dateB = b.firstDueDate?.toDate ? b.firstDueDate.toDate() : new Date(0);
            return dateB - dateA; // Mais recente primeiro
        });
    }, [commissions]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.div 
                className="flex justify-between items-center mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Comissões</h2>
                <Button onClick={() => setWizardOpen(true)} variant="violet">
                    <PlusCircleIcon className="h-5 w-5 mr-2" /> Lançar Nova Comissão
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
                                {loading && sortedCommissions.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={5} />)
                                ) : sortedCommissions.length > 0 ? (
                                    sortedCommissions.map((com, index) => {
                                        const broker = users.find(u => u.id === com.brokerId);
                                        const totalCommission = (com.contractValue || 0) * ((parseFloat(com.commissionRate) || 0) / 100);
                                        return (
                                            <motion.tr 
                                                key={com.id} 
                                                className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5"
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                custom={index} // Passa o índice para o delay da animação
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{com.clientName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{broker?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-white">{formatCurrency(totalCommission)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><Badge>{com.paymentStatus}</Badge></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(com.firstDueDate)}</td>
                                            </motion.tr>
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
            </motion.div>

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