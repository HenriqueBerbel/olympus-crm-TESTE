import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import Textarea from '../Textarea';
import FormSection from '../forms/FormSection';
import { useToast } from '../../contexts/NotificationContext';
import { maskCNPJ } from '../../utils';

const PlatformPartnerModal = ({ isOpen, onClose, onSave, partner }) => {
    const { toast } = useToast();

    const getInitialState = () => ({ 
        name: '', type: 'Plataforma de Entrega', document: '', email: '', phone: '', 
        platformDetails: { responsibleManager: '', managerEmail: '', commissionAgreement: '', portalURL: '' } 
    });

    const [formData, setFormData] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Popula o formulário com dados do parceiro (edição) ou reseta (criação)
            setFormData(partner ? { ...getInitialState(), ...partner } : getInitialState());
        }
    }, [partner, isOpen]);
    
    // Função dedicada para fechar e limpar
    const handleClose = () => {
        setIsSaving(false);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('platformDetails.')) {
            const key = name.split('.')[1];
            setFormData(p => ({ ...p, platformDetails: { ...p.platformDetails, [key]: value } }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };

    // MELHORIA: Lógica de salvamento robusta com validação e feedback
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.name || formData.name.trim() === '') {
            toast({ title: "Campo Obrigatório", description: "O Nome da Plataforma é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            // O componente pai será responsável por fechar o modal no sucesso
        } catch (error) {
            console.error("Falha ao salvar plataforma:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados da plataforma.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // Requisitos principais aplicados: closeOnClickOutside
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={partner ? "Editar Plataforma" : "Adicionar Plataforma"} 
            size="3xl"
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Dados da Corretora Parceira" cols={2}>
                    <div>
                        <Label htmlFor="platform-name">Nome da Plataforma</Label>
                        <Input id="platform-name" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="platform-doc">CNPJ</Label>
                        <Input id="platform-doc" name="document" value={formData.document || ''} onChange={handleChange} mask={maskCNPJ} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="platform-email">Email Principal</Label>
                        <Input id="platform-email" type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="platform-phone">Telefone Principal</Label>
                        <Input id="platform-phone" type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </FormSection>
                <FormSection title="Detalhes da Parceria" cols={2}>
                    <div>
                        <Label htmlFor="platform-manager">Gerente Responsável</Label>
                        <Input id="platform-manager" name="platformDetails.responsibleManager" value={formData.platformDetails?.responsibleManager || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="platform-manager-email">Email do Gerente</Label>
                        <Input id="platform-manager-email" type="email" name="platformDetails.managerEmail" value={formData.platformDetails?.managerEmail || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div className="col-span-2">
                        <Label htmlFor="platform-agreement">Acordo de Comissão</Label>
                        <Textarea id="platform-agreement" name="platformDetails.commissionAgreement" value={formData.platformDetails?.commissionAgreement || ''} onChange={handleChange} rows={2} disabled={isSaving}/>
                    </div>
                    <div className="col-span-2">
                        <Label htmlFor="platform-url">URL do Portal</Label>
                        <Input id="platform-url" name="platformDetails.portalURL" value={formData.platformDetails?.portalURL || ''} onChange={handleChange} placeholder="https://" disabled={isSaving}/>
                    </div>
                </FormSection>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <Button variant="outline" type="button" onClick={handleClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Plataforma'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default PlatformPartnerModal;