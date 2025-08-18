import React, { useState } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import { cn } from '../../utils';

const ColumnModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const colorOptions = ['#3B82F6', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#D946EF'];

    const handleSave = () => {
        if (title.trim()) {
            onSave({ title: title.trim(), color });
            setTitle('');
            setColor('#3B82F6');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Coluna">
            <div className="space-y-4">
                <div>
                    <Label>Nome da Coluna</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Em Negociação" />
                </div>
                <div>
                    <Label>Cor da Coluna</Label>
                    <div className="flex gap-3 mt-2">
                        {colorOptions.map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} className={cn("w-8 h-8 rounded-full transition-all", color === c ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : 'hover:scale-110')} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Coluna</Button>
            </div>
        </Modal>
    );
};

export default ColumnModal;