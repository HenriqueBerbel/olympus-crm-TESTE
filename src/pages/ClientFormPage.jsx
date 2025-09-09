import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Utilitários
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import { validateCNPJ, validateCPF } from '../utils';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';

// Formulários
import GeneralInfoForm from '../components/forms/GeneralInfoForm';
import ContractsForm from '../components/forms/ContractsForm';
import BeneficiariesForm from '../components/forms/BeneficiariesForm';
import HistoryForm from '../components/forms/HistoryForm';
import InternalDataForm from '../components/forms/InternalDataForm';
import DocumentsForm from '../components/forms/DocumentsForm';

const ClientFormPage = ({ onCancel, onSaveSuccess, isConversion = false, leadData = null }) => {
    const [formData, setFormData] = useState(null);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const { addClient } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const defaultData = {
            general: { status: 'Ativo', clientType: 'PME', contactRole: '', isResponsibleBeneficiary: 'Sim' },
            address: { cep: '', street: '', complement: '', neighborhood: '', city: '', state: '' },
            contracts: [], internal: {}, beneficiaries: [], observations: [],
            commission: {}, boletoExceptions: [], documents: []
        };

        const initialData = isConversion && leadData ? {
            ...defaultData,
            general: { ...defaultData.general, companyName: leadData.company || '', holderName: leadData.name, email: leadData.email, phone: leadData.phone },
            internal: { brokerId: leadData.ownerId },
            observations: leadData.notes ? [{ text: `Nota original do Lead: ${leadData.notes}`, authorId: leadData.ownerId || user.uid, authorName: 'Sistema', timestamp: new Date() }] : []
        } : defaultData;
        
        setFormData(initialData);
        setErrors({});
    }, [isConversion, leadData, user]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        setFormData(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            keys.slice(0, -1).forEach(key => { current = current[key] = current[key] || {}; });
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    }, []);
    
    const setDirectFormData = useCallback((newState) => { setFormData(newState); }, []);

    // [CÓDIGO RESTAURADO] A lógica de validação está completa novamente.
    const validateForm = () => {
        const newErrors = {};
        const { general } = formData;
        if (!general?.clientType) newErrors.clientType = "Tipo de cliente é obrigatório.";
        if (general?.clientType === 'PME' && !general?.companyName?.trim()) newErrors.companyName = "Nome da empresa é obrigatório.";
        if (general?.clientType !== 'PME' && !general?.holderName?.trim()) newErrors.holderName = "Nome do titular é obrigatório.";
        if (general?.cnpj && !validateCNPJ(general.cnpj)) newErrors.cnpj = "CNPJ inválido.";
        if (general?.responsibleCpf && !validateCPF(general.responsibleCpf)) newErrors.responsibleCpf = "CPF do responsável inválido.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({ title: "Verifique os campos", description: "Dados inválidos ou obrigatórios não preenchidos.", variant: 'destructive' });
            setActiveTab('general');
            return;
        }
        
        setIsSaving(true);
        try {
            const dataToSave = { ...formData, sortName: (formData.general.companyName || formData.general.holderName || '').toLowerCase() };
            if (dataToSave.general.clientType === 'Pessoa Física' && !dataToSave.general.companyName) {
                dataToSave.general.companyName = dataToSave.general.holderName;
            }

            const newClient = await addClient(dataToSave);
            if (isConversion && onSaveSuccess) {
                onSaveSuccess(newClient, leadData.id);
            } else {
                navigate(`/clients/${newClient.id}`);
            }
        } catch (error) {
            toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const tabContentVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
    };
    
    if (!formData) { return <div className="p-8 text-center">Carregando formulário...</div>; }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.h2 
                className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {isConversion ? `Converter Lead: ${leadData?.name || ''}` : 'Adicionar Novo Cliente'}
            </motion.h2>
            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <GlassPanel className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="general">Visão Geral</TabsTrigger>
                            <TabsTrigger value="contracts">Contratos</TabsTrigger>
                            <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger>
                            <TabsTrigger value="documents">Documentos</TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                            <TabsTrigger value="internal">Dados Internos</TabsTrigger>
                        </TabsList>
                        
                        <div className="pt-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    variants={tabContentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    {activeTab === 'general' && <GeneralInfoForm formData={formData} handleChange={handleChange} errors={errors} />}
                                    {activeTab === 'contracts' && <ContractsForm formData={formData} setFormData={setDirectFormData} />}
                                    {activeTab === 'beneficiaries' && <BeneficiariesForm beneficiaries={formData.beneficiaries} setBeneficiaries={(b) => setFormData(p => ({...p, beneficiaries: b}))} toast={toast} />}
                                    {activeTab === 'documents' && <DocumentsForm documents={formData.documents} isUploading={isUploading} />}
                                    {activeTab === 'history' && <HistoryForm observations={formData.observations} setObservations={(o) => setFormData(p => ({...p, observations: o}))} />}
                                    {activeTab === 'internal' && <InternalDataForm formData={formData} handleChange={handleChange} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </GlassPanel>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving || isUploading}>{isSaving ? 'Salvando...' : 'Criar Cliente'}</Button>
                </div>
            </motion.form>
        </div>
    );
};

export default ClientFormPage;