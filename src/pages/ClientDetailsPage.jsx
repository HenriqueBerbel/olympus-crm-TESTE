import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Utilitários
import { useData } from '../contexts/DataContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/NotificationContext';
import { validateCNPJ, validateCPF } from '../utils';

// Componentes de Visualização
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import OverviewTab from '../components/clients/OverviewTab';
import ContractsTab from '../components/clients/ContractsTab';
import BeneficiariesTab from '../components/clients/BeneficiariesTab';
import DocumentsTab from '../components/clients/DocumentsTab';
import HistoryTab from '../components/clients/HistoryTab';
import InternalTab from '../components/clients/InternalTab';
import CortexTab from '../components/clients/CortexTab';

// Componentes de Formulário
import GeneralInfoForm from '../components/forms/GeneralInfoForm';
import ContractsForm from '../components/forms/ContractsForm';
import BeneficiariesForm from '../components/forms/BeneficiariesForm';
import DocumentsForm from '../components/forms/DocumentsForm';
import HistoryForm from '../components/forms/HistoryForm';
import InternalDataForm from '../components/forms/InternalDataForm';

// Ícones
import { ChevronLeftIcon, DownloadIcon, PencilIcon, Trash2Icon, XIcon, CheckIcon } from '../components/Icons';

// ========================================================================
//          *** VARIANTES DE ANIMAÇÃO ***
// ========================================================================
const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
};


