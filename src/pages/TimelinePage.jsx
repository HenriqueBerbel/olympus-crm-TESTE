import React, { useState, useMemo, memo } from 'react'; // <-- CORREÇÃO APLICADA AQUI

// Hooks e Contextos
import { useData } from '../contexts/DataContext';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { Avatar } from '../components/Avatar';

// Ícones e Utilitários
import { PlusCircleIcon, PencilIcon, Trash2Icon, RefreshCwIcon, InfoIcon } from '../components/Icons';
import { formatDateTime } from '../utils';

// Subcomponente para cada item da timeline
const TimelineItem = memo(({ log }) => {
    const getIcon = (actionType) => {
        switch (actionType) {
            case 'CRIAÇÃO': return <PlusCircleIcon className="h-5 w-5 text-green-500" />;
            case 'EDIÇÃO': return <PencilIcon className="h-5 w-5 text-yellow-500" />;
            case 'EXCLUSÃO': return <Trash2Icon className="h-5 w-5 text-red-500" />;
            case 'CONVERSÃO': return <RefreshCwIcon className="h-5 w-5 text-blue-500" />;
            default: return <InfoIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="flex items-start gap-4 p-4 border-b border-gray-200 dark:border-white/10 last:border-b-0">
            <div className="flex-shrink-0 pt-1">{getIcon(log.actionType)}</div>
            <div className="flex-grow">
                <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{log.userName || 'Sistema'}</span>
                    <span className="text-gray-600 dark:text-gray-400"> {log.description || ''}</span>
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDateTime(log.timestamp)}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {log.module && <Badge variant="outline">{log.module}</Badge>}
                    {log.actionType && <Badge>{log.actionType}</Badge>}
                    {log.entity?.name && <Badge variant="secondary">{log.entity.type}: {log.entity.name}</Badge>}
                </div>
            </div>
            <Avatar
                src={log.userAvatar}
                fallbackText={log.userName?.[0] || 'S'}
                alt={log.userName}
                className="h-10 w-10 border-2 border-gray-300 dark:border-gray-600"
            />
        </div>
    );
});

// Componente principal da página
const TimelinePage = () => {
    const { timeline, users, loading } = useData();
    const [filters, setFilters] = useState({ userId: 'all', module: 'all', actionType: 'all', searchTerm: '' });

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredTimeline = useMemo(() => {
        const safeTimeline = Array.isArray(timeline) ? timeline : [];
        return safeTimeline.filter(log => {
            if (!log) return false;
            const userMatch = filters.userId === 'all' || log.userId === filters.userId;
            const moduleMatch = filters.module === 'all' || log.module === filters.module;
            const actionMatch = filters.actionType === 'all' || log.actionType === filters.actionType;
            const searchMatch = !filters.searchTerm || 
                (log.description || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                (log.userName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                (log.entity?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
            return userMatch && moduleMatch && actionMatch && searchMatch;
        });
    }, [timeline, filters]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Time-Line de Atividades</h2>
            <GlassPanel className="p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input placeholder="Buscar na descrição, usuário ou entidade..." name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} />
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
            <GlassPanel>
                <div className="max-h-[70vh] overflow-y-auto">
                    {loading && timeline === undefined ? (
                        <p className="text-center text-gray-500 p-8">Carregando histórico de atividades...</p>
                    ) : filteredTimeline.length > 0 ? (
                        filteredTimeline.map(log => <TimelineItem key={log.id} log={log} />)
                    ) : (
                        <EmptyState title="Nenhuma Atividade Encontrada" message="Ajuste os filtros ou realize novas ações no sistema." />
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

export default TimelinePage;