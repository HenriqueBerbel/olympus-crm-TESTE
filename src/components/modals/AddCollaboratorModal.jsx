import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';

const AddCollaboratorModal = ({ isOpen, onClose, onSave, users = [], roles = [] }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleId: '', supervisorId: '' });

    useEffect(() => {
      // Reseta o formulário e define um cargo padrão apenas quando o modal abre
      if (isOpen) {
          const defaultRole = roles.find(r => r.name === 'Corretor');
          setFormData({ 
              name: '', 
              email: '', 
              password: '', 
              roleId: defaultRole ? defaultRole.id : '', 
              supervisorId: '' 
            });
      }
    // --- CORREÇÃO APLICADA AQUI ---
    // Removemos 'roles' da lista de dependências.
    // Agora este efeito só roda quando 'isOpen' muda.
    }, [isOpen]);

    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // Filtra para mostrar apenas supervisores no dropdown
    const supervisors = users.filter(u => {
        const userRole = roles.find(r => r.id === u.roleId);
        return userRole?.name === 'Supervisor';
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Colaborador">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome Completo</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <div><Label>Email</Label><Input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                <div><Label>Senha Provisória</Label><Input type="password" name="password" value={formData.password} onChange={handleChange} required /></div>
                <div>
                    <Label>Cargo (Nível de Permissão)</Label>
                    <Select name="roleId" value={formData.roleId} onChange={handleChange}>
                        <option value="">Selecione um cargo...</option>
                        {(roles || []).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </Select>
                </div>
                
                {roles.find(r => r.id === formData.roleId)?.name === 'Corretor' && (
                    <div>
                        <Label>Vincular ao Supervisor</Label>
                        <Select name="supervisorId" value={formData.supervisorId} onChange={handleChange}>
                            <option value="">Nenhum</option>
                            {(supervisors || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;
