// src/components/modals/CommissionWizardModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Select from '../Select';
import Input from '../Input';
import Button from '../Button';
import DateField from '../DateField';
import { UsersIcon, FileTextIcon, BriefcaseIcon, DollarSignIcon, CheckSquareIcon, SparklesIcon } from '../Icons';
import { cn, formatCurrency, formatDate } from '../../utils';

const CommissionWizardModal = ({ isOpen, onClose, onSave, clients = [], users = [] }) => {
    const [step, setStep] = useState(1);
    const [commission, setCommission] = useState({});
    const [activeContracts, setActiveContracts] = useState([]);

    const steps = [
        { id: 1, name: 'Cliente', icon: UsersIcon },
        { id: 2, name: 'Contrato', icon: FileTextIcon },
        { id: 3, name: 'Responsáveis', icon: BriefcaseIcon },
        { id: 4, name: 'Valores', icon: DollarSignIcon }
    ];

    // Este useEffect para resetar o formulário está correto e deve ser mantido.
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCommission({ clientId: '', contractId: '', supervisorId: '', brokerId: '', contractValue: 0, commissionRate: '', paymentStructure: 'À Vista', installmentsTotal: 1, firstDueDate: '' });
            setActiveContracts([]);
        }
    }, [isOpen]);

    // --- CORREÇÃO APLICADA AQUI ---
    // 1. O useEffect problemático foi REMOVIDO.
    // 2. Criamos uma função `handle` para lidar com a mudança do cliente.
    const handleClientChange = (clientId) => {
        if (!clientId) {
            setCommission({});
            setActiveContracts([]);
            return;
        }

        const client = clients.find(c => c.id === clientId);
        const contracts = (client?.contracts || []).filter(c => c.status === 'ativo');
        
        setActiveContracts(contracts);

        if (contracts.length === 1) {
            // Se só há um contrato, já preenche e pula para o próximo passo.
            setCommission(prev => ({
                ...prev,
                clientId: clientId,
                contractId: contracts[0].id,
                contractValue: contracts[0].contractValue
            }));
            setStep(3);
        } else {
            // Se houver múltiplos ou nenhum contrato, apenas atualiza o ID do cliente.
            setCommission(prev => ({ ...prev, clientId: clientId, contractId: '', contractValue: 0 }));
            setStep(2); // Vai para o passo de selecionar o contrato
        }
    };

    const handleSelectContract = (contractId) => {
        const contract = activeContracts.find(c => c.id === contractId);
        if(contract) {
            setCommission(p => ({ ...p, contractId: contract.id, contractValue: contract.contractValue }));
        }
    };

    const handleSave = () => {
        const client = clients.find(c => c.id === commission.clientId);
        if(client) {
            const dataToSave = { ...commission, clientName: client.general?.companyName || client.general?.holderName, paymentStatus: 'Pendente' };
            onSave(dataToSave);
        }
    };

    const isStepComplete = (stepNum) => {
        if (stepNum === 1) return !!commission.clientId;
        if (stepNum === 2) return !!commission.contractId;
        if (stepNum === 3) return !!commission.brokerId;
        return false;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lançar Nova Comissão" size="5xl">
            {/* O JSX do cabeçalho do Wizard permanece o mesmo */}
            <div className="flex border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                {steps.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", step >= s.id ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500')}>
                                {step > s.id ? <CheckSquareIcon className="w-6 h-6"/> : <s.icon className="w-6 h-6"/>}
                            </div>
                            <p className={cn("mt-2 text-sm font-semibold", step >= s.id ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500")}>{s.name}</p>
                        </div>
                        {index < steps.length - 1 && <div className={cn("flex-1 h-0.5 mt-5 transition-all", step > s.id ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700')} />}
                    </React.Fragment>
                ))}
            </div>

            <div className="min-h-[250px]">
                {step === 1 && (
                    <div>
                        <Label>1. Selecione o Cliente</Label>
                        {/* 3. A nova função é chamada aqui no onChange */}
                        <Select value={commission.clientId || ''} onChange={(e) => handleClientChange(e.target.value)}>
                            <option value="">Selecione...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.general?.companyName || c.general?.holderName}</option>)}
                        </Select>
                    </div>
                )}
                {/* O restante do JSX permanece o mesmo */}
                {step === 2 && (
                    <div>
                        <Label>2. Selecione o Contrato Ativo</Label>
                        <Select value={commission.contractId || ''} onChange={(e) => handleSelectContract(e.target.value)}>
                            <option value="">Selecione...</option>
                            {activeContracts.map(c => <option key={c.id} value={c.id}>{c.planOperator} - {formatCurrency(c.contractValue)} - Início: {formatDate(c.effectiveDate)}</option>)}
                        </Select>
                    </div>
                )}
                {step === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>3. Vincule o Corretor</Label>
                            <Select value={commission.brokerId || ''} onChange={(e) => setCommission(p => ({ ...p, brokerId: e.target.value }))}>
                                <option value="">Selecione...</option>
                                {users.filter(u => u.role === 'Corretor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </Select>
                        </div>
                         <div>
                            <Label>Vincule o Supervisor (Opcional)</Label>
                            <Select value={commission.supervisorId || ''} onChange={(e) => setCommission(p => ({ ...p, supervisorId: e.target.value }))}>
                                <option value="">Nenhum</option>
                                {users.filter(u => u.role === 'Supervisor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </Select>
                        </div>
                    </div>
                )}
                 {step === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><Label>Valor do Contrato (Base)</Label><p className="h-10 font-bold flex items-center px-3 text-gray-700 dark:text-gray-300">{formatCurrency(commission.contractValue)}</p></div>
                        <div><Label>Taxa de Comissão (%)</Label><Input type="number" value={commission.commissionRate || ''} onChange={(e) => setCommission(p => ({...p, commissionRate: e.target.value}))} placeholder="Ex: 3.5"/></div>
                         <div><Label>Forma de Pagamento</Label><Select value={commission.paymentStructure || ''} onChange={(e) => setCommission(p => ({...p, paymentStructure: e.target.value}))}><option>À Vista</option><option>Parcelado</option></Select></div>
                        {commission.paymentStructure === 'Parcelado' && (<div><Label>Nº de Parcelas</Label><Input type="number" value={commission.installmentsTotal || ''} onChange={(e) => setCommission(p => ({...p, installmentsTotal: e.target.value}))}/></div>)}
                        <div><Label>Data do 1º Vencimento</Label><DateField value={commission.firstDueDate || ''} onChange={(e) => setCommission(p => ({...p, firstDueDate: e.target.value}))}/></div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Voltar</Button>
                {step < 4 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!isStepComplete(step)}>Avançar</Button>
                ) : (
                    <Button onClick={handleSave} variant="violet"><SparklesIcon className="h-4 w-4 mr-2"/>Salvar Comissão</Button>
                )}
            </div>
        </Modal>
    );
};

export default CommissionWizardModal;