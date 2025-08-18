import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import DateField from '../DateField';
import FormSection from '../forms/FormSection'; // CORREÇÃO: Importado como default
import { maskCNPJ, maskCPF } from '../../utils';

const ProductionModal = ({ isOpen, onClose, onSave, production, users, partners, operators }) => {
    const getInitialState = () => ({
        clientName: '', saleDate: '', effectiveDate: '', operator: '',
        partner: '', brokerId: '', commissionValue: '', awardValue: '',
        status: 'Pendente', preCadastroData: { clientType: 'PME' }
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(production ? { ...getInitialState(), ...production } : getInitialState());
        }
    }, [production, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(p => ({ ...p, [parent]: { ...p[parent], [child]: value } }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const deliveryPlatforms = useMemo(() => {
        return (partners || []).filter(p => p.type === 'Plataforma de Entrega');
    }, [partners]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={production ? "Editar Produção" : "Lançar Nova Produção"} size="5xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Dados da Venda" cols={4}>
                    <div><Label>Nome do Cliente</Label><Input name="clientName" value={formData.clientName} onChange={handleChange} required /></div>
                    <div><Label>Data da Assinatura</Label><DateField name="saleDate" value={formData.saleDate} onChange={handleChange} required /></div>
                    <div><Label>Data da Vigência</Label><DateField name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} /></div>
                    <div>
                        <Label>Status</Label>
                        <Select name="status" value={formData.status} onChange={handleChange}>
                            <option>Pendente</option>
                            <option>Convertido em Cliente</option>
                            <option>Cancelado</option>
                        </Select>
                    </div>
                </FormSection>

                <FormSection title="Valores e Responsáveis" cols={4}>
                    <div><Label>Operadora (Comissão)</Label>
                        <Select name="operator" value={formData.operator} onChange={handleChange}>
                            <option value="">Selecione...</option>
                            {(operators || []).map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                        </Select>
                    </div>
                    <div><Label>Valor Comissão (R$)</Label><Input name="commissionValue" value={formData.commissionValue} onChange={handleChange} type="number" step="0.01" /></div>
                    <div><Label>Plataforma (Prêmio)</Label>
                        <Select name="partner" value={formData.partner} onChange={handleChange}>
                            <option value="">Nenhuma</option>
                            {deliveryPlatforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            <option value="Outras">Outras</option>
                        </Select>
                    </div>
                    <div><Label>Valor Prêmio (R$)</Label><Input name="awardValue" value={formData.awardValue} onChange={handleChange} type="number" step="0.01" /></div>
                    <div><Label>Corretor Responsável</Label>
                        <Select name="brokerId" value={formData.brokerId} onChange={handleChange} required>
                            <option value="">Selecione...</option>
                            {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                </FormSection>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Produção</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductionModal;