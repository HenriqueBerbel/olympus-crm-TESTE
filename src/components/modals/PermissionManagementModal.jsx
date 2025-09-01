import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Select from '../Select';
import Checkbox from '../Checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';

// --- SUBCOMPONENTE PARA A ABA DE CARGOS (RBAC) ---
const RolePermissionsTab = ({ permissions, onChange, onCorporateChange, roleName }) => {
    const modulesConfig = [
        { id: 'leads', name: 'Leads' }, { id: 'clients', name: 'Clientes' },
        { id: 'tasks', name: 'Tarefas' }, { id: 'commissions', name: 'Comissões' },
        { id: 'production', name: 'Produção' }, { id: 'timeline', name: 'Time-Line' },
    ];
    const corporateConfig = [
        { id: 'manageUsers', name: 'Gerenciar Usuários' }, { id: 'managePermissions', name: 'Gerenciar Permissões de Cargos' },
        { id: 'managePartners', name: 'Gerenciar Parceiros' }, { id: 'manageOperators', name: 'Gerenciar Operadoras' },
        { id: 'manageCompanyProfile', name: 'Gerenciar Perfil da Empresa' }
    ];

    const PermissionRow = ({ name, moduleKey, permissions, onChange }) => {
        const viewEditOptions = ['Nenhum', 'Próprio', 'Todos'];
        const deleteOptions = ['Nenhum', 'Próprio', 'Todos']; // 'Todos' pode ser uma opção para delete em cargos

        return (
            <tr className="border-b border-gray-200 dark:border-white/10 last:border-b-0">
                <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{name}</td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.view?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'view', e.target.value)}>{viewEditOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.edit?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'edit', e.target.value)}>{viewEditOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4"><Select size="sm" value={permissions?.delete?.scope || 'nenhum'} onChange={e => onChange(moduleKey, 'delete', e.target.value)}>{deleteOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}</Select></td>
                <td className="py-2 px-4 text-center"><Checkbox checked={!!permissions?.create} onChange={e => onChange(moduleKey, 'create', e.target.checked)} /></td>
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
            <div className="mt-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Permissões Corporativas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    {corporateConfig.map(corp => (
                        <label key={corp.id} className="flex items-center gap-2 text-sm">
                            <Checkbox id={`${corp.id}-role`} checked={!!permissions.corporate?.[corp.id]} onChange={e => onCorporateChange(corp.id, e.target.checked)} />
                            {corp.name}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- SUBCOMPONENTE PARA A ABA INDIVIDUAL (ACL) ---
const AclPermissionsTab = ({ permissions, rolePermissions, onChange, allUsers = [], currentUser }) => {
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
            <p className="text-sm text-gray-500 mb-6">Estas permissões são <strong>exclusivas</strong> para este usuário e irão <strong>sobrescrever</strong> as do cargo. Configure de quem este usuário pode ver, editar ou excluir dados.</p>
            <div className="space-y-6">
                {modulesConfig.map(module => (
                    <AclPermissionRow
                        key={module.id}
                        module={module}
                        userPermission={permissions[module.id]}
                        rolePermission={rolePermissions[module.id]}
                        onChange={onChange}
                        otherUsers={otherUsers}
                    />
                ))}
            </div>
        </div>
    );
};

const AclPermissionRow = ({ module, userPermission, rolePermission, onChange, otherUsers }) => {
    const scopeOptions = ['Herdar do Cargo', 'Nenhum', 'Próprio', 'Todos', 'Usuários Específicos'];
    const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

    const getInitialScope = () => {
        if (!userPermission || !userPermission.view) return 'herdar_do_cargo';
        return userPermission.view.scope;
    };

    const [scope, setScope] = useState(getInitialScope);
    const [selectedUserIds, setSelectedUserIds] = useState(userPermission?.view?.allowedUserIds || []);

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
    
    const inheritedPermissionText = capitalize(rolePermission?.view?.scope) || 'Não Definida';

    return (
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
            <h4 className="font-bold text-lg mb-2">{module.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Escopo de Visualização</label>
                    <p className="text-xs text-gray-500 mb-2">Permissão do cargo: <strong>{inheritedPermissionText}</strong></p>
                    <Select value={scope} onChange={e => handleScopeChange(e.target.value)}>
                        {scopeOptions.map(opt => <option key={opt} value={opt.toLowerCase().replace(/ /g, '_')}>{opt}</option>)}
                    </Select>
                </div>
                {scope === 'usuários_específicos' && (
                    <div className="border-l border-gray-200 dark:border-white/10 pl-4">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selecionar Usuários Visíveis</label>
                        <p className="text-xs text-gray-500 mb-2">Marque de quais usuários os dados serão visíveis.</p>
                        <div className="max-h-32 overflow-y-auto space-y-1 mt-2 pr-2">
                            {otherUsers.length > 0 ? otherUsers.map(u => (
                                <label key={u.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10">
                                    <Checkbox id={`user-sel-${u.id}`} checked={selectedUserIds.includes(u.id)} onChange={() => handleUserSelectionChange(u.id)} />
                                    {u.name}
                                </label>
                            )) : <p className="text-xs text-gray-400">Nenhum outro usuário no sistema.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export const PermissionManagementModal = ({ isOpen, onClose, userToEdit, initialRoleId, roles, onSaveUser, onSaveRole, allUsers }) => {
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
            if (activeTab === 'user' && userToEdit) {
                await onSaveUser(userToEdit.id, { permissions: userPermissions });
            } else if (activeTab === 'role' && targetRole) {
                await onSaveRole(targetRole.id, { permissions: rolePermissions });
            }
        } catch (error) {
            console.error("Falha ao salvar permissões:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const target = userToEdit || targetRole;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar Permissões: ${target?.name || ''}`} size="6xl">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    {userToEdit && <TabsTrigger value="user">Permissões de {userToEdit.name} (Individual)</TabsTrigger>}
                    {targetRole && <TabsTrigger value="role">Permissões de {targetRole.name} (Cargo)</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="user" className="mt-4">
                    {userToEdit && targetRole && <AclPermissionsTab permissions={userPermissions} rolePermissions={rolePermissions} onChange={handleUserPermissionChange} allUsers={allUsers} currentUser={userToEdit} />}
                </TabsContent>

                <TabsContent value="role" className="mt-4">
                     {targetRole && <RolePermissionsTab permissions={rolePermissions} onChange={handleRolePermissionChange} onCorporateChange={handleRoleCorporateChange} roleName={targetRole.name} />}
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} className="ml-4" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </Modal>
    );
};