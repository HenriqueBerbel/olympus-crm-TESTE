import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Label from '../Label';
import Select from '../Select'; // Importado para o novo seletor de permissão
import Avatar from '../Avatar';
import { useToast } from '../../contexts/NotificationContext';
import { XIcon, SearchIcon } from '../Icons'; // Supondo um ícone de busca

const ShareModal = ({ isOpen, onClose, onSave, allUsers = [], documentData }) => {
    const { toast } = useToast();

    const [viewers, setViewers] = useState([]);
    const [editors, setEditors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && documentData) {
            setViewers(documentData.accessControl?.viewers || []);
            setEditors(documentData.accessControl?.editors || []);
        } else if (!isOpen) {
            setTimeout(() => {
                setSearchTerm('');
                setIsSaving(false);
            }, 200);
        }
    }, [isOpen, documentData]);

    const availableUsers = useMemo(() => {
        if (!searchTerm) return [];
        const currentAcls = new Set([...viewers, ...editors, documentData.ownerId]);
        return allUsers.filter(u => 
            !currentAcls.has(u.id) && 
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, viewers, editors, documentData?.ownerId, searchTerm]);

    const addPermission = (user, level) => {
        if (level === 'viewer') setViewers(prev => [...prev, user.id]);
        if (level === 'editor') setEditors(prev => [...prev, user.id]);
        setSearchTerm('');
    };

    // MELHORIA DE UX: Função única para gerenciar permissões
    const handlePermissionChange = (userId, newLevel) => {
        // Remove o usuário de ambas as listas primeiro
        const newViewers = viewers.filter(id => id !== userId);
        const newEditors = editors.filter(id => id !== userId);

        // Adiciona de volta à lista correta, se necessário
        if (newLevel === 'viewer') setViewers([...newViewers, userId]);
        if (newLevel === 'editor') setEditors([...newEditors, userId]);
        if (newLevel === 'remove') { // Ação de remover
            setViewers(newViewers);
            setEditors(newEditors);
        }
    };
    
    // MELHORIA: Lógica de salvamento robusta
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(documentData.id, {
                accessControl: { viewers, editors }
            });
            toast({ title: "Sucesso!", description: "Permissões de compartilhamento atualizadas." });
            onClose(); // Fecha apenas no sucesso
        } catch (error) {
            console.error("Falha ao salvar permissões:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const getUserById = (id) => allUsers.find(u => u.id === id);
    const owner = useMemo(() => getUserById(documentData?.ownerId), [documentData?.ownerId, allUsers]);

    if (!isOpen || !documentData) return null;

    // Componente auxiliar para renderizar um usuário na lista de acesso
    const UserAccessRow = ({ userId, level }) => {
        const user = getUserById(userId);
        if (!user) return null;
        return (
            <div className="flex items-center justify-between p-2 rounded-lg">
                <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} fallbackText={user.name[0]} className="w-9 h-9"/>
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                </div>
                <Select size="sm" value={level} onChange={(e) => handlePermissionChange(userId, e.target.value)} disabled={isSaving}>
                    <option value="editor">Pode Editar</option>
                    <option value="viewer">Pode Ver</option>
                    <option value="remove">Remover Acesso</option>
                </Select>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Compartilhar: ${documentData.name || documentData.title}`} size="2xl" closeOnClickOutside={false}>
            <div className="space-y-6">
                <div className="relative">
                    <Label htmlFor="share-search">Adicionar pessoas</Label>
                    <div className="relative mt-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            id="share-search"
                            type="text"
                            placeholder="Buscar por nome para compartilhar..."
                            className="w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    {searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {availableUsers.length > 0 ? availableUsers.map(u => (
                                <div key={u.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2"><Avatar src={u.avatar} fallbackText={u.name[0]} className="w-8 h-8"/><span>{u.name}</span></div>
                                    <div>
                                        <Button size="sm" variant="outline" onClick={() => addPermission(u, 'viewer')}>Pode Ver</Button>
                                        <Button size="sm" className="ml-2" onClick={() => addPermission(u, 'editor')}>Pode Editar</Button>
                                    </div>
                                </div>
                            )) : <p className="p-3 text-sm text-gray-500 text-center">Nenhum usuário encontrado.</p>}
                        </div>
                    )}
                </div>

                <div>
                    <Label>Pessoas com acesso</Label>
                    <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-2">
                        {owner && (
                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3"><Avatar src={owner.avatar} fallbackText={owner.name[0]} className="w-9 h-9"/><div className="flex flex-col"><span className="font-semibold text-gray-800 dark:text-gray-200">{owner.name}</span><span className="text-xs text-gray-500">{owner.email}</span></div></div>
                                <span className="text-sm font-semibold text-gray-500 px-2">Proprietário</span>
                            </div>
                        )}
                        {/* MELHORIA DE UI: Seções separadas para Editores e Leitores */}
                        {editors.length > 0 && <h4 className="text-xs font-bold uppercase text-gray-400 pt-2">Editores</h4>}
                        {editors.map(id => <UserAccessRow key={id} userId={id} level="editor" />)}
                        
                        {viewers.length > 0 && <h4 className="text-xs font-bold uppercase text-gray-400 pt-2">Leitores</h4>}
                        {viewers.map(id => <UserAccessRow key={id} userId={id} level="viewer" />)}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="button" variant="violet" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
        </Modal>
    );
};

export default ShareModal;