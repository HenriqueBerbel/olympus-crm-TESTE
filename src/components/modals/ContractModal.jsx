import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/NotificationContext';
import { cn } from '../../utils';
import Modal from '../Modal';
import CredentialModal from './CredentialModal';
import Label from '../Label';
import Select from '../Select';
import Input from '../Input';
import Checkbox from '../Checkbox';
import DateField from '../DateField';
import Button from '../Button';
import { PlusCircleIcon, PencilIcon, Trash2Icon, InfoIcon } from '../Icons';

const ContractModal = ({ isOpen, onClose, onSave, contract, clientType }) => {
    const { operators, users } = useData();
    const { toast } = useToast();
    const sortedOperators = useMemo(() => [...(operators || [])].sort((a, b) => a.name.localeCompare(b.name)), [operators]);
    
    const getInitialState = () => ({
        id: `local_${Date.now()}`, status: 'ativo', proposalNumber: '', policyNumber: '', 
        planOperator: '', previousPlan: '', planTypes: [], planCategory: '', accommodation: '',
        contractValue: '', feeValue: '', paymentMethod: '', monthlyDueDate: '',
        effectiveDate: '', boletoSentDate: '', renewalDate: '',
        boletoResponsibleId: '', credentialsList: []
    });

    const [formState, setFormState] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);
    const [isCredentialModalOpen, setCredentialModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormState(contract ? { ...getInitialState(), ...contract } : getInitialState());
        }
    }, [contract, isOpen]);
    
    const handleClose = () => {
        setFormState(getInitialState());
        setIsSaving(false);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const newTypes = checked ? [...(formState.planTypes || []), value] : (formState.planTypes || []).filter(v => v !== value);
            setFormState(p => ({ ...p, planTypes: newTypes }));
        } else {
            setFormState(p => ({ ...p, [name]: value }));
        }
    };

    const handleSaveCredential = (credentialData) => {
        const newList = [...(formState.credentialsList || [])];
        const index = newList.findIndex(c => c.id === credentialData.id);
        if (index > -1) {
            newList[index] = credentialData;
        } else {
            newList.push({ ...credentialData, id: `local_cred_${Date.now()}` });
        }
        setFormState(p => ({ ...p, credentialsList: newList }));
        setCredentialModalOpen(false);
        setEditingCredential(null);
    };

    const handleDeleteCredential = (credentialId) => {
        const newList = (formState.credentialsList || []).filter(c => c.id !== credentialId);
        setFormState(p => ({ ...p, credentialsList: newList }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formState.planOperator || !formState.contractValue || !formState.effectiveDate) {
            toast({ title: "Campos Obrigatórios", description: "Operadora, Valor do Contrato e Data da Vigência são obrigatórios.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formState);
        } catch (error) {
            console.error("Falha ao salvar contrato:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados do contrato.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Componente auxiliar para títulos de seção
    const SectionTitle = ({ children }) => <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 col-span-full border-b border-gray-200 dark:border-white/10 pb-2 mb-2">{children}</h3>;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={contract ? "Editar Contrato" : "Adicionar Novo Contrato"} size="6xl" closeOnClickOutside={false}>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* SEÇÃO 1: INFORMAÇÕES GERAIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Informações Gerais</SectionTitle>
                    <div><Label htmlFor="planOperator">Plano Fechado (Operadora)</Label><Select id="planOperator" name="planOperator" value={formState.planOperator || ''} onChange={handleChange} disabled={isSaving} required><option value="">Selecione</option>{sortedOperators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}</Select></div>
                    <div><Label htmlFor="proposalNumber">Número da Proposta</Label><Input id="proposalNumber" name="proposalNumber" value={formState.proposalNumber || ''} onChange={handleChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="policyNumber">Número da Apólice / Contrato</Label><Input id="policyNumber" name="policyNumber" value={formState.policyNumber || ''} onChange={handleChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="planCategory">Categoria do Plano</Label><Input id="planCategory" name="planCategory" value={formState.planCategory || ''} onChange={handleChange} disabled={isSaving} placeholder="Ex: Top Nacional"/></div>
                    <div><Label htmlFor="accommodation">Acomodação</Label><Select id="accommodation" name="accommodation" value={formState.accommodation || ''} onChange={handleChange} disabled={isSaving}><option value="">Selecione...</option><option>Enfermaria</option><option>Apartamento</option></Select></div>
                    <div><Label>Tipo de Plano</Label><div className="flex gap-6 mt-2 pt-2 text-gray-800 dark:text-gray-300"><label className="font-medium flex items-center gap-2 cursor-pointer"><Checkbox name="planTypes" value="Saúde" checked={(formState.planTypes || []).includes('Saúde')} onChange={handleChange} disabled={isSaving}/> Saúde</label><label className="font-medium flex items-center gap-2 cursor-pointer"><Checkbox name="planTypes" value="Dental" checked={(formState.planTypes || []).includes('Dental')} onChange={handleChange} disabled={isSaving}/> Dental</label></div></div>
                </div>

                {/* SEÇÃO 2: VALORES E PAGAMENTO */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Valores e Pagamento</SectionTitle>
                    <div><Label htmlFor="contractValue">Valor do Contrato</Label><Input id="contractValue" type="number" name="contractValue" value={formState.contractValue || ''} onChange={handleChange} disabled={isSaving} required placeholder="Ex: 599.90"/></div>
                    <div><Label htmlFor="feeValue">Valor da Taxa</Label><Input id="feeValue" type="number" name="feeValue" value={formState.feeValue || ''} onChange={handleChange} disabled={isSaving} placeholder="Ex: 50.00"/></div>
                    <div><Label htmlFor="paymentMethod">Forma de Pagamento</Label><Select id="paymentMethod" name="paymentMethod" value={formState.paymentMethod || ''} onChange={handleChange} disabled={isSaving}><option value="">Selecione...</option><option>Boleto</option><option>Cartão de Crédito</option><option>Débito Automático</option><option>Pix</option></Select></div>
                </div>

                {/* SEÇÃO 3: DATAS E PRAZOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Datas e Prazos</SectionTitle>
                    <div><Label htmlFor="effectiveDate">Data da Vigência</Label><DateField id="effectiveDate" name="effectiveDate" value={formState.effectiveDate || ''} onChange={handleChange} disabled={isSaving} required/></div>
                    <div><Label htmlFor="monthlyDueDate">Vencimento Mensal (Dia)</Label><Input id="monthlyDueDate" type="number" name="monthlyDueDate" value={formState.monthlyDueDate || ''} onChange={handleChange} disabled={isSaving} placeholder="Ex: 10"/></div>
                    <div><Label htmlFor="boletoSentDate">Data Envio do Boleto (Dia)</Label><DateField id="boletoSentDate" name="boletoSentDate" value={formState.boletoSentDate || ''} onChange={handleChange} disabled={isSaving} placeholder="Dia do mês"/></div>
                    <div><Label htmlFor="renewalDate">Renovação de Contrato</Label><DateField id="renewalDate" name="renewalDate" value={formState.renewalDate || ''} onChange={handleChange} disabled={isSaving}/></div>
                </div>

                {/* SEÇÃO 4: OUTRAS INFORMAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Outras Informações</SectionTitle>
                    <div><Label htmlFor="status">Status</Label><Select id="status" name="status" value={formState.status || 'ativo'} onChange={handleChange} disabled={isSaving}><option value="ativo">Ativo</option><option value="inativo">Inativo (Histórico)</option></Select></div>
                    <div><Label htmlFor="previousPlan">Plano Anterior (se houver)</Label><Input id="previousPlan" name="previousPlan" value={formState.previousPlan || ''} onChange={handleChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="boletoResponsibleId">Responsável pelo Boleto</Label><Select id="boletoResponsibleId" name="boletoResponsibleId" value={formState.boletoResponsibleId || ''} onChange={handleChange} disabled={isSaving}><option value="">Selecione...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
                    <div><Label>Tipo de Cliente (Informativo)</Label><p className="h-10 flex items-center gap-2 px-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black/20 rounded-lg text-sm"><InfoIcon className="h-4 w-4"/>{clientType || 'Não definido'}</p></div>
                </div>

                {/* SEÇÃO 5: CREDENCIAIS */}
                <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Credenciais</h3>
                        <Button type="button" onClick={() => { setEditingCredential(null); setCredentialModalOpen(true); }} disabled={isSaving}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Credencial</Button>
                    </div>
                    <div className="space-y-2">
                        {(formState.credentialsList || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhuma credencial adicionada.</p> : (formState.credentialsList || []).map(cred => (
                            <div key={cred.id} className="p-3 rounded-lg flex justify-between items-center bg-gray-100 dark:bg-black/20">
                                <div><p className="font-semibold text-gray-900 dark:text-white">{cred.title}</p><p className="text-sm text-gray-600 dark:text-gray-400">{cred.portalSite || cred.createdEmail}</p></div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCredential(cred); setCredentialModalOpen(true); }} disabled={isSaving}><PencilIcon className="h-4 w-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteCredential(cred.id)} disabled={isSaving}><Trash2Icon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-white/10"><Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Contrato'}</Button></div>
            </form>
            <CredentialModal isOpen={isCredentialModalOpen} onClose={() => setCredentialModalOpen(false)} onSave={handleSaveCredential} credential={editingCredential} />
        </Modal>
    );
};

export default ContractModal;