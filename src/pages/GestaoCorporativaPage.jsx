import React, { useState, useMemo, memo } from 'react';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import usePermissions from '../hooks/usePermissions';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { Avatar } from '../components/Avatar';

// Modais
import AddCollaboratorModal from '../components/modals/AddCollaboratorModal';
import PermissionManagementModal from '../components/modals/PermissionManagementModal';
import AddPartnerModal from '../components/modals/AddPartnerModal';
import PlatformPartnerModal from '../components/modals/PlatformPartnerModal';
import AddOperatorModal from '../components/modals/AddOperatorModal';

// Ícones e Utilitários
import { UsersIcon, BriefcaseIcon, Share2Icon, BuildingIcon, PlusCircleIcon, PencilIcon, Trash2Icon, AwardIcon } from '../components/Icons';
import { cn } from '../utils';

// =================================================================================
// SUBCOMPONENTES DA PÁGINA
// =================================================================================

const TeamMembersTab = memo(({ users, clients, leads, tasks, canManagePermissions, onDeleteUser, onOpenPermissionsModal }) => {
    const safeUsers = Array.isArray(users) ? users : [];
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const sortedUsers = useMemo(() => [...safeUsers].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [safeUsers]);
    
    if (safeUsers.length === 0) {
        return <EmptyState title="Nenhum Colaborador Cadastrado" message="Adicione o primeiro membro da sua equipe para começar a gerenciar." />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedUsers.map(u => {
                const clientCount = useMemo(() => safeClients.filter(c => c.internal?.brokerId === u.id).length, [safeClients, u.id]);
                const leadCount = useMemo(() => safeLeads.filter(l => l.ownerId === u.id).length, [safeLeads, u.id]);
                const taskCount = useMemo(() => safeTasks.filter(t => t.assignedTo === u.id && t.status !== 'Concluída').length, [safeTasks, u.id]);
                return (
                    <GlassPanel key={u.id} className="p-4 flex flex-col group transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/50 dark:hover:border-violet-400/50">
                        <div className="flex items-start gap-4">
                            <Avatar 
                                src={u.avatar} 
                                fallbackText={u?.name?.[0] || 'S'}
                                alt={u.name}
                                className="h-12 w-12 text-xl mt-1 flex-shrink-0"
                            />
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-lg text-gray-900 dark:text-white truncate" title={u?.name}>{u?.name}</p>
                                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{u?.role}</p>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {canManagePermissions && u.role !== 'CEO' && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Gerenciar Permissões" onClick={() => onOpenPermissionsModal(u)}>
                                        <AwardIcon className="h-4 w-4 text-cyan-500" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" title="Excluir Usuário" onClick={() => onDeleteUser(u)}>
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-around mt-4 border-t border-gray-200 dark:border-white/10 pt-4 text-center">
                            <div><p className="font-bold text-2xl text-gray-800 dark:text-white">{clientCount}</p><p className="text-xs text-gray-500 uppercase tracking-wider">Clientes</p></div>
                            <div><p className="font-bold text-2xl text-gray-800 dark:text-white">{leadCount}</p><p className="text-xs text-gray-500 uppercase tracking-wider">Leads</p></div>
                            <div><p className="font-bold text-2xl text-gray-800 dark:text-white">{taskCount}</p><p className="text-xs text-gray-500 uppercase tracking-wider">Tarefas</p></div>
                        </div>
                    </GlassPanel>
                );
            })}
        </div>
    );
});

