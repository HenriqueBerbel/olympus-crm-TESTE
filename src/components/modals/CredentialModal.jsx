import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';

// CORREÇÃO: Alterado de "export const" para uma constante
const CredentialModal = ({ isOpen, onClose, onSave, credential }) => {
    const getInitialState = () => ({
        id: `local_${Date.now()}`, title: '', createdEmail: '', createdEmailPassword: '',
        portalSite: '', portalPassword: '', portalLogin: '', portalUser: '',
        appLogin: '', appPassword: ''
    });
    const [formState, setFormState] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormState(credential ? { ...getInitialState(), ...credential } : getInitialState());
        }
    }, [credential, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formState.title.trim()) {
            onSave(formState);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={credential ? "Editar Credencial" : "Adicionar Nova Credencial"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label>Título (Ex: Portal Amil Saúde, Acesso Dental Uni)</Label>
                    <Input name="title" value={formState.title} onChange={handleChange} required placeholder="Identificação da credencial" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Email Criado</Label><Input name="createdEmail" value={formState.createdEmail} onChange={handleChange} /></div>
                    <div><Label>Senha do Email Criado</Label><Input type="text" name="createdEmailPassword" value={formState.createdEmailPassword} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Site do Portal</Label><Input name="portalSite" value={formState.portalSite} onChange={handleChange} placeholder="https://exemplo.com" /></div>
                    <div><Label>Senha do Portal</Label><Input type="text" name="portalPassword" value={formState.portalPassword} onChange={handleChange} /></div>
                    <div><Label>Login do Portal</Label><Input name="portalLogin" value={formState.portalLogin} onChange={handleChange} /></div>
                    <div><Label>Usuário do Portal</Label><Input name="portalUser" value={formState.portalUser} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Login do App</Label><Input name="appLogin" value={formState.appLogin} onChange={handleChange} /></div>
                    <div><Label>Senha do App</Label><Input type="text" name="appPassword" value={formState.appPassword} onChange={handleChange} /></div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Credencial</Button>
                </div>
            </form>
        </Modal>
    );
};

export default CredentialModal;