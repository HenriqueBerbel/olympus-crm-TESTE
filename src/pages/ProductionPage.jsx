import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart } from '@tremor/react';

// Hooks e Utilitários
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../utils';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import ProductionModal from '../components/modals/ProductionModal';

// Ícones
import { PlusCircleIcon, PencilIcon, Trash2Icon, DollarSignIcon, UsersIcon, BriefcaseIcon } from '../components/Icons';


// ='======================================================================
//          *** VARIANTES DE ANIMAÇÃO ***
// ========================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};


// ========================================================================
//          *** PÁGINA DE PRODUÇÃO ***
// ========================================================================
const ProductionPage = ({ onNavigate }) => {
    const { productions, users, partners, operators, addProduction, updateProduction, deleteProduction, loading } = useData();
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const { theme } = useTheme();

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProduction, setEditingProduction] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const processedData = useMemo(() => {
        const allMonths = new Set();
        (productions || []).forEach(prod => {
            const date = prod.saleDate ? new Date(prod.saleDate + 'T00:00:00') : prod.createdAt?.toDate();
            if (!date) return;
            allMonths.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        
        const sortedMonths = Array.from(allMonths).sort().reverse();
        if (!sortedMonths.includes(selectedMonth)) {
            sortedMonths.unshift(selectedMonth);
        }

        const filteredEntries = (productions || []).filter(prod => {
            const date = prod.saleDate ? new Date(prod.saleDate + 'T00:00:00') : prod.createdAt?.toDate();
            if (!date) return false;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === selectedMonth;
        });

        const totals = { brokers: {}, partners: {}, monthly: 0 };
        filteredEntries.forEach(prod => {
            const broker = users.find(u => u.id === prod.brokerId);
            const commission = parseFloat(prod.commissionValue) || 0;
            const award = parseFloat(prod.awardValue) || 0;
            const totalValue = commission + award;

            if (broker) {
                totals.brokers[broker.name] = (totals.brokers[broker.name] || 0) + totalValue;
            }
            if (prod.partner) {
                totals.partners[prod.partner] = (totals.partners[prod.partner] || 0) + award;
            }
            totals.monthly += totalValue;
        });
        
        const brokerChartData = Object.entries(totals.brokers)
            .map(([name, value]) => ({ name: name.split(' ')[0], "Produção Total": value }))
            .sort((a, b) => b["Produção Total"] - a["Produção Total"]);

        return { months: sortedMonths, entries: filteredEntries, totals, brokerChartData };
    }, [productions, selectedMonth, users]);

    const handleOpenModal = (prod = null) => {
        setEditingProduction(prod);
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        const result = data.id ? await updateProduction(data.id, data) : await addProduction(data);
        if (result) {
            setModalOpen(false);
        }
    };

    const handleDelete = async (prod) => {
        try {
            await confirm({ 
                title: `Excluir produção de ${prod.clientName}?`, 
                description: "Esta ação não pode ser desfeita."
            });
            await deleteProduction(prod.id, prod.clientName);
        } catch (e) {
            console.log("Ação de exclusão cancelada.");
        }
    };
    
    const valueFormatter = (number) => `${formatCurrency(number)}`;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.div 
                className="flex flex-wrap justify-between items-center mb-6 gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Produção</h2>
                <div className="flex items-center gap-4">
                    <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        {processedData.months.map(month => (
                            <option key={month} value={month}>
                                {new Date(month + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                            </option>
                        ))}
                    </Select>
                    <Button onClick={() => handleOpenModal()} variant="violet">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Lançar Produção
                    </Button>
                </div>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <GlassPanel className="p-5">
                        <div className="flex items-center gap-4">
                            <DollarSignIcon className="h-8 w-8 text-cyan-500"/>
                            <div>
                                <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total do Mês</h3>
                                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(processedData.totals.monthly)}</p>
                            </div>
                        </div>
                    </GlassPanel>
                </motion.div>
                <motion.div variants={itemVariants}>
                     <GlassPanel className="p-5">
                        <div className="flex items-center gap-4">
                            <UsersIcon className="h-8 w-8 text-violet-500"/>
                            <div>
                                <h3 className="font-semibold text-gray-600 dark:text-gray-300">Corretores</h3>
                                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{Object.keys(processedData.totals.brokers).length}</p>
                            </div>
                        </div>
                    </GlassPanel>
                </motion.div>
                <motion.div variants={itemVariants}>
                     <GlassPanel className="p-5">
                        <div className="flex items-center gap-4">
                            <BriefcaseIcon className="h-8 w-8 text-amber-500"/>
                            <div>
                                <h3 className="font-semibold text-gray-600 dark:text-gray-300">Parceiros</h3>
                                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{Object.keys(processedData.totals.partners).length}</p>
                            </div>
                        </div>
                    </GlassPanel>
                </motion.div>
            </motion.div>
            
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="lg:col-span-3">
                    <GlassPanel>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b border-gray-200 dark:border-white/10">
                                    <tr>
                                        {['Cliente', 'Data', 'Corretor', 'Comissão', 'Prêmio', 'Total', ''].map(h => 
                                            <th key={h} scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                    <AnimatePresence>
                                    {loading && processedData.entries.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center p-8 text-gray-500">Carregando...</td></tr>
                                    ) : processedData.entries.length > 0 ? (
                                        processedData.entries.map((prod, index) => {
                                            const broker = users.find(u => u.id === prod.brokerId);
                                            const commission = parseFloat(prod.commissionValue) || 0;
                                            const award = parseFloat(prod.awardValue) || 0;
                                            return (
                                                <motion.tr 
                                                    key={prod.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{prod.clientName}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(prod.saleDate)}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{broker?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatCurrency(commission)}</td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatCurrency(award)}</td>
                                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{formatCurrency(commission + award)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(prod)}><PencilIcon className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500/80" onClick={() => handleDelete(prod)}><Trash2Icon className="h-4 w-4" /></Button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="7"><EmptyState title="Nenhuma Produção Lançada" message="Comece lançando a primeira produção deste mês." actionText="Lançar Produção" onAction={handleOpenModal} /></td></tr>
                                    )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </GlassPanel>
                </div>
                <div className="lg:col-span-2">
                    <GlassPanel className="p-6 h-full">
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Produção por Corretor</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total comissão + prêmio no mês.</p>
                         {processedData.brokerChartData.length > 0 ? (
                            <BarChart
                                data={processedData.brokerChartData}
                                index="name"
                                categories={["Produção Total"]}
                                colors={theme === 'dark' ? ["#a78bfa"] : ["#8b5cf6"]}
                                valueFormatter={valueFormatter}
                                yAxisWidth={70}
                                className="mt-6 h-96"
                                showAnimation={true}
                            />
                         ) : (
                            <EmptyState title="Sem dados para o gráfico" message="Lance produções para visualizar o desempenho."/>
                         )}
                    </GlassPanel>
                </div>
            </motion.div>

            <ProductionModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSave} 
                production={editingProduction}
                users={users}
                partners={partners}
                operators={operators}
            />
        </div>
    );
};

export default ProductionPage;