import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Select from '../Select';
import Input from '../Input';
import Button from '../Button';
import DateField from '../DateField';
import DetailItem from '../DetailItem'; // Importado para a tela de revisão
import { UsersIcon, FileTextIcon, BriefcaseIcon, DollarSignIcon, CheckSquareIcon, SparklesIcon, SearchIcon, EyeIcon } from '../Icons';
import { useToast } from '../../contexts/NotificationContext';
import { cn, formatCurrency, formatDate } from '../../utils';

// Componente para o cabeçalho do Wizard, para manter o código principal limpo
const WizardHeader = ({ steps, currentStep, setStep }) => (
    <div className="flex border-b border-gray-200 dark:border-white/10 pb-4 mb-8">
        {steps.map((s, index) => (
            <React.Fragment key={s.id}>
                <div 
                    className={cn("flex flex-col items-center", s.isComplete ? "cursor-pointer" : "cursor-default")}
                    onClick={() => s.isComplete && setStep(s.id)}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        currentStep >= s.id ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500',
                        s.isComplete && "hover:bg-cyan-600"
                    )}>
                        {s.isComplete ? <CheckSquareIcon className="w-6 h-6"/> : <s.icon className="w-6 h-6"/>}
                    </div>
                    <p className={cn("mt-2 text-sm text-center font-semibold", currentStep >= s.id ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500")}>{s.name}</p>
                </div>
                {index < steps.length - 1 && <div className={cn("flex-1 h-0.5 mt-5 mx-2 transition-all duration-500", currentStep > s.id ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700')} />}
            </React.Fragment>
        ))}
    </div>
);

const CommissionWizardModal = ({ isOpen, onClose, onSave, clients = [], users = [] }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [commission, setCommission] = useState({});
    const [activeContracts, setActiveContracts] = useState([]);
    
    // MELHORIA: Estado para o termo de busca do cliente
    const [clientSearch, setClientSearch] = useState('');

    const initialState = {
        clientId: '', clientName: '', contractId: '', supervisorId: '', brokerId: '',
        contractValue: 0, commissionRate: '', paymentStructure: 'À Vista',
        installmentsTotal: 1, firstDueDate: ''
    };

    // MELHORIA: Etapas agora incluem uma de Revisão
    const steps = [
        { id: 1, name: 'Cliente', icon: UsersIcon, isComplete: !!commission.clientId },
        { id: 2, name: 'Contrato', icon: FileTextIcon, isComplete: !!commission.contractId },
        { id: 3, name: 'Responsáveis', icon: BriefcaseIcon, isComplete: !!commission.brokerId },
        { id: 4, name: 'Valores', icon: DollarSignIcon, isComplete: !!commission.commissionRate && !!commission.firstDueDate },
        { id: 5, name: 'Revisão', icon: EyeIcon, isComplete: false }
    ];

    useEffect(() => {
        if (!isOpen) {
            // Delay para permitir a animação de saída antes de resetar
            setTimeout(() => {
                setStep(1);
                setCommission(initialState);
                setActiveContracts([]);
                setClientSearch('');
                setIsSaving(false);
            }, 300);
        } else {
            setCommission(initialState);
        }
    }, [isOpen]);

    const handleClientChange = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        const clientName = client.general?.companyName || client.general?.holderName;
        setClientSearch(clientName); // Atualiza o campo de busca com o nome selecionado
        
        const contracts = (client.contracts || []).filter(c => c.status === 'ativo');
        setActiveContracts(contracts);
        
        // Limpa seleções dependentes
        const newCommissionState = { ...initialState, clientId, clientName };

        if (contracts.length === 1) {
            newCommissionState.contractId = contracts[0].id;
            newCommissionState.contractValue = contracts[0].contractValue;
            setCommission(newCommissionState);
            setStep(3); // Pula para Responsáveis
        } else {
            setCommission(newCommissionState);
            setStep(2); // Vai para Contratos
        }
    };

    const handleSelectContract = (contractId) => {
        const contract = activeContracts.find(c => c.id === contractId);
        if(contract) {
            setCommission(p => ({ ...p, contractId: contract.id, contractValue: contract.contractValue }));
        }
    };
    
    // MELHORIA: Lógica de salvamento robusta
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const dataToSave = { ...commission, paymentStatus: 'Pendente' };
            await onSave(dataToSave);
            toast({ title: "Sucesso!", description: "Comissão lançada com sucesso." });
        } catch (error) {
            console.error("Falha ao salvar comissão:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a comissão.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // MELHORIA: Clientes filtrados para a busca
    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => 
            (c.general?.companyName || c.general?.holderName || '').toLowerCase().includes(clientSearch.toLowerCase())
        );
    }, [clientSearch, clients]);

    // Busca o nome do usuário pelo ID para a tela de revisão
    const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lançar Nova Comissão" size="3xl" closeOnClickOutside={false}>
            <WizardHeader steps={steps} currentStep={step} setStep={setStep} />

            <div className="min-h-[280px] transition-opacity duration-300">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">1. Selecione o Cliente</h2>
                        <Label htmlFor="client-search">Busque pelo nome do cliente</Label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                            <Input 
                                id="client-search"
                                list="client-list" 
                                value={clientSearch} 
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    const match = clients.find(c => (c.general?.companyName || c.general?.holderName) === e.target.value);
                                    if(match) handleClientChange(match.id);
                                }}
                                className="pl-10"
                                placeholder="Digite para buscar..."
                            />
                        </div>
                        <datalist id="client-list">
                            {filteredClients.map(c => <option key={c.id} value={c.general?.companyName || c.general?.holderName} />)}
                        </datalist>
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">2. Selecione o Contrato Ativo</h2>
                        <Label htmlFor="contract-select">Contratos de "{commission.clientName}"</Label>
                        <Select id="contract-select" value={commission.contractId || ''} onChange={(e) => handleSelectContract(e.target.value)}>
                            <option value="">Selecione...</option>
                            {activeContracts.map(c => <option key={c.id} value={c.id}>{c.planOperator} - {formatCurrency(c.contractValue)} - Início: {formatDate(c.effectiveDate)}</option>)}
                        </Select>
                    </div>
                )}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">3. Vincule os Responsáveis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="broker-select">Corretor (Obrigatório)</Label>
                                <Select id="broker-select" value={commission.brokerId || ''} onChange={(e) => setCommission(p => ({ ...p, brokerId: e.target.value }))}>
                                    <option value="">Selecione...</option>
                                    {/* CORREÇÃO DE BUG CRÍTICO: u.role?.name */}
                                    {users.filter(u => u.role?.name === 'Corretor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="supervisor-select">Supervisor (Opcional)</Label>
                                <Select id="supervisor-select" value={commission.supervisorId || ''} onChange={(e) => setCommission(p => ({ ...p, supervisorId: e.target.value }))}>
                                    <option value="">Nenhum</option>
                                    {users.filter(u => u.role?.name === 'Supervisor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
                {step === 4 && (
                     <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">4. Defina os Valores da Comissão</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><Label>Valor do Contrato (Base)</Label><p className="h-10 font-bold text-lg flex items-center px-3 text-gray-800 dark:text-gray-200">{formatCurrency(commission.contractValue)}</p></div>
                            <div><Label htmlFor="commission-rate">Taxa de Comissão (%)</Label><Input id="commission-rate" type="number" value={commission.commissionRate || ''} onChange={(e) => setCommission(p => ({...p, commissionRate: e.target.value}))} placeholder="Ex: 3.5" required/></div>
                            <div><Label htmlFor="payment-structure">Forma de Pagamento</Label><Select id="payment-structure" value={commission.paymentStructure || ''} onChange={(e) => setCommission(p => ({...p, paymentStructure: e.target.value}))}><option>À Vista</option><option>Parcelado</option></Select></div>
                            {commission.paymentStructure === 'Parcelado' && (<div><Label htmlFor="installments">Nº de Parcelas</Label><Input id="installments" type="number" min="1" value={commission.installmentsTotal || ''} onChange={(e) => setCommission(p => ({...p, installmentsTotal: e.target.value}))}/></div>)}
                            <div><Label htmlFor="due-date">Data do 1º Vencimento</Label><DateField id="due-date" value={commission.firstDueDate || ''} onChange={(e) => setCommission(p => ({...p, firstDueDate: e.target.value}))} required/></div>
                        </div>
                    </div>
                )}
                {step === 5 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">5. Revisão Final</h2>
                        <p className="text-sm text-gray-500 mb-6">Por favor, confirme se todas as informações abaixo estão corretas antes de salvar.</p>
                        <div className="space-y-2 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                            <DetailItem label="Cliente" value={commission.clientName} />
                            <DetailItem label="Corretor" value={getUserName(commission.brokerId)} />
                            <DetailItem label="Supervisor" value={getUserName(commission.supervisorId)} />
                            <DetailItem label="Valor Base" value={formatCurrency(commission.contractValue)} />
                            <DetailItem label="Taxa" value={`${commission.commissionRate}%`} />
                            <DetailItem label="1º Vencimento" value={formatDate(commission.firstDueDate)} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSaving}>Voltar</Button>
                {step < 4 && <Button onClick={() => setStep(s => s + 1)} disabled={!steps[step - 1].isComplete || isSaving}>Avançar</Button>}
                {step === 4 && <Button onClick={() => setStep(5)} disabled={!steps[step - 1].isComplete || isSaving}>Revisar</Button>}
                {step === 5 && <Button onClick={handleSave} variant="violet" disabled={isSaving}><SparklesIcon className="h-4 w-4 mr-2"/>{isSaving ? 'Salvando...' : 'Confirmar e Salvar'}</Button>}
            </div>
        </Modal>
    );
};

export default CommissionWizardModal;