import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';

const AddOperatorModal = ({ isOpen, onClose, onSave, operator }) => {
    const getInitialState = () => ({ name: '', managerName: '', managerPhone: '', managerEmail: '', portalLink: '' });
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (operator) {
                setFormData(operator);
            } else {
                setFormData(getInitialState());
            }
        }
    }, [operator, isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSave(formData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={operator ? "Editar Operadora" : "Adicionar Nova Operadora"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome da Operadora (Obrigatório)</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t pt-4 mt-4">Dados Opcionais</h4>
                <div><Label>Gerente de Contas</Label><Input name="managerName" value={formData.managerName || ''} onChange={handleChange} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Telefone do Gerente</Label><Input type="tel" name="managerPhone" value={formData.managerPhone || ''} onChange={handleChange} /></div>
                    <div><Label>Email do Gerente</Label><Input type="email" name="managerEmail" value={formData.managerEmail || ''} onChange={handleChange} /></div>
                </div>
                <div><Label>Link do Portal do Corretor</Label><Input name="portalLink" value={formData.portalLink || ''} onChange={handleChange} placeholder="https://..." /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{operator ? 'Salvar Alterações' : 'Adicionar'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddOperatorModal;