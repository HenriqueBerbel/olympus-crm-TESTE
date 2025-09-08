import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/NotificationContext';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Textarea from '../Textarea';
import Select from '../Select';
import DateField from '../DateField';
import Button from '../Button';
import { cn } from '../../utils';
import { CheckIcon } from '../Icons'; // Supondo que você tenha um ícone de Check

const TaskModal = ({ isOpen, onClose, onSave, task }) => {
    const { users, clients, leads } = useData();
    const { toast } = useToast();

    const getInitialState = () => ({
        title: '', description: '', assignedTo: '', dueDate: '', priority: 'Média', 
        linkedToId: '', linkedToType: '', status: 'Pendente', color: '#6B7280',
        ...task // Sobrescreve com os dados da tarefa se estiver editando
    });

    const [formState, setFormState] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);
    const colorOptions = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'];

    useEffect(() => {
        if (isOpen) {
            setFormState(getInitialState());
        }
    }, [task, isOpen]);
    
    // Função dedicada para fechar e limpar o estado
    const handleClose = () => {
        setIsSaving(false);
        onClose();
    };

    const handleChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleLinkChange = (e) => {
        const [type, id] = e.target.value.split('-');
        setFormState(p => ({ ...p, linkedToType: type || '', linkedToId: id || '' }));
    };

    // MELHORIA: Lógica de salvamento robusta
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formState.title || formState.title.trim() === '') {
            toast({ title: "Campo Obrigatório", description: "O título da tarefa é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formState);
            // O componente pai fecha o modal no sucesso
        } catch (error) {
            console.error("Falha ao salvar tarefa:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a tarefa.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const linkedValue = formState.linkedToType && formState.linkedToId ? `${formState.linkedToType}-${formState.linkedToId}` : '';

    return (
        // Requisitos principais aplicados
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={task ? "Editar Tarefa" : "Adicionar Nova Tarefa"}
            size="2xl"
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="task-title">Título da Tarefa</Label>
                    <Input id="task-title" name="title" value={formState.title || ''} onChange={handleChange} required disabled={isSaving}/>
                </div>
                <div>
                    <Label htmlFor="task-desc">Descrição</Label>
                    <Textarea id="task-desc" name="description" value={formState.description || ''} onChange={handleChange} rows={3} disabled={isSaving}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="task-assigned">Responsável</Label>
                        <Select id="task-assigned" name="assignedTo" value={formState.assignedTo || ''} onChange={handleChange} disabled={isSaving}>
                            <option value="">Ninguém</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="task-duedate">Data de Vencimento</Label>
                        <DateField id="task-duedate" name="dueDate" value={formState.dueDate || ''} onChange={handleChange} disabled={isSaving}/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="task-priority">Prioridade</Label>
                        <Select id="task-priority" name="priority" value={formState.priority || 'Média'} onChange={handleChange} disabled={isSaving}>
                            <option>Baixa</option><option>Média</option><option>Alta</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Cor do Card</Label>
                        <div className="flex items-center gap-3 mt-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormState(p => ({ ...p, color: color }))}
                                    style={{ backgroundColor: color }}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center text-white",
                                        formState.color === color && 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-900 scale-110'
                                    )}
                                    aria-label={`Selecionar cor ${color}`}
                                    disabled={isSaving}
                                >
                                    {formState.color === color && <CheckIcon className="w-5 h-5"/>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <Label htmlFor="task-link">Vincular a Cliente/Lead</Label>
                    <Select id="task-link" value={linkedValue} onChange={handleLinkChange} disabled={isSaving}>
                        <option value="">Nenhum</option>
                        <optgroup label="Clientes">{(clients || []).map(c => <option key={c.id} value={`client-${c.id}`}>{c.general?.companyName || c.general?.holderName}</option>)}</optgroup>
                        <optgroup label="Leads">{(leads || []).map(l => <option key={l.id} value={`lead-${l.id}`}>{l.name}</option>)}</optgroup>
                    </Select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Tarefa'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskModal;