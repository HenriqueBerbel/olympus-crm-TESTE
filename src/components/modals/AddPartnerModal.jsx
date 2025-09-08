import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import Textarea from '../Textarea';
import Button from '../Button';
import { useToast } from '../../contexts/NotificationContext';

const AddPartnerModal = ({ isOpen, onClose, onSave }) => {
    const { toast } = useToast();
    
    // MELHORIA: Estado inicial definido para reutilização
    const initialState = { name: '', type: 'Corretor', document: '', email: '', phone: '', notes: '' };
    
    const [formData, setFormData] = useState(initialState);
    const [isSaving, setIsSaving] = useState(false);

    // Efeito para resetar o formulário quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            setFormData(initialState);
            setIsSaving(false);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // MELHORIA: Lógica de salvamento robusta
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        // Validação básica
        if (!formData.name || formData.name.trim() === '') {
            toast({ title: "Campo obrigatório", description: "O nome do parceiro é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            // O componente pai deve fechar o modal no sucesso
        } catch (error) {
            console.error("Falha ao adicionar parceiro:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível adicionar o parceiro. Tente novamente.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // MELHORIA: Adicionado closeOnClickOutside={false}
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Adicionar Novo Parceiro Externo" 
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="partner-name">Nome Completo</Label>
                    <Input id="partner-name" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="partner-type">Tipo</Label>
                        <Select id="partner-type" name="type" value={formData.type} onChange={handleChange} disabled={isSaving}>
                            <option>Corretor</option>
                            <option>Supervisor</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="partner-doc">CPF/CNPJ</Label>
                        <Input id="partner-doc" name="document" value={formData.document} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="partner-email">Email</Label>
                        <Input id="partner-email" type="email" name="email" value={formData.email} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="partner-phone">Telefone</Label>
                        <Input id="partner-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </div>

                <div>
                    <Label htmlFor="partner-notes">Observações</Label>
                    <Textarea id="partner-notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={isSaving}/>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Adicionando...' : 'Adicionar Parceiro'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPartnerModal;