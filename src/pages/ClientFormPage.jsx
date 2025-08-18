import React, { useState, useEffect, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Hooks e Utilitários
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { validateCNPJ, validateCPF, formatDate, cn } from '../utils';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import ContractModal from '../components/modals/ContractModal';

// Formulários
import GeneralInfoForm from '../components/forms/GeneralInfoForm';
import BeneficiariesForm from '../components/forms/BeneficiariesForm';
import HistoryForm from '../components/forms/HistoryForm';
import InternalDataForm from '../components/forms/InternalDataForm';
import DocumentsForm from '../components/forms/DocumentsForm';

// Ícones
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../components/Icons';

const ClientFormPage = ({ client, onSave, onCancel, isConversion = false, leadData = null, initialTab = 'general' }) => {
    const [formData, setFormData] = useState(null);
    const [errors, setErrors] = useState({});
    const [isContractModalOpen, setContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const { addClient, updateClient, loading: isSaving } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();
    const storage = getStorage();
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab || 'general');

    useEffect(() => {
        const defaultData = {
            general: { status: 'Ativo', clientType: 'PME', contactRole: '', isResponsibleBeneficiary: 'Sim' },
            address: { cep: '', street: '', complement: '', neighborhood: '', city: '', state: '' },
            contracts: [],
            internal: {},
            beneficiaries: [],
            observations: [],
            commission: {},
            boletoExceptions: [],
            documents: [] // Campo para os documentos
        };

        let initialData;
        if (isConversion && leadData) {
            initialData = {
                ...defaultData,
                general: { ...defaultData.general, companyName: leadData.company || '', holderName: leadData.name, email: leadData.email, phone: leadData.phone },
                internal: { brokerId: leadData.ownerId },
                observations: leadData.notes ? [{ text: `Nota original do Lead: ${leadData.notes}`, authorId: leadData.ownerId, authorName: 'Sistema', timestamp: new Date() }] : []
            };
        } else if (client) {
            initialData = { ...defaultData, ...JSON.parse(JSON.stringify(client)) };
        } else {
            initialData = defaultData;
        }
        setFormData(initialData);
        setErrors({});
    }, [client, isConversion, leadData]);

    // LÓGICA DE UPLOAD E DELETE DE ARQUIVOS
    const handleFileUpload = async (file) => {
        if (!file) return;

        // Para novos clientes, um ID temporário é usado. O ideal é salvar o cliente primeiro.
        const targetId = formData.id || `temp_${Date.now()}`;
        if (!formData.id) {
            toast({ title: "Atenção", description: "Salve o cliente para vincular permanentemente os documentos.", variant: "default" });
        }
        
        setIsUploading(true);
        const storageRef = ref(storage, `documents/${targetId}/${file.name}`);
        
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            const newDocument = {
                name: file.name,
                url: downloadURL,
                path: snapshot.metadata.fullPath,
                uploadedAt: new Date().toISOString()
            };

            setFormData(prev => ({
                ...prev,
                documents: [...(prev.documents || []), newDocument]
            }));

            toast({ title: "Sucesso!", description: `Arquivo ${file.name} enviado. Lembre-se de salvar as alterações.` });
        } catch (error) {
            toast({ title: "Erro no Upload", description: "Não foi possível enviar o arquivo.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileDelete = async (fileToDelete) => {
        try {
            await confirm({ title: `Excluir ${fileToDelete.name}?`, description: "Isso removerá o arquivo da lista. A exclusão será permanente ao salvar o cliente." });

            // Remove o arquivo do estado local
            setFormData(prev => ({
                ...prev,
                documents: (prev.documents || []).filter(doc => doc.url !== fileToDelete.url)
            }));
            
            // Deleta o arquivo do Firebase Storage
            const fileRef = ref(storage, fileToDelete.path);
            await deleteObject(fileRef);

            toast({ title: "Arquivo removido", description: `${fileToDelete.name} foi removido da lista.` });
        } catch (e) { /* Ação cancelada */ }
    };
    
    // Handlers existentes...
    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(p => {
                const newState = { ...p };
                let current = newState;
                keys.slice(0, -1).forEach(key => {
                    current[key] = { ...current[key] };
                    current = current[key];
                });
                current[keys[keys.length - 1]] = value;
                return newState;
            });
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };
    
    const handleSaveContract = (contractData) => {
        const newContracts = [...(formData.contracts || [])];
        const index = newContracts.findIndex(c => c.id === contractData.id);
        if (contractData.status === 'ativo') {
            newContracts.forEach(c => { if(c.id !== contractData.id) c.status = 'inativo' });
        }
        if (index > -1) {
            newContracts[index] = contractData;
        } else {
            newContracts.push({ ...contractData, id: `local_${Date.now()}` });
        }
        setFormData(p => ({...p, contracts: newContracts}));
        setContractModalOpen(false);
        setEditingContract(null);
    };
    
    const handleDeleteContract = (contractId) => {
        const newContracts = (formData.contracts || []).filter(c => c.id !== contractId);
        setFormData(p => ({...p, contracts: newContracts}));
    };
    
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
            toast({ title: "Verifique os campos", description: "Há campos com dados inválidos ou obrigatórios não preenchidos.", variant: 'destructive' });
            setActiveTab('general');
            return;
        }
        const { id, ...dataToSave } = formData;
        const result = id ? await updateClient(id, dataToSave) : await addClient(dataToSave);
        if (result) {
            onSave(result, leadData?.id);
        }
    };
    
    const handleBeneficiariesChange = useCallback((benefs) => { setFormData(p => ({ ...p, beneficiaries: benefs })); }, []);

    if (!formData) { return <div className="p-8 text-center">Carregando formulário...</div>; }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{isConversion ? `Converter Lead: ${leadData?.name || ''}` : (formData.id ? 'Editar Cliente' : 'Adicionar Novo Cliente')}</h2>
            <form onSubmit={handleSubmit}>
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
                        
                        <TabsContent value="general"><GeneralInfoForm formData={formData} handleChange={handleChange} errors={errors} /></TabsContent>
                        <TabsContent value="contracts">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Gestão de Contratos</h3><Button type="button" onClick={() => { setEditingContract(null); setContractModalOpen(true); }}><PlusCircleIcon className="h-4 w-4 mr-2" />Novo Contrato</Button></div>
                            <div className="space-y-4">
                                {(formData.contracts || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhum contrato adicionado.</p> : (formData.contracts || []).map(contract => (<div key={contract.id} className={cn("p-4 rounded-lg flex justify-between items-center", contract.status === 'ativo' ? 'bg-green-100/70 dark:bg-green-900/40 border-l-4 border-green-500' : 'bg-gray-100 dark:bg-black/20')}><div><p className="font-semibold">{contract.planOperator || 'Novo Contrato'}</p><p className="text-sm text-gray-600 dark:text-gray-400">{contract.policyNumber} - Início: {formatDate(contract.effectiveDate)}</p></div><div className="flex gap-2"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingContract(contract); setContractModalOpen(true); }}><PencilIcon className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteContract(contract.id)}><Trash2Icon className="h-4 w-4" /></Button></div></div>))}
                            </div>
                        </TabsContent>
                        <TabsContent value="beneficiaries"><BeneficiariesForm beneficiaries={formData.beneficiaries || []} setBeneficiaries={handleBeneficiariesChange} toast={toast} /></TabsContent>
                        
                        <TabsContent value="documents">
                            <DocumentsForm 
                                documents={formData.documents || []}
                                onFileUpload={handleFileUpload}
                                onFileDelete={handleFileDelete}
                                isUploading={isUploading}
                            />
                        </TabsContent>
                        
                        <TabsContent value="history"><HistoryForm observations={formData.observations || []} setObservations={(o) => setFormData(p => ({...p, observations: o}))} /></TabsContent>
                        <TabsContent value="internal"><InternalDataForm formData={formData} handleChange={handleChange} /></TabsContent>
                    </Tabs>
                </GlassPanel>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving || isUploading}>{isSaving ? 'Salvando...' : 'Salvar Cliente'}</Button>
                </div>
            </form>
            <ContractModal isOpen={isContractModalOpen} onClose={() => setContractModalOpen(false)} onSave={handleSaveContract} contract={editingContract} clientType={formData.general?.clientType} />
        </div>
    );
};

export default ClientFormPage;