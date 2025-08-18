import React, { useState } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import Textarea from '../Textarea';
import Button from '../Button';

const AddPartnerModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Corretor', document: '', email: '', phone: '', notes: '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', type: 'Corretor', document: '', email: '', phone: '', notes: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Parceiro Externo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome Completo</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Tipo</Label><Select name="type" value={formData.type} onChange={handleChange}><option>Corretor</option><option>Supervisor</option></Select></div>
                    <div><Label>CPF/CNPJ</Label><Input name="document" value={formData.document} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Email</Label><Input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                    <div><Label>Telefone</Label><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></div>
                </div>
                <div><Label>Observações</Label><Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Parceiro</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPartnerModal;