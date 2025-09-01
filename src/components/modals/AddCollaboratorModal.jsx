import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/NotificationContext';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Label from '../Label';
import Select from '../Select';

const AddCollaboratorModal = ({ isOpen, onClose, roles }) => {
    const { createUser } = useAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleId: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.roleId) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const result = await createUser(formData);
        if (result.success) {
            toast({ title: "Sucesso!", description: `Usuário ${formData.name} criado.` });
            onClose();
        } else {
            toast({ title: "Erro", description: result.message || "Não foi possível criar o usuário.", variant: 'destructive' });
        }
        setLoading(false);
    };

    // Reseta o formulário quando o modal é fechado
    const handleClose = () => {
        setFormData({ name: '', email: '', password: '', roleId: '' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Novo Colaborador">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João da Silva" />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="joao.silva@suaempresa.com" />
                </div>
                <div>
                    <Label htmlFor="password">Senha Provisória</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                    <Label htmlFor="roleId">Cargo</Label>
                    <Select id="roleId" name="roleId" value={formData.roleId} onChange={handleChange}>
                        <option value="">Selecione um cargo</option>
                        {roles?.filter(r => r.name !== 'SuperAdmin').map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Colaborador'}</Button>
            </div>
        </Modal>
    );
};

export default AddCollaboratorModal;
