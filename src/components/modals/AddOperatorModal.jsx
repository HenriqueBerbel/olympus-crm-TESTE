import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import { useToast } from '../../contexts/NotificationContext'; // Sugestão: Adicionar toast para feedback

const AddOperatorModal = ({ isOpen, onClose, onSave, operator }) => {
    const { toast } = useToast(); // Hook para notificações

    const getInitialState = () => ({ name: '', managerName: '', managerPhone: '', managerEmail: '', portalLink: '' });

    const [formData, setFormData] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);

    // MELHORIA: useEffect mais simples e focado
    // Preenche o formulário apenas quando o modal abre ou os dados do 'operator' mudam.
    useEffect(() => {
        if (isOpen) {
            setFormData(operator ? { ...operator } : getInitialState());
        } else {
            // Garante que o formulário seja limpo quando o modal é fechado por fora
            setFormData(getInitialState());
            setIsSaving(false);
        }
    }, [isOpen, operator]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // MELHORIA: Lógica de salvamento robusta e com feedback
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.name || formData.name.trim() === '') {
            toast({ title: "Campo obrigatório", description: "O nome da operadora não pode estar vazio.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            // A função onSave (que vem do componente pai) é chamada aqui
            await onSave(formData);
            // O componente pai será responsável por fechar o modal no sucesso
        } catch (error) {
            console.error("Falha ao salvar operadora:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados. Tente novamente.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // MELHORIA: Adicionado closeOnClickOutside={false}
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={operator ? "Editar Operadora" : "Adicionar Nova Operadora"}
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="op-name">Nome da Operadora (Obrigatório)</Label>
                    <Input id="op-name" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving} />
                </div>
                
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t border-gray-200 dark:border-white/10 pt-4 mt-4">Dados Opcionais</h4>
                
                <div>
                    <Label htmlFor="op-managerName">Gerente de Contas</Label>
                    <Input id="op-managerName" name="managerName" value={formData.managerName || ''} onChange={handleChange} disabled={isSaving} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="op-managerPhone">Telefone do Gerente</Label>
                        <Input id="op-managerPhone" type="tel" name="managerPhone" value={formData.managerPhone || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                        <Label htmlFor="op-managerEmail">Email do Gerente</Label>
                        <Input id="op-managerEmail" type="email" name="managerEmail" value={formData.managerEmail || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="op-portalLink">Link do Portal do Corretor</Label>
                    <Input id="op-portalLink" name="portalLink" value={formData.portalLink || ''} onChange={handleChange} placeholder="https://..." disabled={isSaving} />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : (operator ? 'Salvar Alterações' : 'Adicionar')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddOperatorModal;