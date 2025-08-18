import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import Textarea from '../Textarea';
import FormSection from '../forms/FormSection'; // CORREÇÃO: Importado como default
import { maskCNPJ } from '../../utils';

const PlatformPartnerModal = ({ isOpen, onClose, onSave, partner }) => {
    const getInitialState = () => ({ name: '', type: 'Plataforma de Entrega', document: '', email: '', phone: '', platformDetails: { responsibleManager: '', managerEmail: '', commissionAgreement: '', portalURL: '' } });
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(partner || getInitialState());
        }
    }, [partner, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('platformDetails.')) {
            const key = name.split('.')[1];
            setFormData(p => ({ ...p, platformDetails: { ...p.platformDetails, [key]: value } }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={partner ? "Editar Plataforma" : "Adicionar Plataforma"} size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Dados da Corretora Parceira" cols={2}>
                    <div><Label>Nome da Plataforma</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                    <div><Label>CNPJ</Label><Input name="document" value={formData.document || ''} onChange={handleChange} mask={maskCNPJ} /></div>
                    <div><Label>Email Principal</Label><Input type="email" name="email" value={formData.email || ''} onChange={handleChange} /></div>
                    <div><Label>Telefone Principal</Label><Input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} /></div>
                </FormSection>
                <FormSection title="Detalhes da Parceria" cols={2}>
                    <div><Label>Gerente Responsável</Label><Input name="platformDetails.responsibleManager" value={formData.platformDetails?.responsibleManager || ''} onChange={handleChange} /></div>
                    <div><Label>Email do Gerente</Label><Input type="email" name="platformDetails.managerEmail" value={formData.platformDetails?.managerEmail || ''} onChange={handleChange} /></div>
                    <div className="col-span-2"><Label>Acordo de Comissão</Label><Textarea name="platformDetails.commissionAgreement" value={formData.platformDetails?.commissionAgreement || ''} onChange={handleChange} rows={2} /></div>
                    <div className="col-span-2"><Label>URL do Portal</Label><Input name="platformDetails.portalURL" value={formData.platformDetails?.portalURL || ''} onChange={handleChange} placeholder="https://" /></div>
                </FormSection>
                <div className="flex justify-end gap-4 pt-4"><Button variant="outline" type="button" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Plataforma</Button></div>
            </form>
        </Modal>
    );
};

export default PlatformPartnerModal;