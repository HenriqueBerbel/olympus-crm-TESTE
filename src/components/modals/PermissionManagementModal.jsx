import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Select from '../Select';
import Button from '../Button';
import { useData } from '../../contexts/DataContext';

const PermissionManagementModal = ({ isOpen, onClose, userToEdit, onSave }) => {
    const { roles } = useData(); // Pega a lista de cargos do nosso DataContext
    const [selectedRoleId, setSelectedRoleId] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setSelectedRoleId(userToEdit.roleId || 'corretor'); // Define o cargo atual do usuário
        }
    }, [userToEdit]);

    if (!userToEdit) return null;

    const handleSave = () => {
        onSave(userToEdit.id, { roleId: selectedRoleId });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Permissões de ${userToEdit.name}`}>
            <div className="space-y-6">
                <div>
                    <Label>Função Principal (Cargo)</Label>
                    <p className="text-sm text-gray-500 mb-2">
                        A seleção de um cargo aplicará automaticamente todas as permissões pré-definidas para aquele nível de acesso.
                    </p>
                    <Select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="button" variant="violet" onClick={handleSave}>Salvar Permissões</Button>
            </div>
        </Modal>
    );
};

export default PermissionManagementModal;