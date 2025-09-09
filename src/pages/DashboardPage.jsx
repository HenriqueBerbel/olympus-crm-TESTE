import React, { useMemo, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Hooks e Utilitários
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDateTime } from '../utils';
import { cn } from '../utils';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

// Ícones
import {
    DollarSignIcon,
    UsersIcon,
    BriefcaseIcon,
    ClockIcon,
    TrendingUpIcon,
    CalendarDaysIcon,
    InfoIcon,
    PlusCircleIcon,
    PencilIcon,
    Trash2Icon,
    CheckSquareIcon,
    ZapIcon
} from '../components/Icons';

// ========================================================================
//  *** FUNÇÃO DE SEGURANÇA PARA DATAS ***
// ========================================================================
const safeToDate = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp) {
        try {
            return new Date(timestamp);
        } catch (e) {
            console.error("Erro ao converter data:", timestamp, e);
            return null;
        }
    }
    return null;
};

// ========================================================================
//  *** ANIMAÇÕES GLOBAIS ***
// ========================================================================
const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    }
};

const itemFadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};


// ========================================================================
//  *** SUBCOMPONENTES DO NOVO DASHBOARD HÍBRIDO ***
// ========================================================================

// [NOVO] KpiCard do novo design, mais moderno.
const KpiCard = memo(({ title, value, icon: Icon, description, trend, trendType = 'neutral', linkTo }) => {
    const trendColors = {
        positive: 'text-emerald-500 dark:text-emerald-400',
        negative: 'text-red-500 dark:text-red-400',
        neutral: 'text-gray-500 dark:text-gray-400',
    };
    const TrendIcon = trendType === 'positive' ? TrendingUpIcon : trendType === 'negative' ? CalendarDaysIcon : InfoIcon;
    
    return (
        <motion.div variants={itemFadeIn}>
            <GlassPanel className="p-5 flex flex-col justify-between h-full hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</h3>
                    <Icon className="h-6 w-6 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="mt-3">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
                </div>
                {trend && (
                    <div className="flex items-center gap-2 mt-2">
                        <TrendIcon className={cn("h-4 w-4", trendColors[trendType])} />
                        <span className={cn("text-sm font-medium", trendColors[trendType])}>{trend}</span>
                    </div>
                )}
                {linkTo && (
                    <Button variant="link" className="mt-3 self-end p-0" onClick={linkTo}>Ver Detalhes</Button>
                )}
            </GlassPanel>
        </motion.div>
    );
});

