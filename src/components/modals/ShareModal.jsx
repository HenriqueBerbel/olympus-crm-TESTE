// src/components/modals/ShareModal.jsx

import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Label from '../Label';
import Avatar from '../Avatar';
import { XIcon } from '../Icons';

const ShareModal = ({ isOpen, onClose, onSave, allUsers = [], documentData }) => {
    if (!isOpen || !documentData) return null;
    
    // Estados para gerenciar quem tem acesso, inicializados com os dados do documento
    const [viewers, setViewers] = useState(documentData.accessControl?.viewers || []);
    const [editors, setEditors] = useState(documentData.accessControl?.editors || []);
    
    // Estados para a busca de usuários
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Filtra usuários que podem ser adicionados (não são o dono e ainda não estão na lista)
    const availableUsers = useMemo(() => {
        if (!searchTerm) return [];
        const currentAcls = new Set([...viewers, ...editors, documentData.ownerId]);
        return allUsers.filter(u => 
            !currentAcls.has(u.id) && 
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, viewers, editors, documentData.ownerId, searchTerm]);

    const addPermission = (user, level) => {
        if (level === 'viewer') setViewers(prev => [...prev, user.id]);
        if (level === 'editor') setEditors(prev => [...prev, user.id]);
        setIsSearching(false);
        setSearchTerm('');
    };

    const removePermission = (userId, level) => {
        if (level === 'viewer') setViewers(prev => prev.filter(id => id !== userId));
        if (level === 'editor') setEditors(prev => prev.filter(id => id !== userId));
    };

    const handleSave = () => {
        onSave(documentData.id, {
            accessControl: { viewers, editors }
        });
        onClose();
    };

    const getUserById = (id) => allUsers.find(u => u.id === id);
    const owner = getUserById(documentData.ownerId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Compartilhar: ${documentData.name || documentData.title}`} size="2xl">
            <div className="space-y-6">
                {/* Seção de Busca */}
                <div className="relative">
                    <Label>Adicionar pessoas</Label>
                    <input
                        type="text"
                        placeholder="Buscar por nome para compartilhar..."
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        onBlur={() => setTimeout(() => setIsSearching(false), 200)} // Pequeno delay para permitir o clique
                    />
                    {isSearching && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {availableUsers.length > 0 ? availableUsers.map(u => (
                                <div key={u.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={u.avatar} fallbackText={u.name[0]} className="w-8 h-8"/>
                                        <span>{u.name}</span>
                                    </div>
                                    <div>
                                        <Button size="sm" variant="outline" onClick={() => addPermission(u, 'viewer')}>Pode Ver</Button>
                                        <Button size="sm" variant="default" className="ml-2" onClick={() => addPermission(u, 'editor')}>Pode Editar</Button>
                                    </div>
                                </div>
                            )) : <p className="p-2 text-sm text-gray-500">Nenhum usuário encontrado.</p>}
                        </div>
                    )}
                </div>

                {/* Lista de Pessoas com Acesso */}
                <div>
                    <Label>Pessoas com acesso</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                        {/* Dono (sempre tem acesso total) */}
                        {owner && (
                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-2">
                                    <Avatar src={owner.avatar} fallbackText={owner.name[0]} className="w-8 h-8"/>
                                    <span>{owner.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500">Proprietário</span>
                            </div>
                        )}
                        {/* Editores */}
                        {editors.map(id => {
                            const user = getUserById(id);
                            return user ? (
                                <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={user.avatar} fallbackText={user.name[0]} className="w-8 h-8"/>
                                        <span>{user.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removePermission(id, 'editor')}><XIcon className="w-4 h-4"/></Button>
                                </div>
                            ) : null;
                        })}
                        {/* Visualizadores */}
                        {viewers.map(id => {
                            const user = getUserById(id);
                            return user ? (
                                <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={user.avatar} fallbackText={user.name[0]} className="w-8 h-8"/>
                                        <span>{user.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removePermission(id, 'viewer')}><XIcon className="w-4 h-4"/></Button>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" variant="violet" onClick={handleSave}>Salvar</Button>
            </div>
        </Modal>
    );
};

export default ShareModal;
