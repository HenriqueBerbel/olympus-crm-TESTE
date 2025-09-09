import React, { useState, useEffect, useMemo } from 'react';
// [CORREÇÃO DE CAMINHO]: Ajustado para subir um nível (de 'modals' para 'components')
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
// [CORREÇÃO]: O caminho estava errado. Corrigido de '../components/Select' para '../Select'
import { Select, SelectItem } from '../Select';
import Button from '../Button';
import DateField from '../DateField';
import FormSection from '../forms/FormSection';
// [CORREÇÃO DE CAMINHO]: Ajustado para subir dois níveis (de 'modals' para 'src')
import { useToast } from '../../contexts/NotificationContext';
import { maskCNPJ, maskCPF } from '../../utils';

const ProductionModal = ({ isOpen, onClose, onSave, production, users, partners, operators }) => {
    const { toast } = useToast();

    const getInitialState = () => ({
        clientName: '', saleDate: '', effectiveDate: '', operator: '',
        partner: '', brokerId: '', commissionValue: '', awardValue: '',
        status: 'Pendente',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(production ? { ...getInitialState(), ...production } : getInitialState());
        }
    }, [production, isOpen]);
    
    const handleClose = () => {
        setIsSaving(false);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.clientName || !formData.saleDate || !formData.brokerId) {
            toast({ title: "Campos Obrigatórios", description: "Nome do Cliente, Data da Assinatura e Corretor são obrigatórios.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            handleClose(); // Fecha o modal após salvar com sucesso
        } catch (error) {
            console.error("Falha ao salvar produção:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados da produção.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const deliveryPlatforms = useMemo(() => {
        return (partners || []).filter(p => p.type === 'Plataforma de Entrega');
    }, [partners]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={production ? "Editar Produção" : "Lançar Nova Produção"} 
            size="5xl"
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Dados da Venda" cols={4}>
                    <div className="col-span-4 md:col-span-2">
                        <Label htmlFor="prod-clientName">Nome do Cliente</Label>
                        <Input id="prod-clientName" name="clientName" value={formData.clientName} onChange={handleChange} required disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="prod-saleDate">Data da Assinatura</Label>
                        <DateField id="prod-saleDate" name="saleDate" value={formData.saleDate} onChange={handleChange} required disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="prod-effectiveDate">Data da Vigência</Label>
                        <DateField id="prod-effectiveDate" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} disabled={isSaving}/>
                    </div>
                    <div className="col-span-full">
                        <Label htmlFor="prod-status">Status</Label>
                        <Select id="prod-status" name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={isSaving}>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Convertido em Cliente">Convertido em Cliente</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </Select>
                    </div>
                </FormSection>

                <FormSection title="Valores e Responsáveis" cols={4}>
                    <div>
                        <Label htmlFor="prod-operator">Operadora (Comissão)</Label>
                        <Select id="prod-operator" name="operator" value={formData.operator} onValueChange={(value) => handleSelectChange('operator', value)} disabled={isSaving}>
                            <SelectItem value="">Selecione...</SelectItem>
                            {(operators || []).map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="prod-commission">Valor Comissão (R$)</Label>
                        <Input id="prod-commission" name="commissionValue" value={formData.commissionValue} onChange={handleChange} type="number" step="0.01" placeholder="Ex: 150.00" disabled={isSaving}/>
                    </div>
                    <div>
                        <Label htmlFor="prod-partner">Plataforma (Prêmio)</Label>
                        <Select id="prod-partner" name="partner" value={formData.partner} onValueChange={(value) => handleSelectChange('partner', value)} disabled={isSaving}>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {deliveryPlatforms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            <SelectItem value="Outras">Outras</SelectItem>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="prod-award">Valor Prêmio (R$)</Label>
                        <Input id="prod-award" name="awardValue" value={formData.awardValue} onChange={handleChange} type="number" step="0.01" placeholder="Ex: 50.00" disabled={isSaving}/>
                    </div>
                    <div className="col-span-full">
                        <Label htmlFor="prod-broker">Corretor Responsável</Label>
                        <Select id="prod-broker" name="brokerId" value={formData.brokerId} onValueChange={(value) => handleSelectChange('brokerId', value)} required disabled={isSaving}>
                            <SelectItem value="">Selecione...</SelectItem>
                            {(users || []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </Select>
                    </div>
                </FormSection>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Produção'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductionModal;