// ========================================================================
//          *** PÁGINA DE DETALHES DO CLIENTE ***
// ========================================================================
const ClientDetailsPage = ({ client: initialClient, onBack }) => {
    // Estados
    const [isEditing, setIsEditing] = useState(false);
    const [client, setClient] = useState(initialClient);
    const [formData, setFormData] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef(null);

    // Hooks
    const { updateClient, deleteClient } = useData();
    const confirm = useConfirm();
    const { toast } = useToast();
    const storage = getStorage();

    // Efeitos
    useEffect(() => { setClient(initialClient); }, [initialClient]);
    useEffect(() => {
        if (isEditing) {
            setFormData(JSON.parse(JSON.stringify(client)));
        } else {
            setFormData(null);
            setErrors({});
        }
    }, [isEditing, client]);

    // Handlers
    const handleToggleEdit = (tab) => { setActiveTab(tab || 'general'); setIsEditing(true); };
    const handleCancel = () => { setIsEditing(false); };
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

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast({ title: "Verifique os campos", description: "Dados inválidos ou obrigatórios não preenchidos.", variant: 'destructive' });
            setActiveTab('general');
            return;
        }
        setIsSaving(true);
        try {
            const { id, ...dataToSave } = formData;
            dataToSave.sortName = (dataToSave.general.companyName || dataToSave.general.holderName || '').toLowerCase();
            await updateClient(id, dataToSave);
            setClient(formData);
            setIsEditing(false);
        } catch (error) {
            toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    // [CÓDIGO RESTAURADO]
    const handleDelete = async () => {
        const clientName = client.general?.companyName || client.general?.holderName;
        try {
            await confirm({ title: `Excluir ${clientName}?`, description: "Esta ação é permanente." });
            await deleteClient(client.id, clientName);
            onBack();
        } catch (e) { /* Cancelado pelo usuário */ }
    };

    // [CÓDIGO RESTAURADO]
    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const storageRef = ref(storage, `documents/${client.id}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const newDocument = { name: file.name, url: downloadURL, path: snapshot.metadata.fullPath, uploadedAt: new Date().toISOString() };
            setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDocument] }));
            toast({ title: "Sucesso!", description: `Arquivo ${file.name} enviado. Lembre-se de salvar o cliente para confirmar.` });
        } catch (error) {
            toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // [CÓDIGO RESTAURADO]
    const handleFileDelete = async (fileToDelete) => {
        try {
            await confirm({ title: `Excluir ${fileToDelete.name}?` });
            const fileRef = ref(storage, fileToDelete.path);
            await deleteObject(fileRef);
            setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter(doc => doc.url !== fileToDelete.url) }));
            toast({ title: "Arquivo removido", description: `As alterações serão salvas ao confirmar o formulário.` });
        } catch (e) { /* Ação cancelada */ }
    };

    // [CÓDIGO RESTAURADO]
    const handleGeneratePdf = async () => {
        if (isEditing) {
            toast({ title: "Ação inválida", description: "Salve ou cancele as alterações para gerar o PDF.", variant: "warning" });
            return;
        }
        const elementToPrint = printRef.current;
        if (!elementToPrint) return;

        setIsGeneratingPdf(true);
        const canvas = await html2canvas(elementToPrint, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = canvas.width / canvas.height;
        const finalImgWidth = pdfWidth - 20;
        const finalImgHeight = finalImgWidth / ratio;

        pdf.addImage(imgData, 'PNG', 10, 10, finalImgWidth, finalImgHeight);
        pdf.save(`relatorio_${client.general?.sortName || 'cliente'}.pdf`);
        setIsGeneratingPdf(false);
    };

    if (!client) return <div className="p-8 text-center">Carregando cliente...</div>;
    const clientName = client.general?.companyName || client.general?.holderName || "Cliente";

    const renderTabsContent = (isEditingMode) => (
        <AnimatePresence mode="wait">
            <motion.div
                key={isEditingMode ? `edit-${activeTab}` : `view-${activeTab}`}
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {isEditingMode && formData ? (
                    <>
                        {activeTab === 'general' && <GeneralInfoForm formData={formData} handleChange={handleChange} errors={errors} />}
                        {activeTab === 'contracts' && <ContractsForm formData={formData} setFormData={setDirectFormData} />}
                        {activeTab === 'beneficiaries' && <BeneficiariesForm beneficiaries={formData.beneficiaries} setBeneficiaries={(b) => setFormData(p => ({...p, beneficiaries: b}))} toast={toast} />}
                        {activeTab === 'documents' && <DocumentsForm documents={formData.documents} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} isUploading={isUploading} />}
                        {activeTab === 'history' && <HistoryForm observations={formData.observations} setObservations={(o) => setFormData(p => ({...p, observations: o}))} />}
                        {activeTab === 'internal' && <InternalDataForm formData={formData} handleChange={handleChange} />}
                        {activeTab === 'cortex' && <CortexTab client={client} />}
                    </>
                ) : (
                    <>
                        {activeTab === 'general' && <OverviewTab client={client} />}
                        {activeTab === 'contracts' && <ContractsTab client={client} onEdit={() => handleToggleEdit('contracts')} />}
                        {activeTab === 'beneficiaries' && <BeneficiariesTab client={client} />}
                        {activeTab === 'documents' && <DocumentsTab client={client} />}
                        {activeTab === 'history' && <HistoryTab client={client} />}
                        {activeTab === 'internal' && <InternalTab client={client} />}
                        {activeTab === 'cortex' && <CortexTab client={client} />}
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start mb-6 gap-4 flex-wrap"
            >
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-2">
                        <ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar para a lista
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{clientName}</h2>
                </div>
                <div className="flex gap-2">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div key="edit-buttons" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2">
                                <Button variant="outline" onClick={handleCancel} disabled={isSaving}><XIcon className="h-4 w-4 mr-2" /> Cancelar</Button>
                                <Button onClick={handleSubmit} disabled={isSaving || isUploading}><CheckIcon className="h-4 w-4 mr-2" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                            </motion.div>
                        ) : (
                            <motion.div key="view-buttons" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2">
                                <Button variant="outline" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? 'Gerando...' : <><DownloadIcon className="h-4 w-4 mr-2" />Baixar PDF</>}</Button>
                                <Button variant="outline" onClick={() => handleToggleEdit(activeTab)}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button>
                                <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.header>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <GlassPanel ref={printRef} className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="general">Visão Geral</TabsTrigger>
                            <TabsTrigger value="contracts">Contratos</TabsTrigger>
                            <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger>
                            <TabsTrigger value="documents">Documentos</TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                            <TabsTrigger value="internal">Interno</TabsTrigger>
                            <TabsTrigger value="cortex">Córtex AI</TabsTrigger>
                        </TabsList>
                        
                        <div className="pt-6">
                           {renderTabsContent(isEditing)}
                        </div>
                    </Tabs>
                </GlassPanel>
            </motion.div>
        </div>
    );
};

export default ClientDetailsPage;