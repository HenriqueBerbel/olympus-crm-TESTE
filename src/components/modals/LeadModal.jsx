import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/NotificationContext';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Textarea from '../Textarea';
import Button from '../Button';
import { SparklesIcon } from '../Icons'; // Ícone para destacar a funcionalidade de IA

const LeadModal = ({ isOpen, onClose, onSave, lead }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Função para estado inicial, garantindo consistência
    const getInitialState = () => ({
        name: '', company: '', email: '', phone: '', notes: '',
        status: 'Novo', ownerId: user?.uid, responseDeadlineDays: 3,
        ...lead // Sobrescreve com os dados do lead se estiver editando
    });

    // CORREÇÃO: Removido o sinal de igual duplicado
    const [formState, setFormState] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);

    // Efeito para popular ou resetar o formulário
    useEffect(() => {
        // Apenas atualiza o form se o modal estiver abrindo
        if (isOpen) {
            setFormState(getInitialState());
        }
    }, [isOpen, lead, user]);
    
    // Função dedicada para fechar e limpar
    const handleClose = () => {
        setIsSaving(false);
        onClose();
    };

    const handleChange = (e) => {
        setFormState(p => ({ ...p, [e.target.name]: e.target.value }));
    };
    
    // Lógica de salvamento robusta
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formState.name || formState.name.trim() === '') {
            toast({ title: "Campo Obrigatório", description: "O nome do lead é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formState);
            // O componente pai agora é responsável por fechar o modal no sucesso
        } catch (error) {
            console.error("Falha ao salvar lead:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados do lead.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={lead ? "Editar Lead" : "Adicionar Novo Lead"}
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="lead-name">Nome do Lead</Label>
                        <Input id="lead-name" name="name" value={formState.name || ''} onChange={handleChange} required disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="lead-company">Empresa</Label>
                        <Input id="lead-company" name="company" value={formState.company || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="lead-email">Email</Label>
                        <Input id="lead-email" type="email" name="email" value={formState.email || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="lead-phone">Telefone</Label>
                        <Input id="lead-phone" type="tel" name="phone" value={formState.phone || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </div>
                <div>
                    <Label htmlFor="lead-notes" className="flex items-center gap-2">
                        Observações
                        <span className="flex items-center gap-1 text-xs font-semibold text-violet-500 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">
                            <SparklesIcon className="w-3 h-3" />
                            Análise por Córtex AI
                        </span>
                    </Label>
                    <Textarea 
                        id="lead-notes" 
                        name="notes" 
                        value={formState.notes || ''} 
                        onChange={handleChange} 
                        rows={4} 
                        placeholder="Ex: Indicado por cliente X, precisa fechar com urgência..." 
                        disabled={isSaving}
                    />
                </div>
                <div>
                    <Label htmlFor="lead-deadline">Prazo de Resposta (dias)</Label>
                    <Input 
                        id="lead-deadline"
                        type="number" 
                        name="responseDeadlineDays" 
                        value={formState.responseDeadlineDays || 3} 
                        onChange={handleChange} 
                        disabled={isSaving}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Lead'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default LeadModal;