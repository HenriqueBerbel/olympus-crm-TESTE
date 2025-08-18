import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatDate, cn } from '../../utils';
import Modal from '../Modal';
import CredentialModal from './CredentialModal'; // CORREÇÃO: Importado como default
import Label from '../Label';
import Select from '../Select';
import Input from '../Input';
import Checkbox from '../Checkbox';
import DateField from '../DateField';
import Button from '../Button';
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../Icons';

// CORREÇÃO: Alterado de "export const" para uma constante
const ContractModal = ({ isOpen, onClose, onSave, contract, clientType }) => {
    const { operators, users } = useData();
    const sortedOperators = useMemo(() => [...(operators || [])].sort((a, b) => a.name.localeCompare(b.name)), [operators]);
    
    const getInitialState = () => ({
        id: `local_${Date.now()}`, status: 'ativo', proposalNumber: '', policyNumber: '', 
        planOperator: '', previousPlan: '', planTypes: [], planCategory: '', accommodation: '',
        contractValue: '', feeValue: '', paymentMethod: '', monthlyDueDate: '',
        effectiveDate: '', boletoSentDate: '', renewalDate: '',
        boletoResponsibleId: '', credentialsList: []
    });

    const [formState, setFormState] = useState(getInitialState());
    const [isCredentialModalOpen, setCredentialModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormState(contract ? { ...getInitialState(), ...contract } : getInitialState());
        }
    }, [contract, isOpen]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={contract ? "Editar Contrato" : "Adicionar Novo Contrato"} size="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Plano Fechado (Operadora)</Label><Select name="planOperator" value={formState.planOperator || ''} onChange={handleChange}><option value="">Selecione</option>{sortedOperators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}</Select></div>
                    <div><Label>Número da Proposta</Label><Input name="proposalNumber" value={formState.proposalNumber || ''} onChange={handleChange} /></div>
                    <div><Label>Número da Apólice / Contrato</Label><Input name="policyNumber" value={formState.policyNumber || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Categoria do Plano</Label><Input name="planCategory" value={formState.planCategory || ''} onChange={handleChange} /></div>
                    <div><Label>Acomodação</Label><Select name="accommodation" value={formState.accommodation || ''} onChange={handleChange}><option value="">Selecione...</option><option>Enfermaria</option><option>Apartamento</option></Select></div>
                    <div><Label>Tipo de Plano</Label><div className="flex gap-6 mt-2 pt-2 text-gray-800 dark:text-gray-300"><label className="font-bold flex items-center gap-2"><Checkbox name="planTypes" value="Saúde" checked={(formState.planTypes || []).includes('Saúde')} onChange={handleChange} /> Saúde</label><label className="font-bold flex items-center gap-2"><Checkbox name="planTypes" value="Dental" checked={(formState.planTypes || []).includes('Dental')} onChange={handleChange} /> Dental</label></div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Tipo de Plano (da Visão Geral)</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-black/20 rounded-lg">{clientType || 'N/A'}</p></div>
                    <div><Label>Valor do Contrato</Label><Input type="number" name="contractValue" value={formState.contractValue || ''} onChange={handleChange} /></div>
                    <div><Label>Valor da Taxa</Label><Input type="number" name="feeValue" value={formState.feeValue || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Forma de Pagamento</Label><Select name="paymentMethod" value={formState.paymentMethod || ''} onChange={handleChange}><option value="">Selecione...</option><option>Boleto</option><option>Cartão de Crédito</option><option>Débito Automático</option><option>Pix</option></Select></div>
                    <div><Label>Data da Vigência</Label><DateField name="effectiveDate" value={formState.effectiveDate || ''} onChange={handleChange} /></div>
                    <div><Label>Vencimento Mensal (Dia)</Label><Input type="number" name="monthlyDueDate" value={formState.monthlyDueDate || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Data Envio do Boleto</Label><DateField name="boletoSentDate" value={formState.boletoSentDate || ''} onChange={handleChange} /></div>
                    <div><Label>Responsável pelo Boleto</Label><Select name="boletoResponsibleId" value={formState.boletoResponsibleId || ''} onChange={handleChange}><option value="">Selecione...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Renovação de Contrato</Label><DateField name="renewalDate" value={formState.renewalDate || ''} onChange={handleChange} /></div>
                    <div><Label>Status</Label><Select name="status" value={formState.status || 'ativo'} onChange={handleChange}><option value="ativo">Ativo</option><option value="inativo">Inativo (Histórico)</option></Select></div>
                    <div><Label>Plano Anterior</Label><Input name="previousPlan" value={formState.previousPlan || ''} onChange={handleChange} /></div>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Credenciais</h3>
                        <Button type="button" onClick={() => { setEditingCredential(null); setCredentialModalOpen(true); }}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Credencial</Button>
                    </div>
                    <div className="space-y-2">
                        {(formState.credentialsList || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhuma credencial adicionada.</p> : (formState.credentialsList || []).map(cred => (
                            <div key={cred.id} className="p-3 rounded-lg flex justify-between items-center bg-gray-100 dark:bg-black/20">
                                <div><p className="font-semibold text-gray-900 dark:text-white">{cred.title}</p><p className="text-sm text-gray-600 dark:text-gray-400">{cred.portalSite || cred.createdEmail}</p></div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCredential(cred); setCredentialModalOpen(true); }}><PencilIcon className="h-4 w-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteCredential(cred.id)}><Trash2Icon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Contrato</Button></div>
            </form>
            <CredentialModal isOpen={isCredentialModalOpen} onClose={() => setCredentialModalOpen(false)} onSave={handleSaveCredential} credential={editingCredential} />
        </Modal>
    );
};

export default ContractModal;