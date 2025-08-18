import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Textarea from '../Textarea';
import Select from '../Select';
import DateField from '../DateField';
import Button from '../Button';
import { cn } from '../../utils';

// CORREÇÃO: Alterado de "export const" para uma constante
const TaskModal = ({ isOpen, onClose, onSave, task }) => {
    const { users, clients, leads } = useData();
    const [formState, setFormState] = useState({});
    const colorOptions = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'];

    useEffect(() => {
        setFormState(
            task
                ? { ...task }
                : { title: '', description: '', assignedTo: '', dueDate: '', priority: 'Média', linkedToId: '', linkedToType: '', status: 'Pendente', color: '#6B7280' }
        );
    }, [task, isOpen]);

    const handleChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleLinkChange = (e) => {
        const [type, id] = e.target.value.split('-');
        setFormState(p => ({ ...p, linkedToType: type || '', linkedToId: id || '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    const linkedValue = formState.linkedToType && formState.linkedToId ? `${formState.linkedToType}-${formState.linkedToId}` : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarefa" : "Adicionar Nova Tarefa"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Título</Label>
                    <Input name="title" value={formState.title || ''} onChange={handleChange} required />
                </div>
                <div>
                    <Label>Descrição</Label>
                    <Textarea name="description" value={formState.description || ''} onChange={handleChange} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Responsável</Label>
                        <Select name="assignedTo" value={formState.assignedTo || ''} onChange={handleChange}>
                            <option value="">Ninguém</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>Data de Vencimento</Label>
                        <DateField name="dueDate" value={formState.dueDate || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Prioridade</Label>
                        <Select name="priority" value={formState.priority || 'Média'} onChange={handleChange}>
                            <option>Baixa</option><option>Média</option><option>Alta</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Cor do Card</Label>
                        <div className="flex gap-3 mt-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormState(p => ({ ...p, color: color }))}
                                    style={{ backgroundColor: color }}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all hover:scale-110",
                                        formState.color === color && 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800'
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <Label>Vincular a Cliente/Lead</Label>
                    <Select value={linkedValue} onChange={handleLinkChange}>
                        <option value="">Nenhum</option>
                        <optgroup label="Clientes">{(clients || []).map(c => <option key={c.id} value={`client-${c.id}`}>{c.general?.companyName || c.general?.holderName}</option>)}</optgroup>
                        <optgroup label="Leads">{(leads || []).map(l => <option key={l.id} value={`lead-${l.id}`}>{l.name}</option>)}</optgroup>
                    </Select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Tarefa</Button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskModal;