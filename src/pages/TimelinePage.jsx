import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useDebounce } from '../hooks/useDebounce'; // Importando nosso hook de otimização

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { Avatar } from '../components/Avatar';

// Ícones e Utilitários
import { PlusCircleIcon, PencilIcon, Trash2Icon, RefreshCwIcon, InfoIcon, CheckSquareIcon } from '../components/Icons';
import { formatDateTime } from '../utils';

// ========================================================================
//          *** SUBCOMPONENTES DA NOVA TIMELINE ***
// ========================================================================

const TimelineItem = memo(({ log }) => {
    const getIconAndColor = (actionType) => {
        switch (actionType) {
            case 'CRIAÇÃO': return { Icon: PlusCircleIcon, color: "text-emerald-500" };
            case 'EDIÇÃO': return { Icon: PencilIcon, color: "text-yellow-500" };
            case 'EXCLUSÃO': return { Icon: Trash2Icon, color: "text-red-500" };
            case 'CONVERSÃO': return { Icon: RefreshCwIcon, color: "text-blue-500" };
            case 'CONCLUSÃO': return { Icon: CheckSquareIcon, color: "text-cyan-500" };
            default: return { Icon: InfoIcon, color: "text-gray-500" };
        }
    };

    const { Icon, color } = getIconAndColor(log.actionType);

    return (
        <motion.div 
            className="relative flex items-start gap-4 pl-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="absolute left-0 top-0 flex flex-col items-center h-full">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ring-4 ring-white dark:ring-gray-900 ${color}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="w-px flex-grow bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex-grow pb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">{log.userName || 'Sistema'}</span>
                            <span className="text-gray-600 dark:text-gray-400"> {log.description || ''}</span>
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatDateTime(log.timestamp)}
                        </div>
                    </div>
                     <Avatar
                        src={log.userAvatar}
                        fallbackText={log.userName?.[0] || 'S'}
                        alt={log.userName}
                        className="h-9 w-9 border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                    />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {log.module && <Badge variant="outline">{log.module}</Badge>}
                    {log.actionType && <Badge>{log.actionType}</Badge>}
                </div>
            </div>
        </motion.div>
    );
});

// ========================================================================
//          *** COMPONENTE PRINCIPAL DA PÁGINA ***
// ========================================================================
const TimelinePage = () => {
    const { timeline, users, loading } = useData();
    const [filters, setFilters] = useState({ userId: 'all', module: 'all', actionType: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce de 500ms

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const groupedTimeline = useMemo(() => {
        const safeTimeline = Array.isArray(timeline) ? timeline : [];
        
        const filtered = safeTimeline.filter(log => {
            if (!log) return false;
            const userMatch = filters.userId === 'all' || log.userId === filters.userId;
            const moduleMatch = filters.module === 'all' || log.module === filters.module;
            const actionMatch = filters.actionType === 'all' || log.actionType === filters.actionType;
            const searchMatch = !debouncedSearchTerm || 
                (log.description || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                (log.userName || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            return userMatch && moduleMatch && actionMatch && searchMatch;
        });

        const groups = filtered.reduce((acc, log) => {
            if (!log.timestamp) return acc;
            const date = log.timestamp.toDate();
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            let groupTitle;
            if (date.toDateString() === today.toDateString()) {
                groupTitle = 'Hoje';
            } else if (date.toDateString() === yesterday.toDateString()) {
                groupTitle = 'Ontem';
            } else {
                groupTitle = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
            }

            if (!acc[groupTitle]) {
                acc[groupTitle] = [];
            }
            acc[groupTitle].push(log);
            return acc;
        }, {});

        return Object.entries(groups);
    }, [timeline, filters, debouncedSearchTerm]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.h2 
                className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                Time-Line de Atividades
            </motion.h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <GlassPanel className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select name="userId" value={filters.userId} onChange={handleFilterChange}>
                            <option value="all">Todos Usuários</option>
                            {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                        <Select name="module" value={filters.module} onChange={handleFilterChange}>
                            <option value="all">Todos Módulos</option>
                            <option>Clientes</option><option>Leads</option><option>Tarefas</option><option>Corporativo</option><option>Comissões</option><option>Produção</option><option>Calendário</option>
                        </Select>
                        <Select name="actionType" value={filters.actionType} onChange={handleFilterChange}>
                            <option value="all">Todas Ações</option>
                            <option>CRIAÇÃO</option><option>EDIÇÃO</option><option>EXCLUSÃO</option><option>CONVERSÃO</option><option>CONCLUSÃO</option>
                        </Select>
                    </div>
                </GlassPanel>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {loading && groupedTimeline.length === 0 ? (
                    <p className="text-center text-gray-500 p-8">Carregando histórico de atividades...</p>
                ) : groupedTimeline.length > 0 ? (
                    groupedTimeline.map(([groupTitle, logs]) => (
                        <div key={groupTitle} className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 pb-4 border-b border-gray-200 dark:border-white/10">{groupTitle}</h3>
                            <div className="mt-4">
                                {logs.map(log => <TimelineItem key={log.id} log={log} />)}
                            </div>
                        </div>
                    ))
                ) : (
                    <GlassPanel>
                        <EmptyState title="Nenhuma Atividade Encontrada" message="Ajuste os filtros ou realize novas ações no sistema." />
                    </GlassPanel>
                )}
            </motion.div>
        </div>
    );
};

export default TimelinePage;