// [ANTIGO] Gráfico Recharts, totalmente funcional e estilizado para o seu tema.
const NewClientsChart = memo(({ data, title }) => {
    const { theme } = useTheme();

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 border border-gray-200 dark:border-white/20 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-900 dark:text-white">{`Data: ${label}`}</p>
                    <p className="text-violet-600 dark:text-violet-400">{`Novos Clientes: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div variants={itemFadeIn}>
            <GlassPanel className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
                <div className="flex-grow w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} />
                            <XAxis dataKey="name" tick={{ fill: theme === 'dark' ? '#a0aec0' : '#4a5568', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: theme === 'dark' ? '#a0aec0' : '#4a5568', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}/>
                            <Bar dataKey="value" fill={theme === 'dark' ? "#a78bfa" : "#8b5cf6"} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassPanel>
        </motion.div>
    );
});

// [NOVO] Painel de atividades do novo design.
const ActivityFeed = memo(({ activities }) => {
    return (
        <motion.div variants={itemFadeIn}>
            <GlassPanel className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Atividade Recente</h3>
                    <Button variant="ghost" size="sm">Ver Tudo</Button>
                </div>
                <div className="flex-grow space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {(activities && activities.length > 0) ? activities.map(log => (
                        <div key={log.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0 pt-1">
                                {log.actionType === 'CRIAÇÃO' && <PlusCircleIcon className="h-5 w-5 text-emerald-500" />}
                                {log.actionType === 'EDIÇÃO' && <PencilIcon className="h-5 w-5 text-yellow-500" />}
                                {log.actionType === 'EXCLUSÃO' && <Trash2Icon className="h-5 w-5 text-red-500" />}
                                {log.actionType === 'CONCLUSÃO' && <CheckSquareIcon className="h-5 w-5 text-cyan-500" />}
                                {!['CRIAÇÃO', 'EDIÇÃO', 'EXCLUSÃO', 'CONCLUSÃO'].includes(log.actionType) && <ZapIcon className="h-5 w-5 text-gray-500" />}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    <span className="font-semibold">{log.userName || 'Sistema'}</span> {log.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(log.timestamp)}</p>
                            </div>
                        </div>
                    )) : <EmptyState title="Nenhuma atividade recente" message="As últimas ações aparecerão aqui." />}
                </div>
            </GlassPanel>
        </motion.div>
    );
});


// ========================================================================
//  *** COMPONENTE PRINCIPAL DO DASHBOARD ***
// ========================================================================
const DashboardPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { clients, timeline } = useData();
    const [dateRange, setDateRange] = useState(30);

    const dashboardData = useMemo(() => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - dateRange);
        startDate.setHours(0, 0, 0, 0);

        const clientsInPeriod = (clients || []).filter(c => safeToDate(c.createdAt) >= startDate);
        const mrr = (clients || []).flatMap(c => c.contracts || []).filter(con => con.status === 'ativo').reduce((sum, con) => sum + (parseFloat(con.contractValue) || 0), 0);
        
        const chartData = Array.from({ length: dateRange }, (_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - i);
            return { name: date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), value: 0 };
        }).reverse();

        clientsInPeriod.forEach(client => {
            const dateKey = safeToDate(client.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
            const chartEntry = chartData.find(d => d.name === dateKey);
            if(chartEntry) chartEntry.value += 1;
        });

        const recentActivities = (timeline || []).sort((a,b) => safeToDate(b.timestamp) - safeToDate(a.timestamp)).slice(0, 7);
        
        return { 
            mrr, 
            totalClients: (clients || []).length, 
            newClientsCount: clientsInPeriod.length,
            chartData, 
            recentActivities 
        };
    }, [clients, timeline, dateRange]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {getGreeting()}, {user?.name?.split(' ')[0]}!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">Visão geral e desempenho da sua operação.</p>
                </div>
                 <div className="flex items-center gap-2 p-1 bg-gray-200/50 dark:bg-black/20 rounded-lg">
                    {[7, 15, 30].map(days => (
                        <Button key={days} variant={dateRange === days ? 'default' : 'ghost'} size="sm" onClick={() => setDateRange(days)}>
                            Últimos {days} dias
                        </Button>
                    ))}
                </div>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={containerStagger}
                initial="hidden"
                animate="visible"
            >
                {/* Coluna Esquerda (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        <KpiCard 
                            title="Faturamento Ativo (MRR)" 
                            value={formatCurrency(dashboardData.mrr)} 
                            icon={DollarSignIcon} 
                            description="Receita recorrente total"
                        />
                        <KpiCard 
                            title="Total de Clientes" 
                            value={dashboardData.totalClients} 
                            icon={UsersIcon} 
                            description={`${dashboardData.newClientsCount} novos nos últimos ${dateRange} dias`} 
                            trend={`${dashboardData.newClientsCount} clientes novos`}
                            trendType={dashboardData.newClientsCount > 0 ? 'positive' : 'neutral'}
                        />
                        <KpiCard 
                            title="Leads na Base" 
                            value="N/A"
                            icon={BriefcaseIcon} 
                            description="Métrica de leads em breve"
                        />
                    </div>
                    
                    <NewClientsChart data={dashboardData.chartData} title={`Novos Clientes por Dia (Últimos ${dateRange} Dias)`}/>
                </div>

                {/* Coluna Direita (1/3) */}
                <div className="lg:col-span-1">
                    <ActivityFeed activities={dashboardData.recentActivities} />
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardPage;