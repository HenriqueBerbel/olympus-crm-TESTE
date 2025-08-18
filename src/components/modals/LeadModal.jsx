import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Textarea from '../Textarea';
import Button from '../Button';

const LeadModal = ({ isOpen, onClose, onSave, lead }) => {
    const { user } = useAuth();
    const [formState, setFormState] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (lead) {
                setFormState(lead);
            } else {
                setFormState({ name: '', company: '', email: '', phone: '', notes: '', status: 'Novo', ownerId: user?.uid, responseDeadlineDays: 3 });
            }
        }
    }, [lead, isOpen, user]);

    const handleChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formState); onClose(); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lead ? "Editar Lead" : "Adicionar Novo Lead"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome do Lead</Label><Input name="name" value={formState.name || ''} onChange={handleChange} required /></div>
                    <div><Label>Empresa</Label><Input name="company" value={formState.company || ''} onChange={handleChange} /></div>
                    <div><Label>Email</Label><Input type="email" name="email" value={formState.email || ''} onChange={handleChange} /></div>
                    <div><Label>Telefone</Label><Input type="tel" name="phone" value={formState.phone || ''} onChange={handleChange} /></div>
                </div>
                <div><Label>Observações (Córtex AI irá analisar)</Label><Textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={4} placeholder="Ex: Indicado por cliente X, precisa fechar com urgência..." /></div>
                <div><Label>Prazo de Resposta (dias)</Label><Input type="number" name="responseDeadlineDays" value={formState.responseDeadlineDays || 3} onChange={handleChange} /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Lead</Button>
                </div>
            </form>
        </Modal>
    );
};

export default LeadModal;