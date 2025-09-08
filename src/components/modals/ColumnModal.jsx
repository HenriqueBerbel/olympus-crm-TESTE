import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import { useToast } from '../../contexts/NotificationContext';
import { CheckIcon } from '../Icons'; // Supondo que você tenha um ícone de Check
import { cn } from '../../utils';

const ColumnModal = ({ isOpen, onClose, onSave }) => {
    const { toast } = useToast();

    const initialState = { title: '', color: '#3B82F6' };
    const [formData, setFormData] = useState(initialState);
    const [isSaving, setIsSaving] = useState(false);
    
    // Paleta de cores para o seletor
    const colorOptions = ['#3B82F6', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#D946EF'];

    // Efeito para limpar o formulário quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => { // Pequeno delay para a animação de saída do modal
                setFormData(initialState);
                setIsSaving(false);
            }, 200);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleColorSelect = (color) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const handleSave = async () => {
        if (isSaving) return;

        if (!formData.title || formData.title.trim() === '') {
            toast({ title: "Campo obrigatório", description: "O nome da coluna é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ title: formData.title.trim(), color: formData.color });
            // O componente pai fechará o modal no sucesso
        } catch (error) {
            console.error("Falha ao salvar a coluna:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a coluna.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Adicionar Nova Coluna" 
            size="md" 
            closeOnClickOutside={false}
        >
            <div className="space-y-6">
                <div>
                    <Label htmlFor="column-title">Nome da Coluna</Label>
                    <Input id="column-title" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Em Negociação" disabled={isSaving}/>
                </div>

                <div>
                    <Label>Cor da Coluna</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                        {colorOptions.map(c => (
                            <button 
                                key={c} 
                                type="button" 
                                onClick={() => handleColorSelect(c)} 
                                style={{ backgroundColor: c }}
                                className={cn(
                                    "w-8 h-8 rounded-full transition-all flex items-center justify-center text-white",
                                    formData.color === c ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'
                                )}
                                aria-label={`Selecionar cor ${c}`}
                                disabled={isSaving}
                            >
                                {formData.color === c && <CheckIcon className="w-5 h-5" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MELHORIA DE UI: Preview ao vivo */}
                {formData.title.trim() && (
                    <div>
                        <Label>Preview</Label>
                        <div className="mt-2 flex items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color }}></span>
                            <h3 className="ml-3 font-semibold text-gray-800 dark:text-gray-200">{formData.title}</h3>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Coluna'}
                </Button>
            </div>
        </Modal>
    );
};

export default ColumnModal;