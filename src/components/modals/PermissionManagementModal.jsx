import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import Input from '../Input';
import Checkbox from '../Checkbox';
import { useToast } from '../../contexts/NotificationContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';
import { InfoIcon } from '../Icons';

// --- SUBCOMPONENTE PARA A ABA DE CARGOS (RBAC) ---
const RolePermissionsTab = ({ permissions, onChange, onCorporateChange, roleName, isSaving }) => {
    const modulesConfig = [
        { id: 'leads', name: 'Leads' }, { id: 'clients', name: 'Clientes' },
        { id: 'tasks', name: 'Tarefas' }, { id: 'commissions', name: 'Comissões' },
        { id: 'production', name: 'Produção' }, { id: 'timeline', name: 'Time-Line' },
    ];
    const corporateConfig = [
        { id: 'manageUsers', name: 'Gerenciar Usuários' }, { id: 'managePermissions', name: 'Gerenciar Permissões' },
        { id: 'managePartners', name: 'Gerenciar Parceiros' }, { id: 'manageOperators', name: 'Gerenciar Operadoras' },
        { id: 'manageCompanyProfile', name: 'Perfil da Empresa' }
    ];

    const PermissionRow = ({ name, moduleKey, permissions, onChange }) => {
        const viewEditOptions = ['Nenhum', 'Próprio', 'Todos'];
        const deleteOptions = ['Nenhum', 'Próprio', 'Todos'];

        return (
            <tr className="border-b border-gray-200 dark:border-white/10 last:border-b-0">
                <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{name}</td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.view?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'view', e.target.value)} disabled={isSaving}>{viewEditOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.edit?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'edit', e.target.value)} disabled={isSaving}>{viewEditOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.delete?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'delete', e.target.value)} disabled={isSaving}>{deleteOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4 text-center"><Checkbox checked={!!permissions?.create} onChange={e => onChange(moduleKey, 'create', e.target.checked)} disabled={isSaving} /></td>
            </tr>
        );
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-4">Estas são as permissões <strong>padrão</strong> para todos os usuários com o cargo de <strong>{roleName}</strong>.</p>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 px-4">Módulo</th>
                        <th className="text-left py-3 px-4">Ver</th>
                        <th className="text-left py-3 px-4">Editar</th>
                        <th className="text-left py-3 px-4">Excluir</th>
                        <th className="text-left py-3 px-4 text-center">Criar</th>
                    </tr>
                </thead>
                <tbody>
                    {modulesConfig.map(module => (
                        <PermissionRow key={module.id} name={module.name} moduleKey={module.id} permissions={permissions[module.id]} onChange={onChange} />
                    ))}
                </tbody>
            </table>
            <div className="mt-8">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Permissões Corporativas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    {corporateConfig.map(corp => (
                        <label key={corp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox id={`${corp.id}-role`} checked={!!permissions.corporate?.[corp.id]} onChange={e => onCorporateChange(corp.id, e.target.checked)} disabled={isSaving} />
                            {corp.name}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- SUBCOMPONENTE PARA A ABA INDIVIDUAL (ACL) ---
const AclPermissionsTab = ({ permissions, rolePermissions, onChange, allUsers = [], currentUser, isSaving }) => {
    const modulesConfig = [
        { id: 'leads', name: 'Leads' },
        { id: 'clients', name: 'Clientes' },
        { id: 'tasks', name: 'Tarefas' },
        { id: 'commissions', name: 'Comissões' },
        { id: 'production', name: 'Produção' },
    ];
    
    const otherUsers = useMemo(() => {
        if (!allUsers || !currentUser) return [];
        return allUsers.filter(u => u.id !== currentUser.id);
    }, [allUsers, currentUser]);

    return (
        <div>
            <p className="text-sm text-gray-500 mb-6">Estas permissões são <strong>exclusivas</strong> para o usuário <strong>{currentUser.name}</strong> e irão <strong>sobrescrever</strong> as do cargo. Configure de quem este usuário pode ver, editar ou excluir dados.</p>
            <div className="space-y-6">
                {modulesConfig.map(module => (
                    <AclPermissionRow
                        key={module.id}
                        module={module}
                        userPermission={permissions[module.id]}
                        rolePermission={rolePermissions[module.id]}
                        onChange={onChange}
                        otherUsers={otherUsers}
                        isSaving={isSaving}
                    />
                ))}
            </div>
        </div>
    );
};

const AclPermissionRow = ({ module, userPermission, rolePermission, onChange, otherUsers, isSaving }) => {
    const scopeOptions = ['Herdar do Cargo', 'Nenhum', 'Próprio', 'Todos', 'Usuários Específicos'];
    const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

    const getInitialScope = () => userPermission?.view?.scope || 'herdar_do_cargo';
    const getInitialSelectedUsers = () => userPermission?.view?.allowedUserIds || [];

    const [scope, setScope] = useState(getInitialScope);
    const [selectedUserIds, setSelectedUserIds] = useState(getInitialSelectedUsers);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setScope(getInitialScope());
        setSelectedUserIds(getInitialSelectedUsers());
    }, [userPermission]);

    const handleScopeChange = (newScope) => {
        setScope(newScope);
        if (newScope === 'herdar_do_cargo') {
            onChange(module.id, 'view', null);
        } else {
            const newAllowedIds = newScope === 'usuários_específicos' ? selectedUserIds : [];
            onChange(module.id, 'view', newScope, newAllowedIds);
        }
    };

    const handleUserSelectionChange = (userId) => {
        const newSelectedIds = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
        setSelectedUserIds(newSelectedIds);
        onChange(module.id, 'view', 'usuários_específicos', newSelectedIds);
    };
    
    const inheritedPermissionText = capitalize(rolePermission?.view?.scope?.replace(/_/g, ' ')) || 'Não Definida';

    const filteredUsers = useMemo(() => {
        return otherUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [otherUsers, searchTerm]);

    return (
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
            <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">{module.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Escopo de Visualização</label>
                    <p className="text-xs text-gray-500 mb-2">Permissão herdada do cargo: <strong>{inheritedPermissionText}</strong></p>
                    <Select value={scope} onChange={e => handleScopeChange(e.target.value)} disabled={isSaving}>
                        {scopeOptions.map(opt => <option key={opt} value={opt.toLowerCase().replace(/ /g, '_')}>{opt}</option>)}
                    </Select>
                </div>
                {scope === 'usuários_específicos' && (
                    <div className="border-l-2 border-gray-200 dark:border-white/10 pl-6">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selecionar Usuários Visíveis</label>
                        <Input 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            placeholder="Buscar usuário..." 
                            className="mt-2 w-full"
                            disabled={isSaving}
                        />
                        <div className="max-h-36 overflow-y-auto space-y-1 mt-2 pr-2 border-t border-gray-200 dark:border-white/10 pt-2">
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <label key={u.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
                                    <Checkbox id={`user-sel-${u.id}`} checked={selectedUserIds.includes(u.id)} onChange={() => handleUserSelectionChange(u.id)} disabled={isSaving}/>
                                    {u.name}
                                </label>
                            )) : <p className="text-xs text-gray-400 p-2">Nenhum usuário encontrado.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export const PermissionManagementModal = ({ isOpen, onClose, userToEdit, initialRoleId, roles, onSaveUser, onSaveRole, allUsers }) => {
    const { toast } = useToast();
    const [userPermissions, setUserPermissions] = useState({});
    const [rolePermissions, setRolePermissions] = useState({});
    const [activeTab, setActiveTab] = useState(userToEdit ? 'user' : 'role');
    const [isSaving, setIsSaving] = useState(false);

    const targetRole = useMemo(() => {
        const roleId = userToEdit ? userToEdit.roleId : initialRoleId;
        return (roles || []).find(r => r.id === roleId);
    }, [userToEdit, initialRoleId, roles]);

    useEffect(() => {
        if (userToEdit) setUserPermissions(JSON.parse(JSON.stringify(userToEdit.permissions || {})));
        if (targetRole) setRolePermissions(JSON.parse(JSON.stringify(targetRole.permissions || {})));
    }, [userToEdit, targetRole, isOpen]);
    
    const handleUserPermissionChange = (module, action, scope, allowedUserIds = []) => {
        setUserPermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[module]) newPermissions[module] = {};

            if (scope === null) {
                delete newPermissions[module][action];
                if (Object.keys(newPermissions[module]).length === 0) delete newPermissions[module];
                return newPermissions;
            }

            if (action === 'create') {
                newPermissions[module].create = scope;
            } else {
                newPermissions[module][action] = { scope };
                if (scope === 'usuários_específicos' && allowedUserIds.length > 0) {
                    newPermissions[module][action].allowedUserIds = allowedUserIds;
                }
            }
            return newPermissions;
        });
    };

    const handleRolePermissionChange = (module, action, scope) => {
        setRolePermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[module]) newPermissions[module] = {};
            
            if (action === 'create') {
                newPermissions[module].create = scope;
            } else {
                 newPermissions[module][action] = { scope };
            }
            return newPermissions;
        });
    };

    const handleUserCorporateChange = (key, value) => setUserPermissions(prev => ({ ...prev, corporate: { ...prev.corporate, [key]: value } }));
    const handleRoleCorporateChange = (key, value) => setRolePermissions(prev => ({ ...prev, corporate: { ...prev.corporate, [key]: value } }));
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const activeUserName = userToEdit?.name;
            const activeRoleName = targetRole?.name;

            if (activeTab === 'user' && userToEdit) {
                await onSaveUser(userToEdit.id, { permissions: userPermissions });
                toast({ title: "Sucesso!", description: `Permissões de ${activeUserName} foram atualizadas.` });
            } else if (activeTab === 'role' && targetRole) {
                await onSaveRole(targetRole.id, { permissions: rolePermissions });
                toast({ title: "Sucesso!", description: `Permissões do cargo ${activeRoleName} foram atualizadas.` });
            }
            onClose();
        } catch (error) {
            console.error("Falha ao salvar permissões:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const target = userToEdit || targetRole;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar Permissões: ${target?.name || ''}`} size="6xl" closeOnClickOutside={false}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    {userToEdit && <TabsTrigger value="user" disabled={isSaving}>Permissões de {userToEdit.name} (Individual)</TabsTrigger>}
                    {targetRole && <TabsTrigger value="role" disabled={isSaving}>Permissões de {targetRole.name} (Cargo)</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="user" className="mt-6">
                    {userToEdit && targetRole && <AclPermissionsTab permissions={userPermissions} rolePermissions={rolePermissions} onChange={handleUserPermissionChange} allUsers={allUsers} currentUser={userToEdit} isSaving={isSaving} />}
                </TabsContent>

                <TabsContent value="role" className="mt-6">
                     {targetRole && <RolePermissionsTab permissions={rolePermissions} onChange={handleRolePermissionChange} onCorporateChange={handleRoleCorporateChange} roleName={targetRole.name} isSaving={isSaving} />}
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </Modal>
    );
};