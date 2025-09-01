import React, { useState, useMemo, memo } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { usePermissions } from '../hooks/usePermissions';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import Input from '../components/Input';
import Label from '../components/Label';

// Modais
import AddCollaboratorModal from '../components/modals/AddCollaboratorModal';
import { PermissionManagementModal } from '../components/modals/PermissionManagementModal';
import AddPartnerModal from '../components/modals/AddPartnerModal';
import PlatformPartnerModal from '../components/modals/PlatformPartnerModal';
import AddOperatorModal from '../components/modals/AddOperatorModal';

// Ícones e Utilitários
import { UsersIcon, BriefcaseIcon, Share2Icon, BuildingIcon, PlusCircleIcon, PencilIcon, Trash2Icon, AwardIcon, ShieldCheckIcon, UploadCloudIcon, ImageIcon } from '../components/Icons';
import { cn } from '../utils';


// ========================================================================
//          *** SUBCOMPONENTES DA PÁGINA ***
// ========================================================================

const CompanyProfileTab = memo(({ profile, onSave }) => {
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.logoUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const storage = getStorage();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadAndSave = async () => {
        if (!logoFile) {
            toast({ title: "Nenhum arquivo", description: "Selecione um arquivo de imagem para o logo.", variant: 'warning' });
            return;
        }
        setIsUploading(true);
        try {
            const storageRef = ref(storage, `company_assets/logo_${Date.now()}_${logoFile.name}`);
            const snapshot = await uploadBytes(storageRef, logoFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            await onSave({ logoUrl: downloadURL });

        } catch (error) {
            console.error("Erro no upload do logo:", error);
            toast({ title: "Erro no Upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Perfil da Empresa</h3>
             <GlassPanel className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <Label>Logo da Empresa</Label>
                        <p className="text-sm text-gray-500 mb-4">Faça o upload do logo que aparecerá na tela de login e no menu.</p>
                        <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} className="mb-4" />
                        <Button onClick={handleUploadAndSave} disabled={isUploading || !logoFile}>
                            <UploadCloudIcon className="h-4 w-4 mr-2"/>
                            {isUploading ? 'Enviando...' : 'Salvar Logo'}
                        </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-black/20 rounded-lg p-4 min-h-[150px]">
                        <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">Pré-visualização</p>
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview do Logo" className="max-h-24 max-w-full object-contain" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon className="h-12 w-12 mx-auto" />
                                <p>Nenhum logo definido</p>
                            </div>
                        )}
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
});


const TeamMembersTab = memo(({ users, onDeleteUser, onOpenPermissionsModal, canManageUsers }) => {
    const sortedUsers = useMemo(() => [...(users || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [users]);
    if (sortedUsers.length === 0) return <EmptyState title="Nenhum Colaborador" message="Adicione o primeiro membro da sua equipe." />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedUsers.map(u => (
                <GlassPanel key={u.id} className="p-4 flex flex-col group">
                    <div className="flex items-start gap-4">
                        <Avatar src={u.avatar} fallbackText={u?.name?.[0] || 'S'} alt={u.name} className="h-12 w-12 text-xl mt-1"/>
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-lg truncate">{u?.name}</p>
                            <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{u?.role?.name || 'Sem Cargo'}</p>
                        </div>
                        {canManageUsers && u.role?.name !== 'SuperAdmin' && u.role?.name !== 'CEO' && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" title="Gerenciar Permissões Individuais" onClick={() => onOpenPermissionsModal(u)}>
                                    <AwardIcon className="h-4 w-4 text-cyan-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500/70" title="Excluir Usuário" onClick={() => onDeleteUser(u)}>
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </GlassPanel>
            ))}
        </div>
    );
});

const PermissionsTab = memo(({ roles, onOpenPermissionsModal }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Gerenciar Permissões por Cargo</h3>
        <p className="text-sm text-gray-500 mb-6">Clique em um cargo para editar as permissões padrão que serão aplicadas a todos os usuários que o possuem.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(roles || []).map(role => (
                <GlassPanel key={role.id} className="p-4 cursor-pointer transition-all hover:border-violet-500/50 dark:hover:border-violet-400/50" onClick={() => onOpenPermissionsModal(null, role.id)}>
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="h-6 w-6 text-violet-500"/>
                        <span className="font-bold text-lg">{role.name}</span>
                    </div>
                </GlassPanel>
            ))}
        </div>
    </div>
));

const ExternalPartnersTab = memo(({ partners, onAdd, onEdit, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Parceiros Externos</h3>
            <Button onClick={onAdd} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Parceiro</Button>
        </div>
        {(partners || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map(p => (
                    <GlassPanel key={p.id} className="p-4 group flex justify-between items-start">
                        <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-sm text-cyan-600 dark:text-cyan-400">{p.type}</p>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><PencilIcon className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="text-red-500/70" onClick={() => onDelete(p)}><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhum Parceiro" onAction={onAdd} actionText="Adicionar Parceiro" />}
    </div>
));

const PlatformsTab = memo(({ platforms, onAdd, onEdit, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Plataformas de Entrega</h3>
            <Button onClick={onAdd} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Plataforma</Button>
        </div>
        {(platforms || []).length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map(p => (
                    <GlassPanel key={p.id} className="p-4 group flex justify-between items-start">
                        <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-sm text-cyan-600 dark:text-cyan-400">{p.platformDetails?.portalURL || 'Sem portal'}</p>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><PencilIcon className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="text-red-500/70" onClick={() => onDelete(p)}><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhuma Plataforma" onAction={onAdd} actionText="Adicionar Plataforma" />}
    </div>
));

const OperatorsTab = memo(({ operators, onAdd, onEdit, onDelete }) => (
     <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Operadoras de Saúde</h3>
            <Button onClick={onAdd} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>Adicionar Operadora</Button>
        </div>
        {(operators || []).length > 0 ? (
            <div className="space-y-3">
                {operators.map(op => (
                    <GlassPanel key={op.id} className="p-3 flex justify-between items-center group">
                        <p className="font-semibold">{op.name}</p>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(op)}><PencilIcon className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="text-red-500/70" onClick={() => onDelete(op)}><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </GlassPanel>
                ))}
            </div>
        ) : <EmptyState title="Nenhuma Operadora" onAction={onAdd} actionText="Adicionar Operadora" />}
    </div>
));

const GestaoCorporativaPage = () => {
    const { 
        users, roles, partners, operators, companyProfile,
        updateRole, addPartner, updatePartner, deletePartner, 
        addOperator, updateOperator, deleteOperator,
        updateCompanyProfile
    } = useData();
    
    const { createUser, deleteUser, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const { can } = usePermissions();

    const [activeSubPage, setActiveSubPage] = useState('team');
    const [modalState, setModalState] = useState({ user: false, permissions: false, partner: false, platform: false, operator: false });
    const [editingItem, setEditingItem] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);

    const usersWithRoles = useMemo(() => {
        if (!Array.isArray(users) || !Array.isArray(roles)) return [];
        return users.map(user => ({ ...user, role: roles.find(r => r.id === user.roleId) || { name: 'Sem Cargo' } }));
    }, [users, roles]);

    const externalPartners = useMemo(() => (partners || []).filter(p => p.type !== 'Plataforma de Entrega'), [partners]);
    const deliveryPlatforms = useMemo(() => (partners || []).filter(p => p.type === 'Plataforma de Entrega'), [partners]);

    const openModal = (modalName, item = null, roleId = null) => {
        setEditingItem(item);
        setEditingRoleId(roleId);
        setModalState(prev => ({ ...prev, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setModalState(prev => ({ ...prev, [modalName]: false }));
        setEditingItem(null);
        setEditingRoleId(null);
    };

    const handleSaveUser = async (formData) => {
        const { success, code, message } = await createUser(formData);
        toast({ title: success ? "Sucesso!" : "Erro", description: success ? `Usuário ${formData.name} criado.` : message || `Código: ${code}`, variant: success ? 'default' : 'destructive' });
        if (success) closeModal('user');
    };

    const handleDeleteUser = async (userToDelete) => {
        if (userToDelete.role?.name === 'SuperAdmin' || userToDelete.role?.name === 'CEO') {
            toast({ title: "Ação não permitida", description: "Não é possível excluir o SuperAdmin ou CEO.", variant: "destructive" });
            return;
        }
        try {
            await confirm({ title: `Excluir ${userToDelete.name}?`, size: 'sm' });
            const success = await deleteUser(userToDelete.id);
            if (success) toast({ title: "Usuário Excluído" });
        } catch(e) { /* Cancelado pelo usuário */ }
    };
    
    const handleSaveUserPermissions = async (userId, data) => {
        const success = await updateUserProfile(userId, data);
        toast({ title: success ? "Sucesso!" : "Erro", description: success ? "Permissões do usuário atualizadas." : "Falha ao salvar.", variant: success ? 'default' : 'destructive' });
        if (success) closeModal('permissions');
        if (!success) throw new Error("Falha ao atualizar permissões do usuário.");
    };

    const handleSaveRolePermissions = async (roleId, data) => {
        const success = await updateRole(roleId, data);
        toast({ title: success ? "Sucesso!" : "Erro", description: success ? "Permissões do cargo atualizadas." : "Falha ao salvar.", variant: success ? 'default' : 'destructive' });
        if (success) closeModal('permissions');
        if (!success) throw new Error("Falha ao atualizar permissões do cargo.");
    };
    
    const handleSavePartnerOrPlatform = async (data) => {
        const success = data.id ? await updatePartner(data.id, data) : await addPartner(data); 
        toast({ title: "Sucesso!", description: `${data.type || 'Item'} salvo.` });
        if (success) closeModal(data.type === 'Plataforma de Entrega' ? 'platform' : 'partner');
    };
    
    const handleDeletePartnerOrPlatform = async (item) => {
        try {
            await confirm({ title: `Excluir ${item.name}?`});
            await deletePartner(item.id, item.name);
            toast({ title: "Excluído", description: `${item.name} foi removido.` });
        } catch(e){ /* Cancelado */ }
    };
    
    const handleSaveOperator = async (opData) => {
        const success = opData.id ? await updateOperator(opData.id, opData) : await addOperator(opData);
        toast({ title: "Sucesso!", description: "Operadora salva." });
        if (success) closeModal('operator');
    };
    
    const handleDeleteOperator = async (op) => {
        try {
            await confirm({ title: `Excluir Operadora ${op.name}?`});
            await deleteOperator(op.id, op.name);
            toast({ title: "Excluída", description: `${op.name} foi removida.` });
        } catch(e){ /* Cancelado */ }
    };
    
    const handleSaveProfile = async (profileData) => {
        const success = await updateCompanyProfile(profileData);
        toast({ title: success ? "Sucesso!" : "Perfil da empresa atualizado.", variant: success ? 'default' : 'destructive' });
    };

    const subNavItems = [
        { id: 'profile', label: 'Perfil da Empresa', icon: BuildingIcon, permission: 'manageCompanyProfile' },
        { id: 'team', label: 'Colaboradores', icon: UsersIcon, permission: 'manageUsers' },
        { id: 'permissions', label: 'Permissões', icon: ShieldCheckIcon, permission: 'managePermissions' },
        { id: 'partners', label: 'Parceiros', icon: BriefcaseIcon, permission: 'managePartners' },
        { id: 'platforms', label: 'Plataformas', icon: Share2Icon, permission: 'managePartners' },
        { id: 'operators', label: 'Operadoras', icon: BuildingIcon, permission: 'manageOperators' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-6">Gestão Corporativa</h2>
                <nav className="flex flex-row md:flex-col gap-2">
                    {subNavItems.map(item => can('corporate', item.permission) && (
                        <button key={item.id} onClick={() => setActiveSubPage(item.id)}
                            className={cn("w-full flex items-center p-3 rounded-lg font-semibold text-sm", activeSubPage === item.id ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5")}>
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-grow">
                {activeSubPage === 'profile' && <CompanyProfileTab profile={companyProfile} onSave={handleSaveProfile} />}
                {activeSubPage === 'team' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Colaboradores Internos</h3>
                            {can('corporate', 'manageUsers') && <Button onClick={() => openModal('user')} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/> Adicionar Colaborador</Button>}
                        </div>
                        <TeamMembersTab users={usersWithRoles} onDeleteUser={handleDeleteUser} onOpenPermissionsModal={(user) => openModal('permissions', user)} canManageUsers={can('corporate', 'manageUsers')} />
                    </div>
                )}
                {activeSubPage === 'permissions' && <PermissionsTab roles={roles} onOpenPermissionsModal={(user, roleId) => openModal('permissions', user, roleId)} />}
                {activeSubPage === 'partners' && <ExternalPartnersTab partners={externalPartners} onAdd={() => openModal('partner')} onEdit={(p) => openModal('partner', p)} onDelete={handleDeletePartnerOrPlatform} />}
                {activeSubPage === 'platforms' && <PlatformsTab platforms={deliveryPlatforms} onAdd={() => openModal('platform')} onEdit={(p) => openModal('platform', p)} onDelete={handleDeletePartnerOrPlatform} />}
                {activeSubPage === 'operators' && <OperatorsTab operators={operators} onAdd={() => openModal('operator')} onEdit={(op) => openModal('operator', op)} onDelete={handleDeleteOperator} />}
            </main>
            
            <AddCollaboratorModal isOpen={modalState.user} onClose={() => closeModal('user')} onSave={handleSaveUser} roles={roles} />
            
            {modalState.permissions && (
                <PermissionManagementModal 
                    key={editingItem?.id || editingRoleId} 
                    isOpen={modalState.permissions} 
                    onClose={() => closeModal('permissions')} 
                    userToEdit={editingItem} 
                    initialRoleId={editingRoleId} 
                    roles={roles} 
                    onSaveUser={handleSaveUserPermissions} 
                    onSaveRole={handleSaveRolePermissions}
                    allUsers={usersWithRoles} 
                />
            )}
            
            <AddPartnerModal isOpen={modalState.partner} onClose={() => closeModal('partner')} onSave={handleSavePartnerOrPlatform} partner={editingItem} />
            <PlatformPartnerModal isOpen={modalState.platform} onClose={() => closeModal('platform')} onSave={handleSavePartnerOrPlatform} partner={editingItem} />
            <AddOperatorModal isOpen={modalState.operator} onClose={() => closeModal('operator')} onSave={handleSaveOperator} operator={editingItem} />
        </div>
    );
};

export default GestaoCorporativaPage;