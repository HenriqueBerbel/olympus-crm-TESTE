import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// [CORREÇÃO] Todos os caminhos de importação agora são RELATIVOS
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';
import Modal from '../Modal';
import Label from '../Label';
import Select, { SelectItem } from '../Select';
import Input from '../Input';
import Button from '../Button';
import DateField from '../DateField';
import DetailItem from '../DetailItem';
import GlassPanel from '../GlassPanel'; 
import { UsersIcon, FileTextIcon, BriefcaseIcon, DollarSignIcon, CheckSquareIcon, EyeIcon, SearchIcon, SparklesIcon } from '../Icons';
import { cn, formatCurrency, formatDate } from '../../utils';


// --- Subcomponente: Cabeçalho do Wizard ---
const WizardHeader = ({ steps, currentStep, setStep }) => (
    <div className="flex border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        {steps.map((s, index) => (
            <React.Fragment key={s.id}>
                <motion.div 
                    className={cn("flex flex-col items-center text-center w-1/5", s.isComplete ? "cursor-pointer" : "cursor-default")}
                    onClick={() => s.isComplete && setStep(s.id)}
                    whileHover={s.isComplete ? { scale: 1.05 } : {}}
                >
                    <motion.div 
                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-slate-100 text-slate-500 border-slate-300 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:border-cyan-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:data-[state=active]:bg-cyan-500"
                        data-state={currentStep >= s.id ? "active" : "inactive"}
                        transition={{ duration: 0.3 }}
                    >
                        {s.isComplete ? <CheckSquareIcon className="w-5 h-5"/> : <s.icon className="w-5 h-5"/>}
                    </motion.div>
                    <p className={cn("mt-2 text-xs md:text-sm font-semibold transition-colors", currentStep >= s.id ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500")}>{s.name}</p>
                </motion.div>
                {index < steps.length - 1 && (
                    <div className="flex-1 h-px mt-5 mx-2 bg-slate-200 dark:bg-slate-700 relative">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: currentStep > s.id ? '100%' : '0%' }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                )}
            </React.Fragment>
        ))}
    </div>
);

