import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, orderBy, limit, startAfter, getDocs, where } from "firebase/firestore";
import { saveAs } from 'file-saver';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';

// Componentes e Utilitários
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import SkeletonRow from '../components/SkeletonRow';
import { DownloadIcon, FilterIcon, PlusCircleIcon, UploadCloudIcon, UsersIcon } from '../components/Icons';
import { formatDate } from '../utils';

const ClientsListPage = () => {
    const { operators } = useData();
    const { user } = useAuth();
    const { permissions, can } = usePermissions();
    const { toast } = useToast();
    const db = getFirestore();
    const navigate = useNavigate();

    // Estados
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', operator: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const ITEMS_PER_PAGE = 20;
    
    const loadClients = useCallback(async (loadMore = false) => {
        const viewPermission = permissions.clients?.view;
        const scope = viewPermission?.scope || 'nenhum';

        if (!user || scope === 'nenhum') {
            setClients([]);
            setLoading(false);
            setHasMore(false);
            setIsInitialLoad(false);
            return;
        }

        setLoading(true);

        try {
            // [CORREÇÃO APLICADA]
            // A ordenação agora é feita pelo campo 'sortName', que é consistente para todos os clientes.
            let constraints = [orderBy("sortName", "asc")];

            // Constrói a query com base no escopo da permissão do usuário
            switch (scope) {
                case 'próprio':
                    constraints.push(where("ownerId", "==", user.uid));
                    break;
                
                case 'specificUsers':
                    const allowedIds = viewPermission.allowedUserIds || [];
                    const visibleUserIds = [...new Set([user.uid, ...allowedIds])];
                    
                    if (visibleUserIds.length > 0) {
                        constraints.push(where("ownerId", "in", visibleUserIds));
                    } else {
                        constraints.push(where("ownerId", "==", user.uid));
                    }
                    break;

                case 'todos':
                    // Nenhuma restrição de 'ownerId' é adicionada
                    break;
                
                default:
                    setClients([]); setLoading(false); setHasMore(false);
                    return;
            }

            if (filters.status) {
                constraints.push(where("general.status", "==", filters.status));
            }

            if (loadMore && lastVisible) {
                constraints.push(startAfter(lastVisible));
            }
            
            constraints.push(limit(ITEMS_PER_PAGE));

            const q = query(collection(db, "clients"), ...constraints);
            const snapshots = await getDocs(q);
            
            const newClients = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setLastVisible(snapshots.docs[snapshots.docs.length - 1]);
            setHasMore(newClients.length === ITEMS_PER_PAGE);
            setClients(prev => loadMore ? [...prev, ...newClients] : newClients);

        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            toast({ title: "Erro", description: "Não foi possível carregar os clientes. Verifique se os índices do Firestore estão criados.", variant: "destructive" });
        } finally {
            setLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        }
    }, [db, user, permissions, filters, lastVisible, toast, isInitialLoad]);

    useEffect(() => {
        if (permissions && permissions.clients) {
            setClients([]);
            setLastVisible(null);
            setHasMore(true);
            setIsInitialLoad(true);
            loadClients(false);
        }
    }, [filters, permissions]);

    const filteredClients = useMemo(() => {
        let results = clients;
        if (searchTerm) {
            results = results.filter(client => 
                (client.general?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.general?.holderName || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filters.operator) {
            results = results.filter(client => {
                const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
                return activeContract?.planOperator === filters.operator;
            });
        }
        return results;
    }, [clients, searchTerm, filters.operator]);


    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadClients(true);
        }
    };
    
    const handleExportFilteredClients = async () => {
        setIsExporting(true);
        try {
            const viewPermission = permissions.clients?.view;
            const scope = viewPermission?.scope || 'nenhum';

            if (scope === 'nenhum') {
                toast({ title: "Acesso Negado", description: "Você não tem permissão para exportar clientes.", variant: "destructive" });
                return;
            }

            // [CORREÇÃO APLICADA]
            // A ordenação para exportação também foi atualizada para 'sortName'.
            let constraints = [orderBy("sortName", "asc")];
            
            switch (scope) {
                case 'próprio':
                    constraints.push(where("ownerId", "==", user.uid));
                    break;
                case 'specificUsers':
                    const allowedIds = viewPermission.allowedUserIds || [];
                    const visibleUserIds = [...new Set([user.uid, ...allowedIds])];
                    if (visibleUserIds.length > 0) {
                        constraints.push(where("ownerId", "in", visibleUserIds));
                    } else {
                        constraints.push(where("ownerId", "==", user.uid));
                    }
                    break;
                case 'todos':
                    break;
            }
            
            if (filters.status) constraints.push(where("general.status", "==", filters.status));
            
            const q = query(collection(db, "clients"), ...constraints);
            const snapshots = await getDocs(q);
            let allFilteredClients = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (filters.operator) {
                 allFilteredClients = allFilteredClients.filter(client => {
                    const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
                    return activeContract?.planOperator === filters.operator;
                });
            }

            let csvContent = "Nome,Status,Plano Ativo,Vigencia Ativa\n";
            allFilteredClients.forEach(client => {
                const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
                const row = [`"${client.general?.companyName || client.general?.holderName || ''}"`,`"${client.general?.status || ''}"`,`"${activeContract?.planOperator || 'N/A'}"`,`"${formatDate(activeContract?.effectiveDate)}"`].join(",");
                csvContent += row + "\n";
            });

            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, "clientes_filtrados.csv");

        } catch (error) {
            toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const renderTableContent = () => {
        if (isInitialLoad) {
            return Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={4} />);
        }
        if (filteredClients.length === 0) {
            return (
                <tr>
                    <td colSpan="4" className="text-center p-8">
                        <EmptyState 
                            title="Nenhum cliente encontrado" 
                            message="Tente ajustar seus filtros ou adicione um novo cliente."
                            icon={<UsersIcon className="w-12 h-12 mb-4 text-gray-400" />}
                            actionText={can('clients', 'create') ? "Adicionar Cliente" : ""}
                            onAction={can('clients', 'create') ? () => navigate('/clients/new') : undefined}
                        />
                    </td>
                </tr>
            );
        }
        return filteredClients.map(client => {
            const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
            return (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{client.general?.companyName || client.general?.holderName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.general?.status}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{activeContract?.planOperator || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(activeContract?.effectiveDate)}</td>
                </tr>
            );
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><FilterIcon className="h-4 w-4 mr-2"/>Filtros</Button>
                     <Button variant="outline" onClick={handleExportFilteredClients} disabled={isExporting}>
                        <DownloadIcon className="h-4 w-4 mr-2"/>
                        {isExporting ? 'Exportando...' : 'Exportar'}
                    </Button>
                    {can('clients', 'create') && (
                        <>
                            <Button variant="outline" onClick={() => navigate('/clients/import')}>
                                <UploadCloudIcon className="h-4 w-4 mr-2" />Importar
                            </Button>
                            <Button onClick={() => navigate('/clients/new')}>
                                <PlusCircleIcon className="h-5 w-5 mr-2" /> Adicionar Cliente
                            </Button>
                        </>
                    )}
                </div>
            </header>
            
            {showFilters && (
                 <GlassPanel className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
                            <option value="">Todos os Status</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                        </Select>
                        <Select name="operator" value={filters.operator} onChange={(e) => setFilters(p => ({ ...p, operator: e.target.value }))}>
                            <option value="">Todas Operadoras</option>
                            {(operators || []).map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                        </Select>
                    </div>
                </GlassPanel>
            )}

            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>{['Nome', 'Status', 'Plano Ativo', 'Vigência Ativa'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">{renderTableContent()}</tbody>
                    </table>
                </div>
            </GlassPanel>

            <div className="flex justify-center mt-6">
                {!loading && hasMore && (
                    <Button onClick={handleLoadMore}>Carregar Mais Clientes</Button>
                )}
                {loading && !isInitialLoad && (
                    <Button disabled>Carregando...</Button>
                )}
            </div>
        </div>
    );
};

export default ClientsListPage;