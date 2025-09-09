import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Hooks, Utilitários e Componentes
import { useData } from '/src/contexts/DataContext';
import { useToast } from '/src/contexts/NotificationContext';
import Modal from '/src/components/Modal';
import CredentialModal from '/src/components/modals/CredentialModal';
import Label from '/src/components/Label';
import { Select, SelectItem } from '/src/components/Select';
import Input from '/src/components/Input';
import Checkbox from '/src/components/Checkbox';
import DateField from '/src/components/DateField';
import Button from '/src/components/Button';
import { PlusCircleIcon, PencilIcon, Trash2Icon, InfoIcon } from '/src/components/Icons';

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
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        const currentTypes = formState.planTypes || [];
        const newTypes = checked 
            ? [...currentTypes, value] 
            : currentTypes.filter(v => v !== value);
        setFormState(p => ({ ...p, planTypes: newTypes }));
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

    const SectionTitle = ({ children }) => <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 col-span-full border-b border-gray-200 dark:border-white/10 pb-2 mb-2">{children}</h3>;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={contract ? "Editar Contrato" : "Adicionar Novo Contrato"} size="6xl" closeOnClickOutside={false}>
            <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Informações Gerais</SectionTitle>
                    {/* [CORRIGIDO] Removido <SelectItem value=""> */}
                    <div><Label>Plano Fechado (Operadora)</Label><Select required value={formState.planOperator || ''} onValueChange={v => handleSelectChange('planOperator', v)}>{sortedOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</Select></div>
                    <div><Label>Número da Proposta</Label><Input name="proposalNumber" value={formState.proposalNumber || ''} onChange={handleChange}/></div>
                    <div><Label>Número da Apólice / Contrato</Label><Input name="policyNumber" value={formState.policyNumber || ''} onChange={handleChange}/></div>
                    <div><Label>Categoria do Plano</Label><Input name="planCategory" value={formState.planCategory || ''} onChange={handleChange} placeholder="Ex: Top Nacional"/></div>
                    {/* [CORRIGIDO] Removido <SelectItem value=""> */}
                    <div><Label>Acomodação</Label><Select value={formState.accommodation || ''} onValueChange={v => handleSelectChange('accommodation', v)}><SelectItem value="Enfermaria">Enfermaria</SelectItem><SelectItem value="Apartamento">Apartamento</SelectItem></Select></div>
                    <div><Label>Tipo de Plano</Label><div className="flex gap-6 mt-2 pt-2"><label className="flex items-center gap-2"><Checkbox value="Saúde" checked={(formState.planTypes || []).includes('Saúde')} onChange={handleCheckboxChange}/> Saúde</label><label className="flex items-center gap-2"><Checkbox value="Dental" checked={(formState.planTypes || []).includes('Dental')} onChange={handleCheckboxChange}/> Dental</label></div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Valores e Pagamento</SectionTitle>
                    <div><Label>Valor do Contrato</Label><Input type="number" name="contractValue" value={formState.contractValue || ''} onChange={handleChange} required placeholder="Ex: 599.90"/></div>
                    <div><Label>Valor da Taxa</Label><Input type="number" name="feeValue" value={formState.feeValue || ''} onChange={handleChange} placeholder="Ex: 50.00"/></div>
                    {/* [CORRIGIDO] Removido <SelectItem value=""> */}
                    <div><Label>Forma de Pagamento</Label><Select value={formState.paymentMethod || ''} onValueChange={v => handleSelectChange('paymentMethod', v)}><SelectItem value="Boleto">Boleto</SelectItem><SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem><SelectItem value="Débito Automático">Débito Automático</SelectItem><SelectItem value="Pix">Pix</SelectItem></Select></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Datas e Prazos</SectionTitle>
                    <div><Label>Data da Vigência</Label><DateField name="effectiveDate" value={formState.effectiveDate || ''} onChange={handleChange} required/></div>
                    <div><Label>Vencimento Mensal (Dia)</Label><Input type="number" name="monthlyDueDate" value={formState.monthlyDueDate || ''} onChange={handleChange} placeholder="Ex: 10"/></div>
                    <div><Label>Data Envio do Boleto (Dia)</Label><DateField name="boletoSentDate" value={formState.boletoSentDate || ''} onChange={handleChange} placeholder="Dia do mês"/></div>
                    <div><Label>Renovação de Contrato</Label><DateField name="renewalDate" value={formState.renewalDate || ''} onChange={handleChange}/></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SectionTitle>Outras Informações</SectionTitle>
                    <div><Label>Status</Label><Select value={formState.status || 'ativo'} onValueChange={v => handleSelectChange('status', v)}><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo (Histórico)</SelectItem></Select></div>
                    <div><Label>Plano Anterior (se houver)</Label><Input name="previousPlan" value={formState.previousPlan || ''} onChange={handleChange}/></div>
                    {/* [CORRIGIDO] Removido <SelectItem value=""> */}
                    <div><Label>Responsável pelo Boleto</Label><Select value={formState.boletoResponsibleId || ''} onValueChange={v => handleSelectChange('boletoResponsibleId', v)}>{(users || []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</Select></div>
                    <div><Label>Tipo de Cliente (Informativo)</Label><p className="h-10 flex items-center gap-2 px-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black/20 rounded-lg text-sm"><InfoIcon className="h-4 w-4"/>{clientType || 'Não definido'}</p></div>
                </div>

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

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Contrato'}</Button>
                </div>
            </motion.form>
            <CredentialModal isOpen={isCredentialModalOpen} onClose={() => setCredentialModalOpen(false)} onSave={handleSaveCredential} credential={editingCredential} />
        </Modal>
    );
};

export default ContractModal;

