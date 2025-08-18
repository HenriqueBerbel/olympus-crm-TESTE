import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import ProductionModal from '../components/modals/ProductionModal';
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

const ProductionPage = ({ onNavigate }) => {
    const { productions, users, partners, operators, addProduction, updateProduction, deleteProduction, loading } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProduction, setEditingProduction] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const processedData = useMemo(() => {
        const dataByMonth = {};
        const allMonths = new Set();

        (productions || []).forEach(prod => {
            const date = prod.saleDate ? new Date(prod.saleDate + 'T00:00:00') : prod.createdAt?.toDate();
            if (!date) return;

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            allMonths.add(monthKey);

            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = { entries: [], totals: { brokers: {}, partners: {}, monthly: 0 } };
            }
            dataByMonth[monthKey].entries.push(prod);
        });

        const sortedMonths = Array.from(allMonths).sort().reverse();

        // Garante que o mês atual (mesmo que vazio) apareça na lista
        if (!allMonths.has(selectedMonth) && !sortedMonths.includes(selectedMonth)) {
            sortedMonths.unshift(selectedMonth);
        }

        const monthData = dataByMonth[selectedMonth];
        if (monthData) {
            monthData.entries.forEach(prod => {
                const broker = users.find(u => u.id === prod.brokerId);
                const commission = parseFloat(prod.commissionValue) || 0;
                const award = parseFloat(prod.awardValue) || 0;
                const totalValue = commission + award;

                if (broker) {
                    dataByMonth[selectedMonth].totals.brokers[broker.name] = (dataByMonth[selectedMonth].totals.brokers[broker.name] || 0) + totalValue;
                }

                if (prod.partner) {
                    dataByMonth[selectedMonth].totals.partners[prod.partner] = (dataByMonth[selectedMonth].totals.partners[prod.partner] || 0) + award;
                }
                dataByMonth[selectedMonth].totals.monthly += totalValue;
            });
        }

        return { months: sortedMonths, data: dataByMonth[selectedMonth] || { entries: [], totals: { brokers: {}, partners: {}, monthly: 0 } } };
    }, [productions, selectedMonth, users]);

    const handleOpenModal = (prod = null) => {
        setEditingProduction(prod);
        setModalOpen(true);
    };

    const handleSave = async (data) => {
        const result = data.id ? await updateProduction(data.id, data) : await addProduction(data);

        if (result) {
            toast({ title: "Sucesso!", description: `Produção para ${data.clientName} foi salva.` });
            setModalOpen(false);
        } else {
            toast({ title: "Erro", description: "Não foi possível salvar a produção.", variant: 'destructive' });
        }
    };

    const handleDelete = async (prod) => {
        try {
            await confirm({ title: `Excluir produção de ${prod.clientName}?`, description: "Esta ação não pode ser desfeita." });
            await deleteProduction(prod.id, prod.clientName);
            toast({ title: "Excluído!", description: "A entrada de produção foi removida." });
        } catch (e) { /* Ação cancelada */ }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Produção</h2>
                <div className="flex items-center gap-4">
                    <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        {processedData.months.map(month => (
                            <option key={month} value={month}>
                                {new Date(month + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </option>
                        ))}
                    </Select>
                    <Button onClick={() => handleOpenModal()} variant="violet">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Lançar Produção
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total do Mês</h3>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(processedData.data.totals.monthly)}</p>
                </GlassPanel>
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-gray-600 dark:text-gray-300">Total por Corretor</h3>
                    {Object.keys(processedData.data.totals.brokers).length > 0 ? (
                        Object.entries(processedData.data.totals.brokers).map(([name, value]) => (
                            <p key={name} className="text-sm"><span className="font-semibold">{name}:</span> {formatCurrency(value)}</p>
                        ))
                    ) : <p className="text-sm text-gray-500">Nenhum valor.</p>}
                </GlassPanel>
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-gray-600 dark:text-gray-300">Prêmio por Plataforma</h3>
                     {Object.keys(processedData.data.totals.partners).length > 0 ? (
                        Object.entries(processedData.data.totals.partners).map(([name, value]) => (
                            <p key={name} className="text-sm"><span className="font-semibold">{name}:</span> {formatCurrency(value)}</p>
                        ))
                    ) : <p className="text-sm text-gray-500">Nenhum valor.</p>}
                </GlassPanel>
            </div>

            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>
                                {['Cliente', 'Data da Venda', 'Corretor', 'Comissão', 'Prêmio', 'Total', ''].map(h => 
                                    <th key={h} scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {loading && processedData.data.entries.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8 text-gray-500">Carregando...</td></tr>
                            ) : processedData.data.entries.length > 0 ? (
                                processedData.data.entries.map(prod => {
                                    const broker = users.find(u => u.id === prod.brokerId);
                                    const commission = parseFloat(prod.commissionValue) || 0;
                                    const award = parseFloat(prod.awardValue) || 0;
                                    return (
                                        <tr key={prod.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{prod.clientName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(prod.saleDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{broker?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatCurrency(commission)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatCurrency(award)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 dark:text-white">{formatCurrency(commission + award)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(prod)}><PencilIcon className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500/80" onClick={() => handleDelete(prod)}><Trash2Icon className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7"><EmptyState title="Nenhuma Produção Lançada" message="Comece lançando a primeira produção deste mês." actionText="Lançar Produção" onAction={handleOpenModal} /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassPanel>

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