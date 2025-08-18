import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, limit, startAfter, getDocs, where } from "firebase/firestore";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';

// Componentes e Utilitários
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import SkeletonRow from '../components/SkeletonRow';
import { DownloadIcon, FilterIcon, PlusCircleIcon, UploadCloudIcon, UsersIcon } from '../components/Icons';
import { formatDate } from '../utils';

const ClientsListPage = ({ onClientSelect, onAddClient, onNavigate }) => {
    const { operators, users } = useData();
    const { toast } = useToast();
    const db = getFirestore();

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

    const loadClients = useCallback((options = {}) => {
        const { loadMore = false } = options;
        
        setLoading(true);
        if (!loadMore) {
            setClients([]);
            setLastVisible(null);
            setHasMore(true);
        }

        const buildQuery = () => {
            let constraints = [orderBy("general.companyName", "asc")];
            if (filters.status) constraints.push(where("general.status", "==", filters.status));
            if (searchTerm) {
                constraints.push(where("general.companyName", ">=", searchTerm));
                constraints.push(where("general.companyName", "<=", searchTerm + '\uf8ff'));
            }
            if (loadMore && lastVisible) {
                constraints.push(startAfter(lastVisible));
            }
            constraints.push(limit(ITEMS_PER_PAGE));
            return query(collection(db, "clients"), ...constraints);
        };
        
        getDocs(buildQuery())
            .then(snapshots => {
                const newClients = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const lastDoc = snapshots.docs[snapshots.docs.length - 1];

                setLastVisible(lastDoc);
                setHasMore(newClients.length === ITEMS_PER_PAGE);
                setClients(prev => loadMore ? [...prev, ...newClients] : newClients);
            })
            .catch(error => {
                console.error("Erro ao buscar clientes:", error);
                toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
            })
            .finally(() => {
                setLoading(false);
                if (isInitialLoad) setIsInitialLoad(false);
            });
    }, [db, toast, filters, searchTerm, lastVisible, isInitialLoad]);

    useEffect(() => {
        const handler = setTimeout(() => {
            loadClients({ loadMore: false });
        }, 500);
        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchTerm]);

    const handleLoadMore = () => {
        loadClients({ loadMore: true });
    };

    const handleExportFilteredClients = async () => {
        if (clients.length === 0) return;
        setIsExporting(true);
        toast({ title: "Iniciando exportação..." });
        const zip = new JSZip();
        
        const toCsv = (headers, rows) => {
            let csvContent = '\uFEFF';
            csvContent += headers.join(';') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
            });
            return csvContent;
        };

        const clientHeaders = ["ID Cliente", "Nome Empresa/Titular", "Email", "Status", "Plano Ativo", "Vigência Ativa"];
        const clientRows = clients.map(client => {
            const activeContract = client.contracts?.find(c => c.status === 'ativo');
            return [
                client.id,
                client.general?.companyName || client.general?.holderName,
                client.general?.email,
                client.general?.status,
                activeContract?.planOperator || 'N/A',
                formatDate(activeContract?.effectiveDate) || 'N/A'
            ];
        });

        zip.file("clientes_filtrados.csv", toCsv(clientHeaders, clientRows));
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `export_clientes.zip`);
        setIsExporting(false);
    };

    const renderTableContent = () => {
        // --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA ---
        // Só mostra o esqueleto se for o carregamento inicial absoluto.
        if (isInitialLoad) {
            return Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={4} />);
        }
        
        // Se não estiver carregando e não houver clientes, mostra o estado vazio.
        if (clients.length === 0 && !loading) {
            const isFiltering = searchTerm || filters.status || filters.operator;
            return (
                <tr>
                    <td colSpan="4">
                        <EmptyState
                            icon={<UsersIcon className="w-16 h-16 mb-4 text-gray-400" />}
                            title={isFiltering ? "Nenhum cliente encontrado" : "Sua carteira de clientes está vazia"}
                            message={isFiltering ? "Tente ajustar seus filtros ou o termo da busca." : "Adicione seu primeiro cliente para organizar contratos e histórico."}
                            actionText="Adicionar Novo Cliente"
                            onAction={onAddClient}
                        />
                    </td>
                </tr>
            );
        }

        // Se houver clientes, renderiza as linhas.
        return clients.map((client) => {
            const activeContract = client.contracts?.find(c => c.status === 'ativo');
            return (
                <tr key={client.id} onClick={() => onClientSelect(client.id)} className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{client.general?.companyName || client.general?.holderName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{client.general?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${client.general?.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>{client.general?.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{activeContract?.planOperator || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(activeContract?.effectiveDate) || 'N/A'}</td>
                </tr>
            );
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => onNavigate('import-clients')}>
                        <UploadCloudIcon className="h-4 w-4 mr-2" />Importar
                    </Button>
                    <Button variant="outline" onClick={handleExportFilteredClients} disabled={isExporting || clients.length === 0}>
                        <DownloadIcon className="h-4 w-4 mr-2" />Exportar Lista ({clients.length})
                    </Button>
                    <Button variant="outline" onClick={() => setShowFilters(s => !s)}>
                        <FilterIcon className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                    <Button onClick={onAddClient}>
                        <PlusCircleIcon className="h-5 w-5 mr-2" /> Adicionar Cliente
                    </Button>
                </div>
            </header>
            
            {showFilters && (
                <GlassPanel className="p-4 mb-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder="Buscar por nome da empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select name="status" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
                            <option value="">Todos Status</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>
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
