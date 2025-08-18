import React, { useMemo, useState, memo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import { formatCurrency, formatDateTime } from '../utils';
import { DollarSignIcon, UsersIcon, PercentIcon, ClockIcon, ArrowUpRightIcon, ArrowDownRightIcon, InfoIcon, PlusCircleIcon, PencilIcon, Trash2Icon, CheckSquareIcon } from '../components/Icons';
import { cn } from '../utils';

const MetricCard = memo(({ title, value, icon, tooltip, trend, trendType = 'neutral' }) => {
    const trendColors = {
        positive: 'text-green-500 dark:text-green-400',
        negative: 'text-red-500 dark:text-red-400',
        neutral: 'text-gray-500 dark:text-gray-400',
    };
    const TrendIcon = trendType === 'positive' ? ArrowUpRightIcon : ArrowDownRightIcon;
    return (
        <GlassPanel className="p-5 flex flex-col justify-between group relative transition-all duration-300 hover:border-cyan-500/50 dark:hover:border-cyan-400/50">
            <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
                <div className="text-gray-400 dark:text-gray-500">{icon}</div>
            </div>
            <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
                {trend && (
                    <div className="flex items-center gap-1 mt-1">
                        <TrendIcon className={cn("h-4 w-4", trendColors[trendType])} />
                        <span className={cn("text-sm font-semibold", trendColors[trendType])}>{trend}</span>
                    </div>
                )}
            </div>
            {tooltip && <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><InfoIcon className="h-4 w-4 text-gray-400" title={tooltip} /></div>}
        </GlassPanel>
    );
});

const SalesPerformanceChart = memo(({ data, dataKey, title }) => {
    const { theme } = useTheme();
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 border border-gray-200 dark:border-white/20 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-900 dark:text-white">{`Data: ${label}`}</p>
                    <p className="text-cyan-600 dark:text-cyan-400">{`${title}: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <GlassPanel className="p-6 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} />
                        <XAxis dataKey="name" tick={{ fill: theme === 'dark' ? '#a0aec0' : '#4a5568', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: theme === 'dark' ? '#a0aec0' : '#4a5568', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.1)' }}/>
                        <Bar dataKey={dataKey} fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassPanel>
    );
});

const ActivityFeed = memo(({ activities }) => {
    const getIcon = (actionType) => {
        switch (actionType) {
            case 'CRIAÇÃO':
            case 'CRIAÇÃO AUTOMÁTICA':
                return <PlusCircleIcon className="h-5 w-5 text-green-500" />;
            case 'EDIÇÃO':
                return <PencilIcon className="h-5 w-5 text-yellow-500" />;
            case 'EXCLUSÃO':
                return <Trash2Icon className="h-5 w-5 text-red-500" />;
            case 'CONCLUSÃO':
                return <CheckSquareIcon className="h-5 w-5 text-cyan-500" />;
            default:
                return <InfoIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividade Recente</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {(activities || []).length > 0 ? activities.map(log => (
                    <div key={log.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">{getIcon(log.actionType)}</div>
                        <div className="flex-grow">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                <span className="font-semibold">{log.userName || 'Sistema'}</span> {log.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(log.timestamp)}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-gray-500 py-4">Nenhuma atividade registrada ainda.</p>}
            </div>
        </GlassPanel>
    );
});

const UpcomingRenewals = memo(({ clients, onNavigate }) => {
    return (
        <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contratos a Renovar (Próx. 90 dias)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(clients || []).length > 0 ? clients.map(({ client, daysLeft }) => (
                    <div key={client.id} className="p-3 bg-yellow-100/30 dark:bg-yellow-900/20 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{client.general?.companyName || client.general?.holderName}</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">Vence em {daysLeft} dias</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onNavigate('client-details', client.id)}>Ver</Button>
                    </div>
                )) : <p className="text-sm text-center text-gray-500 py-4">Nenhuma renovação nos próximos 90 dias.</p>}
            </div>
        </GlassPanel>
    );
});

// CORREÇÃO: Estrutura alterada para "const" e arrow function para padronização
const DashboardPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { clients, leads, tasks, timeline, leadColumns } = useData();
    const [dateRange, setDateRange] = useState(30);

    const dashboardData = useMemo(() => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - dateRange);
        startDate.setHours(0, 0, 0, 0);

        const clientsInPeriod = (clients || []).filter(c => c.createdAt && typeof c.createdAt.toDate === 'function' && c.createdAt.toDate() >= startDate);

        const mrr = (clients || []).reduce((sum, client) => {
            const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
            return sum + (activeContract ? parseFloat(activeContract.contractValue) || 0 : 0);
        }, 0);

        const newClientsCount = clientsInPeriod.length;

        const conversionColumn = (leadColumns || []).find(c => c.isConversion);
        const archiveColumn = (leadColumns || []).find(c => c.isArchiveColumn);

        const leadsFinalizedInPeriod = (leads || []).filter(l => {
            const lastActivity = l.lastActivityDate?.toDate();
            if(!lastActivity || lastActivity < startDate) return false;
            return (conversionColumn && l.status === conversionColumn.title) || (archiveColumn && l.status === archiveColumn.title);
        });
        const leadsConvertedInPeriod = leadsFinalizedInPeriod.filter(l => conversionColumn && l.status === conversionColumn.title);

        const totalOutcomes = leadsFinalizedInPeriod.length;
        const conversionRate = totalOutcomes > 0 ? (leadsConvertedInPeriod.length / totalOutcomes) * 100 : 0;

        const myTasks = (tasks || []).filter(t => t.assignedTo === user?.uid);
        const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate + 'T23:59:59') < now && t.status !== 'Concluída').length;

        const contractsToRenew = (clients || []).map(client => {
            const activeContract = (client.contracts || []).find(c => c.status === 'ativo' && c.renewalDate);
            if (!activeContract) return null;
            const renewalDate = new Date(activeContract.renewalDate + 'T00:00:00');
            const daysLeft = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
            return (daysLeft >= 0 && daysLeft <= 90) ? { client, daysLeft } : null;
        }).filter(Boolean).sort((a,b) => a.daysLeft - b.daysLeft);

        const chartData = Array.from({ length: dateRange }, (_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
            return { name: dateKey, NovosClientes: 0 };
        }).reverse();

        clientsInPeriod.forEach(client => {
            const dateKey = client.createdAt.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
            const chartEntry = chartData.find(d => d.name === dateKey);
            if(chartEntry) chartEntry.NovosClientes += 1;
        });

        const recentActivities = (timeline || []).slice(0, 10);

        return { mrr, newClientsCount, conversionRate: conversionRate.toFixed(1), overdueTasksCount: overdueTasks, renewals: contractsToRenew, chartData, recentActivities };

    }, [clients, leads, tasks, timeline, leadColumns, dateRange, user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "Boa madrugada";
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {getGreeting()}, {user?.name?.split(' ')[0]}!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">Aqui está o resumo da sua operação.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-200/50 dark:bg-black/20 rounded-lg">
                    {[7, 15, 30].map(days => (
                        <Button key={days} variant={dateRange === days ? 'default' : 'ghost'} size="sm" onClick={() => setDateRange(days)}>
                            Últimos {days} dias
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                       <MetricCard title="Faturamento Ativo (MRR)" value={formatCurrency(dashboardData.mrr)} icon={<DollarSignIcon />} tooltip="Receita Mensal Recorrente de todos os contratos ativos."/>
                       <MetricCard title="Novos Clientes" value={dashboardData.newClientsCount} icon={<UsersIcon />} tooltip={`Clientes adicionados nos últimos ${dateRange} dias.`}/>
                       <MetricCard title="Taxa de Conversão" value={`${dashboardData.conversionRate}%`} icon={<PercentIcon />} tooltip={`(Leads Ganhos / Total de Leads Finalizados) nos últimos ${dateRange} dias.`}/>
                       <MetricCard title="Minhas Tarefas Atrasadas" value={dashboardData.overdueTasksCount} icon={<ClockIcon />} tooltip="Suas tarefas que passaram do prazo e não foram concluídas." trendType={dashboardData.overdueTasksCount > 0 ? 'negative' : 'positive'}/>
                    </div>
                    <SalesPerformanceChart data={dashboardData.chartData} dataKey="NovosClientes" title="Novos Clientes por Dia"/>
                </div>

                <div className="space-y-6">
                    <UpcomingRenewals clients={dashboardData.renewals} onNavigate={onNavigate} />
                    <ActivityFeed activities={dashboardData.recentActivities} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;