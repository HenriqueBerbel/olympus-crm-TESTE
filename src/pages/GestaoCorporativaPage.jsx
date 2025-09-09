import React, { useState, useMemo, memo, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Contextos
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
//          *** VARIANTES DE ANIMAÇÃO ***
// ========================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// ========================================================================
//          *** SUBCOMPONENTES DA PÁGINA (Refinados e Animados) ***
// ========================================================================

const CompanyProfileTab = memo(({ profile, onSave }) => {
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.logoUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { toast } = useToast();
    const storage = getStorage();

    const processFile = useCallback((file) => {
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        } else {
            toast({ title: "Arquivo inválido", description: "Por favor, selecione um arquivo de imagem.", variant: 'warning' });
        }
    }, [toast]);

    const handleFileChange = (e) => processFile(e.target.files[0]);
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };
    const handleDragEvents = (e, dragging) => { e.preventDefault(); e.stopPropagation(); setIsDragging(dragging); };

    const handleUploadAndSave = async () => {
        if (!logoFile) return;
        setIsUploading(true);
        try {
            const storageRef = ref(storage, `company_assets/logo_${Date.now()}_${logoFile.name}`);
            const snapshot = await uploadBytes(storageRef, logoFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await onSave({ logoUrl: downloadURL });
        } catch (error) {
            toast({ title: "Erro no Upload", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Perfil da Empresa</h3>
            <GlassPanel className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <Label>Logo da Empresa</Label>
                        <p className="text-sm text-gray-500 mb-4">Arraste um arquivo ou clique para selecionar o logo.</p>
                        <div
                            className={cn("relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200", isDragging ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : "border-gray-300 dark:border-gray-600 hover:border-violet-400")}
                            onDrop={handleDrop} onDragOver={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}
                        >
                            <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400" />
                            <label htmlFor="logo-upload" className="relative cursor-pointer mt-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500">
                                <span>Selecione um arquivo</span>
                                <Input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG</p>
                        </div>
                         <Button onClick={handleUploadAndSave} disabled={isUploading || !logoFile} className="mt-4">
                            {isUploading ? 'Enviando...' : 'Salvar Logo'}
                        </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-black/20 rounded-lg p-4 min-h-[200px]">
                        <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">Pré-visualização</p>
                        <AnimatePresence>
                            {previewUrl ? (
                                <motion.img key={previewUrl} src={previewUrl} alt="Preview" className="max-h-28 max-w-full object-contain" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} />
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-400">
                                    <ImageIcon className="h-12 w-12 mx-auto" /><p>Nenhum logo definido</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {sortedUsers.map(u => (
                <motion.div key={u.id} variants={itemVariants} whileHover={{ y: -5, scale: 1.03 }}>
                    <GlassPanel className="p-4 flex flex-col group h-full">
                        <div className="flex items-start gap-4">
                            <Avatar src={u.avatar} fallbackText={u?.name?.[0] || 'S'} alt={u.name} className="h-12 w-12 text-xl mt-1"/>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-lg truncate">{u?.name}</p>
                                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{u?.role?.name || 'Sem Cargo'}</p>
                            </div>
                            {canManageUsers && u.role?.name !== 'SuperAdmin' && u.role?.name !== 'CEO' && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" title="Gerenciar Permissões" onClick={() => onOpenPermissionsModal(u)}><AwardIcon className="h-4 w-4 text-cyan-500" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500/70" title="Excluir" onClick={() => onDeleteUser(u)}><Trash2Icon className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    </GlassPanel>
                </motion.div>
            ))}
        </motion.div>
    );
});

const PermissionsTab = memo(({ roles, onOpenPermissionsModal }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Gerenciar Permissões por Cargo</h3>
        <p className="text-sm text-gray-500 mb-6">Clique em um cargo para editar as permissões padrão de todos os usuários que o possuem.</p>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
            {(roles || []).map(role => (
                <motion.div key={role.id} variants={itemVariants} whileHover={{ y: -5, scale: 1.03 }}>
                    <GlassPanel className="p-4 cursor-pointer h-full" onClick={() => onOpenPermissionsModal(null, role.id)}>
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="h-6 w-6 text-violet-500"/>
                            <span className="font-bold text-lg">{role.name}</span>
                        </div>
                    </GlassPanel>
                </motion.div>
            ))}
        </motion.div>
    </div>
));

const CardListTab = memo(({ title, items, onAdd, onEdit, onDelete, onActionText, itemTitleField = 'name', itemSubtitleField = 'type' }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{title}</h3>
            <Button onClick={onAdd} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/>{onActionText}</Button>
        </div>
        {items.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                {items.map(p => (
                    <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -5, scale: 1.03 }}>
                        <GlassPanel className="p-4 group flex justify-between items-start h-full">
                            <div>
                                <p className="font-bold">{p[itemTitleField]}</p>
                                <p className="text-sm text-cyan-600 dark:text-cyan-400">{p[itemSubtitleField] || ''}</p>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><PencilIcon className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="text-red-500/70" onClick={() => onDelete(p)}><Trash2Icon className="h-4 w-4"/></Button>
                            </div>
                        </GlassPanel>
                    </motion.div>
                ))}
            </motion.div>
        ) : <EmptyState title={`Nenhum(a) ${title.toLowerCase()} encontrado(a)`} onAction={onAdd} actionText={onActionText} />}
    </div>
));

// ========================================================================
//          *** COMPONENTE PRINCIPAL DA PÁGINA ***
// ========================================================================
const GestaoCorporativaPage = () => {
    const { 
        users, roles, partners, operators, companyProfile, updateRole, addPartner, updatePartner, deletePartner, 
        addOperator, updateOperator, deleteOperator, updateCompanyProfile
    } = useData();
    
    const { createUser, deleteUser, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const { can } = usePermissions();

    const [activeSubPage, setActiveSubPage] = useState('team');
    const [modalState, setModalState] = useState({ user: false, permissions: false, partner: false, platform: false, operator: false });
    const [editingItem, setEditingItem] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);

    const usersWithRoles = useMemo(() => (Array.isArray(users) && Array.isArray(roles)) ? users.map(user => ({ ...user, role: roles.find(r => r.id === user.roleId) || { name: 'Sem Cargo' } })) : [], [users, roles]);
    const externalPartners = useMemo(() => (partners || []).filter(p => p.type !== 'Plataforma de Entrega'), [partners]);
    const deliveryPlatforms = useMemo(() => (partners || []).filter(p => p.type === 'Plataforma de Entrega'), [partners]);

    const openModal = (modalName, item = null, roleId = null) => { setEditingItem(item); setEditingRoleId(roleId); setModalState(prev => ({ ...prev, [modalName]: true })); };
    const closeModal = (modalName) => { setModalState(prev => ({ ...prev, [modalName]: false })); setEditingItem(null); setEditingRoleId(null);};
    const handleSaveUser = async (formData) => { const { success } = await createUser(formData); if (success) closeModal('user'); };
    const handleDeleteUser = async (userToDelete) => {
        if (userToDelete.role?.name === 'SuperAdmin' || userToDelete.role?.name === 'CEO') {
            toast({ title: "Ação não permitida", variant: "destructive" }); return; }
        try { await confirm({ title: `Excluir ${userToDelete.name}?`, size: 'sm' }); await deleteUser(userToDelete.id); } catch(e) {}
    };
    const handleSaveUserPermissions = async (userId, data) => { const success = await updateUserProfile(userId, data); if (success) closeModal('permissions'); };
    const handleSaveRolePermissions = async (roleId, data) => { const success = await updateRole(roleId, data); if (success) closeModal('permissions');};
    const handleSavePartnerOrPlatform = async (data) => { const success = data.id ? await updatePartner(data.id, data) : await addPartner(data); if (success) closeModal(data.type === 'Plataforma de Entrega' ? 'platform' : 'partner'); };
    const handleDeletePartnerOrPlatform = async (item) => { try { await confirm({ title: `Excluir ${item.name}?`}); await deletePartner(item.id, item.name); } catch(e){} };
    const handleSaveOperator = async (opData) => { const success = opData.id ? await updateOperator(opData.id, opData) : await addOperator(opData); if (success) closeModal('operator'); };
    const handleDeleteOperator = async (op) => { try { await confirm({ title: `Excluir Operadora ${op.name}?`}); await deleteOperator(op.id, op.name); } catch(e){} };
    const handleSaveProfile = async (profileData) => { await updateCompanyProfile(profileData); };
    
    const subNavItems = [
        { id: 'profile', label: 'Perfil da Empresa', icon: BuildingIcon, permission: 'manageCompanyProfile' },
        { id: 'team', label: 'Colaboradores', icon: UsersIcon, permission: 'manageUsers' },
        { id: 'permissions', label: 'Permissões', icon: ShieldCheckIcon, permission: 'managePermissions' },
        { id: 'partners', label: 'Parceiros', icon: BriefcaseIcon, permission: 'managePartners' },
        { id: 'platforms', label: 'Plataformas', icon: Share2Icon, permission: 'managePartners' },
        { id: 'operators', label: 'Operadoras', icon: BuildingIcon, permission: 'manageOperators' },
    ];
    
    const renderContent = () => {
        switch (activeSubPage) {
            case 'profile': return <CompanyProfileTab profile={companyProfile} onSave={handleSaveProfile} />;
            case 'team': return (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Colaboradores Internos</h3>
                        {can('corporate', 'manageUsers') && <Button onClick={() => openModal('user')} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2"/> Adicionar Colaborador</Button>}
                    </div>
                    <TeamMembersTab users={usersWithRoles} onDeleteUser={handleDeleteUser} onOpenPermissionsModal={(user) => openModal('permissions', user)} canManageUsers={can('corporate', 'manageUsers')} />
                </div>
            );
            case 'permissions': return <PermissionsTab roles={roles} onOpenPermissionsModal={(user, roleId) => openModal('permissions', user, roleId)} />;
            case 'partners': return <CardListTab title="Parceiros Externos" items={externalPartners} onAdd={() => openModal('partner')} onEdit={(p) => openModal('partner', p)} onDelete={handleDeletePartnerOrPlatform} onActionText="Adicionar Parceiro" />;
            case 'platforms': return <CardListTab title="Plataformas de Entrega" items={deliveryPlatforms} onAdd={() => openModal('platform')} onEdit={(p) => openModal('platform', p)} onDelete={handleDeletePartnerOrPlatform} onActionText="Adicionar Plataforma" itemSubtitleField="platformDetails.portalURL" />;
            case 'operators': return <CardListTab title="Operadoras de Saúde" items={operators} onAdd={() => openModal('operator')} onEdit={(op) => openModal('operator', op)} onDelete={handleDeleteOperator} onActionText="Adicionar Operadora" itemSubtitleField={null} />;
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-x-12 gap-y-8">
            <aside className="w-full md:w-60 flex-shrink-0">
                <motion.h2 className="text-2xl font-bold mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    Gestão Corporativa
                </motion.h2>
                <nav className="flex flex-row md:flex-col gap-2">
                    {subNavItems.map(item => can('corporate', item.permission) && (
                        <button key={item.id} onClick={() => setActiveSubPage(item.id)}
                            className={cn("w-full flex items-center p-3 rounded-lg font-semibold text-sm transition-colors duration-200", activeSubPage === item.id ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5")}>
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-grow min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSubPage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
            
            <AddCollaboratorModal isOpen={modalState.user} onClose={() => closeModal('user')} onSave={handleSaveUser} roles={roles} />
            {modalState.permissions && (<PermissionManagementModal key={editingItem?.id || editingRoleId} isOpen={modalState.permissions} onClose={() => closeModal('permissions')} userToEdit={editingItem} initialRoleId={editingRoleId} roles={roles} onSaveUser={handleSaveUserPermissions} onSaveRole={handleSaveRolePermissions} allUsers={usersWithRoles} />)}
            <AddPartnerModal isOpen={modalState.partner} onClose={() => closeModal('partner')} onSave={handleSavePartnerOrPlatform} partner={editingItem} />
            <PlatformPartnerModal isOpen={modalState.platform} onClose={() => closeModal('platform')} onSave={handleSavePartnerOrPlatform} partner={editingItem} />
            <AddOperatorModal isOpen={modalState.operator} onClose={() => closeModal('operator')} onSave={handleSaveOperator} operator={editingItem} />
        </div>
    );
};

export default GestaoCorporativaPage;