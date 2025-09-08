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
    
    // Estado inicial do formulário para facilitar o reset
    const initialState = { name: '', email: '', password: '', roleId: '' };
    
    const [formData, setFormData] = useState(initialState);
    // MELHORIA: Renomeado para maior clareza
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Se já estiver salvando, ignora novos cliques
        if (isSaving) return;

        // Validação
        if (!formData.name || !formData.email || !formData.password || !formData.roleId) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos.", variant: "destructive" });
            return;
        }

        // MELHORIA: Lógica de salvamento mais robusta
        setIsSaving(true);
        try {
            const result = await createUser(formData);
            if (result.success) {
                toast({ title: "Sucesso!", description: `Usuário ${formData.name} criado.` });
                handleClose(); // Fecha e limpa o modal
            } else {
                toast({ title: "Erro", description: result.message || "Não foi possível criar o usuário.", variant: 'destructive' });
            }
        } catch (error) {
            console.error("Erro inesperado ao criar usuário:", error);
            toast({ title: "Erro Inesperado", description: "Ocorreu um problema de comunicação. Tente novamente.", variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reseta o formulário e chama a função de fechar do pai
    const handleClose = () => {
        setFormData(initialState);
        onClose();
    };

    return (
        // MELHORIA: Adicionado closeOnClickOutside={false}
        <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Novo Colaborador" closeOnClickOutside={false}>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João da Silva" disabled={isSaving}/>
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="joao.silva@suaempresa.com" disabled={isSaving}/>
                </div>
                <div>
                    <Label htmlFor="password">Senha Provisória</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" disabled={isSaving}/>
                </div>
                <div>
                    <Label htmlFor="roleId">Cargo</Label>
                    <Select id="roleId" name="roleId" value={formData.roleId} onChange={handleChange} disabled={isSaving}>
                        <option value="">Selecione um cargo</option>
                        {/* Filtrar SuperAdmin é uma boa prática de segurança */}
                        {roles?.filter(r => r.name !== 'SuperAdmin').map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Colaborador'}
                </Button>
            </div>
        </Modal>
    );
};

export default AddCollaboratorModal;