// --- Componente Principal ---
const CommissionWizardModal = ({ isOpen, onClose, onSave, clients = [], users = [] }) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [commission, setCommission] = useState({});
    const [activeContracts, setActiveContracts] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const debouncedSearchTerm = useDebounce(clientSearch, 300);

    const initialState = {
        clientId: '', clientName: '', contractId: '', supervisorId: '', brokerId: '',
        contractValue: 0, commissionRate: '', paymentStructure: 'À Vista',
        installmentsTotal: 1, firstDueDate: ''
    };

    const steps = [
        { id: 1, name: 'Cliente', icon: UsersIcon, isComplete: !!commission.clientId },
        { id: 2, name: 'Contrato', icon: FileTextIcon, isComplete: !!commission.contractId },
        { id: 3, name: 'Responsáveis', icon: BriefcaseIcon, isComplete: !!commission.brokerId },
        { id: 4, name: 'Valores', icon: DollarSignIcon, isComplete: !!commission.commissionRate && !!commission.firstDueDate },
        { id: 5, name: 'Revisão', icon: EyeIcon, isComplete: false }
    ];

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1); setCommission(initialState); setActiveContracts([]); setClientSearch(''); setIsSaving(false);
            }, 300);
        } else {
            setCommission(initialState);
        }
    }, [isOpen]);

    const handleClientSelect = (client) => {
        const clientName = client.general?.companyName || client.general?.holderName;
        setClientSearch(clientName);
        
        const contracts = (client.contracts || []).filter(c => c.status === 'ativo');
        setActiveContracts(contracts);
        
        const newCommissionState = { ...initialState, clientId: client.id, clientName };
        setCommission(newCommissionState);
        
        setStep(2);
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const dataToSave = { ...commission, paymentStatus: 'Pendente' };
            await onSave(dataToSave);
        } catch (error) {
            console.error("Falha ao salvar comissão:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a comissão.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredClients = useMemo(() => {
        if (!debouncedSearchTerm) return [];
        return clients.filter(c => 
            (c.general?.companyName || c.general?.holderName || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ).slice(0, 5);
    }, [debouncedSearchTerm, clients]);

    const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';

    const renderStepContent = () => {
        const motionProps = {
            key: step,
            initial: { opacity: 0, x: 50 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -50 },
            transition: { duration: 0.3, ease: 'easeInOut' }
        };

        switch (step) {
            case 1:
                return (
                    <motion.div {...motionProps}>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">1. Selecione o Cliente</h2>
                        <Label>Busque pelo nome do cliente</Label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                            <Input id="client-search" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10" placeholder="Digite para buscar..." autoComplete="off" />
                            {filteredClients.length > 0 && clientSearch && (
                                <GlassPanel className="absolute top-full mt-2 w-full p-2 z-10 max-h-48 overflow-y-auto">
                                    {filteredClients.map(c => (
                                        <div key={c.id} onClick={() => handleClientSelect(c)} className="p-2 rounded-md hover:bg-cyan-100 dark:hover:bg-cyan-500/20 cursor-pointer text-slate-800 dark:text-slate-200">
                                            {(c.general?.companyName || c.general?.holderName)}
                                        </div>
                                    ))}
                                </GlassPanel>
                            )}
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div {...motionProps}>
                         <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">2. Selecione o Contrato Ativo</h2>
                         <Label>Contratos de "{commission.clientName}"</Label>
                         <Select value={commission.contractId || ''} onValueChange={(v) => setCommission(p => ({...p, contractId: v, contractValue: activeContracts.find(c => c.id === v)?.contractValue}))}>
                             {activeContracts.map(c => <SelectItem key={c.id} value={c.id}>{c.planOperator} - {formatCurrency(c.contractValue)} - Início: {formatDate(c.effectiveDate)}</SelectItem>)}
                         </Select>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div {...motionProps}>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">3. Vincule os Responsáveis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Corretor (Obrigatório)</Label>
                                <Select value={commission.brokerId || ''} onValueChange={(v) => setCommission(p => ({...p, brokerId: v}))}>
                                    {users.filter(u => u.permissionLevel === 'Corretor').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </Select>
                            </div>
                            <div>
                                <Label>Supervisor (Opcional)</Label>
                                <Select value={commission.supervisorId || ''} onValueChange={(v) => setCommission(p => ({...p, supervisorId: v}))}>
                                    {users.filter(u => u.permissionLevel === 'Supervisor').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </Select>
                            </div>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div {...motionProps}>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">4. Defina os Valores da Comissão</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><Label>Valor do Contrato (Base)</Label><p className="h-10 font-bold text-lg flex items-center px-3 text-slate-800 dark:text-slate-200">{formatCurrency(commission.contractValue)}</p></div>
                            <div><Label>Taxa de Comissão (%)</Label><Input type="number" value={commission.commissionRate || ''} onChange={(e) => setCommission(p => ({...p, commissionRate: e.target.value}))} placeholder="Ex: 3.5" required/></div>
                            <div>
                                <Label>Forma de Pagamento</Label>
                                <Select value={commission.paymentStructure || ''} onValueChange={(v) => setCommission(p => ({...p, paymentStructure: v}))}>
                                    <SelectItem value="À Vista">À Vista</SelectItem>
                                    <SelectItem value="Parcelado">Parcelado</SelectItem>
                                </Select>
                            </div>
                            {commission.paymentStructure === 'Parcelado' && (<div><Label>Nº de Parcelas</Label><Input type="number" min="1" value={commission.installmentsTotal || ''} onChange={(e) => setCommission(p => ({...p, installmentsTotal: e.target.value}))}/></div>)}
                            <div><Label>Data do 1º Vencimento</Label><DateField value={commission.firstDueDate || ''} onChange={(e) => setCommission(p => ({...p, firstDueDate: e.target.value}))} required/></div>
                        </div>
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div {...motionProps}>
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">5. Revisão Final</h2>
                        <p className="text-sm text-slate-500 mb-6">Por favor, confirme se todas as informações abaixo estão corretas antes de salvar.</p>
                        <div className="space-y-2 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                            <DetailItem label="Cliente" value={commission.clientName} contourMode/>
                            <DetailItem label="Corretor" value={getUserName(commission.brokerId)} contourMode/>
                            <DetailItem label="Supervisor" value={getUserName(commission.supervisorId)} contourMode/>
                            <DetailItem label="Valor Base" value={formatCurrency(commission.contractValue)} contourMode/>
                            <DetailItem label="Taxa" value={`${commission.commissionRate || 0}%`} contourMode/>
                            <DetailItem label="1º Vencimento" value={formatDate(commission.firstDueDate)} contourMode/>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lançar Nova Comissão" size="3xl" closeOnClickOutside={false}>
            <div className="p-4">
                <WizardHeader steps={steps} currentStep={step} setStep={setStep} />
                <div className="min-h-[280px]">
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </div>
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSaving}>Voltar</Button>
                    {step < 5 && <Button onClick={() => setStep(s => s + 1)} disabled={!steps[step - 1].isComplete || isSaving}>Avançar</Button>}
                    {step === 5 && <Button onClick={handleSave} variant="violet" disabled={isSaving}><SparklesIcon className="h-4 w-4 mr-2"/>{isSaving ? 'Salvando...' : 'Confirmar e Salvar'}</Button>}
                </div>
            </div>
        </Modal>
    );
};

export default CommissionWizardModal;