const ExternalPartnersTab = memo(({ partners, onAdd, onEdit, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Parceiros Externos</h3>
            <Button onClick={() => onAdd()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Parceiro</Button>
        </div>
        {(partners || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(partners || []).map(p => (
                    <GlassPanel key={p.id} className="p-4 group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                <p className="text-sm text-cyan-600 dark:text-cyan-400">{p.type}</p>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}><PencilIcon className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => onDelete(p)}><Trash2Icon className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhum Parceiro Externo" message="Adicione contatos comerciais como outras corretoras ou freelancers." onAction={() => onAdd()} actionText="Adicionar Parceiro" />}
    </div>
));

const PlatformsTab = memo(({ platforms, onAdd, onEdit, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Plataformas de Entrega</h3>
            <Button onClick={() => onAdd()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Plataforma</Button>
        </div>
        {(platforms || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(platforms || []).map(p => (
                    <GlassPanel key={p.id} className="p-4 group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                <p className="text-sm text-cyan-600 dark:text-cyan-400">{p.platformDetails?.portalURL || 'Sem portal'}</p>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}><PencilIcon className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => onDelete(p)}><Trash2Icon className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhuma Plataforma Cadastrada" message="Adicione as corretoras parceiras que intermediam seus contratos." onAction={() => onAdd()} actionText="Adicionar Plataforma" />}
    </div>
));

const OperatorsTab = memo(({ operators, onAdd, onEdit, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Operadoras de Saúde</h3>
            <Button onClick={() => onAdd()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Operadora</Button>
        </div>
        {(operators || []).length > 0 ? (
            <div className="space-y-3">
                {(operators || []).map(op => (
                    <GlassPanel key={op.id} className="p-3 flex justify-between items-center group">
                        <p className="font-semibold">{op.name}</p>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(op)}><PencilIcon className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => onDelete(op)}><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhuma Operadora Cadastrada" message="Cadastre as operadoras com as quais você trabalha." onAction={() => onAdd()} actionText="Adicionar Operadora" />}
    </div>
));

// ===================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ===================================================================

const GestaoCorporativaPage = () => {
    const { users, partners, operators, clients, leads, tasks, roles, addPartner, deletePartner, updatePartner, addOperator, deleteOperator, updateOperator } = useData();
    const { addUser, deleteUser, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const { can } = usePermissions();

    const [activeSubPage, setActiveSubPage] = useState('team');
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isPartnerModalOpen, setPartnerModalOpen] = useState(false);
    const [isPlatformModalOpen, setPlatformModalOpen] = useState(false);
    const [isOperatorModalOpen, setOperatorModalOpen] = useState(false);
    const [isPermissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editingPartner, setEditingPartner] = useState(null);
    const [editingPlatform, setEditingPlatform] = useState(null);
    const [editingOperator, setEditingOperator] = useState(null);

    const handleSaveUser = async (formData) => {
        const result = await addUser(formData);
        if (result.success) {
            toast({ title: "Sucesso!", description: `Usuário ${formData.name} criado.` });
            setUserModalOpen(false);
        } else {
            toast({ title: "Erro", description: `Não foi possível criar o usuário. (${result.code})`, variant: 'destructive' });
        }
    };

    const handleDeleteUser = async (userToDelete) => {
        try {
            await confirm({ title: `Excluir ${userToDelete.name}?`, description: "Esta ação é irreversível." });
            await deleteUser(userToDelete.id);
            toast({ title: "Usuário Excluído", description: `${userToDelete.name} foi removido.` });
        } catch(e) { /* Ação cancelada */ }
    };

    const handleOpenPermissionsModal = (userToEdit) => {
        setEditingUser(userToEdit);
        setPermissionsModalOpen(true);
    };

    const handleSavePermissions = async (userId, data) => {
        const success = await updateUserProfile(userId, data);
        toast({ title: success ? "Sucesso!" : "Erro", description: success ? "Permissões atualizadas." : "Falha ao salvar.", variant: success ? 'default' : 'destructive' });
    };

    const handleOpenPartnerModal = (partner = null) => {
        setEditingPartner(partner);
        setPartnerModalOpen(true);
    };
    
    const handleOpenPlatformModal = (platform = null) => {
        setEditingPlatform(platform);
        setPlatformModalOpen(true);
    };
    
    const handleSavePartnerOrPlatform = async (data) => {
        const isEditing = !!data.id;
        const success = isEditing ? await updatePartner(data.id, data) : await addPartner(data); 
        if (success) {
            toast({ title: "Sucesso!", description: `${data.type || 'Item'} salvo.` });
            setPartnerModalOpen(false);
            setPlatformModalOpen(false);
        } else {
            toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
        }
    };
    
    const handleDeletePartnerOrPlatform = async (item) => {
        try {
            await confirm({ title: `Excluir ${item.name}?`});
            await deletePartner(item.id, item.name);
            toast({ title: "Excluído", description: `${item.name} foi removido.` });
        } catch(e){}
    };
    
    const handleOpenOperatorModal = (op = null) => {
        setEditingOperator(op);
        setOperatorModalOpen(true);
    };
    
    const handleSaveOperator = async (opData) => {
        const isEditing = !!opData.id;
        const success = isEditing ? await updateOperator(opData.id, opData) : await addOperator(opData);
        if (success) {
            toast({ title: "Sucesso!", description: "Operadora salva." });
            setOperatorModalOpen(false);
        } else {
            toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
        }
    };
    
    const handleDeleteOperator = async (op) => {
        try {
            await confirm({ title: `Excluir Operadora ${op.name}?`});
            await deleteOperator(op.id, op.name);
            toast({ title: "Excluída", description: `${op.name} foi removida.` });
        } catch(e){}
    };
    
    const subNavItems = [
        { id: 'team', label: 'Colaboradores', icon: UsersIcon },
        { id: 'partners', label: 'Parceiros Externos', icon: BriefcaseIcon },
        { id: 'platforms', label: 'Plataformas', icon: Share2Icon },
        { id: 'operators', label: 'Operadoras', icon: BuildingIcon },
    ];

    const externalPartners = useMemo(() => (partners || []).filter(p => p.type !== 'Plataforma de Entrega'), [partners]);
    const deliveryPlatforms = useMemo(() => (partners || []).filter(p => p.type === 'Plataforma de Entrega'), [partners]);

    const renderSubPage = () => {
        switch (activeSubPage) {
            case 'team':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Colaboradores Internos</h3>
                            <Button onClick={() => setUserModalOpen(true)} variant="violet">
                                <PlusCircleIcon className="h-5 w-5 mr-2"/> Adicionar Colaborador
                            </Button>
                        </div>
                        <TeamMembersTab 
                            users={users} 
                            clients={clients} 
                            leads={leads} 
                            tasks={tasks} 
                            canManagePermissions={can('managePermissions')} 
                            onDeleteUser={handleDeleteUser} 
                            onOpenPermissionsModal={handleOpenPermissionsModal} 
                        />
                    </div>
                );
            case 'partners':
                return <ExternalPartnersTab partners={externalPartners} onAdd={handleOpenPartnerModal} onEdit={handleOpenPartnerModal} onDelete={handleDeletePartnerOrPlatform} />;
            case 'platforms':
                return <PlatformsTab platforms={deliveryPlatforms} onAdd={handleOpenPlatformModal} onEdit={handleOpenPlatformModal} onDelete={handleDeletePartnerOrPlatform} />;
            case 'operators':
                return <OperatorsTab operators={operators} onAdd={handleOpenOperatorModal} onEdit={handleOpenOperatorModal} onDelete={handleDeleteOperator} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-5rem)]">
            <aside className="w-full md:w-64 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestão Corporativa</h2>
                <nav className="flex flex-row md:flex-col gap-2">
                    {subNavItems.map(item => (
                        <button key={item.id} onClick={() => setActiveSubPage(item.id)}
                            className={cn("w-full flex items-center p-3 rounded-lg transition-all duration-300 font-semibold text-sm", activeSubPage === item.id ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5")} >
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-grow">
                {renderSubPage()}
            </main>
            
            <AddCollaboratorModal 
                isOpen={isUserModalOpen} 
                onClose={() => setUserModalOpen(false)} 
                onSave={handleSaveUser}
                users={users}
                roles={roles}
            />
            
            {editingUser && <PermissionManagementModal isOpen={isPermissionsModalOpen} onClose={() => setPermissionsModalOpen(false)} userToEdit={editingUser} allUsers={users} onSave={handleSavePermissions} />}
            <AddPartnerModal isOpen={isPartnerModalOpen} onClose={() => setPartnerModalOpen(false)} onSave={handleSavePartnerOrPlatform} partner={editingPartner}/>
            <PlatformPartnerModal isOpen={isPlatformModalOpen} onClose={() => setPlatformModalOpen(false)} onSave={handleSavePartnerOrPlatform} partner={editingPlatform}/>
            <AddOperatorModal isOpen={isOperatorModalOpen} onClose={() => setOperatorModalOpen(false)} onSave={handleSaveOperator} operator={editingOperator}/>
        </div>
    );
};

export default GestaoCorporativaPage;
