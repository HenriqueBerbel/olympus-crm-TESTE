import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Hooks e Utilitários
import { useData } from '../contexts/DataContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { formatDate } from '../utils';

// Componentes
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import FormSection from '../components/forms/FormSection';
import DetailItem from '../components/DetailItem';

// Ícones
import { ChevronLeftIcon, DownloadIcon, PencilIcon, Trash2Icon } from '../components/Icons';

// Abas
import InternalTab from '../components/clients/InternalTab';
import BeneficiariesTab from '../components/clients/BeneficiariesTab';
import HistoryTab from '../components/clients/HistoryTab';
import CortexTab from '../components/clients/CortexTab';
import ContractsTab from '../components/clients/ContractsTab';
import DocumentsTab from '../components/clients/DocumentsTab';


const OverviewTab = ({ client }) => {
    const { general, address } = client || {};
    const clientType = general?.clientType;

    return (
        <>
            {/* Seção de Dados da Empresa expandida */}
            <FormSection title="Dados da Empresa">
                {clientType === 'PME' && <DetailItem label="Nome da Empresa" value={general?.companyName} />}
                {clientType === 'PME' && <DetailItem label="CNPJ" value={general?.cnpj} />}
                <DetailItem label="Nome do Responsável" value={general?.responsibleName} />
                <DetailItem label="CPF do Responsável" value={general?.responsibleCpf} />
                <DetailItem label="Status" value={general?.status} />
            </FormSection>

            {/* Nova Seção de Contato */}
            <FormSection title="Contato">
                <DetailItem label="Nome do Contato" value={general?.contactName} />
                <DetailItem label="Cargo do Contato" value={general?.contactRole} />
                <DetailItem label="Email Responsável" value={general?.email} />
                <DetailItem label="Telefone Responsável" value={general?.phone} />
            </FormSection>

            {/* Seção de Endereço expandida */}
            <FormSection title="Endereço">
                <DetailItem label="CEP" value={address?.cep} />
                <DetailItem label="Logradouro" value={address?.street} />
                <DetailItem label="Complemento" value={address?.complement} />
                <DetailItem label="Bairro" value={address?.neighborhood} />
                <DetailItem label="Cidade" value={address?.city} />
                <DetailItem label="Estado" value={address?.state} />
            </FormSection>
        </>
    );
};

const ClientDetailsPage = ({ client, onBack, onEdit }) => {
    const { deleteClient } = useData();
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState('general');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef(null); 

    if (!client) { return <div className="p-8 text-center">Carregando cliente...</div>; }
    const clientName = client.general?.companyName || client.general?.holderName || "Cliente";

    const handleDelete = async () => {
        try {
            await confirm({ title: `Excluir ${clientName}?`, description: "Esta ação é permanente." });
            if (await deleteClient(client.id, clientName)) {
                onBack();
            }
        } catch (e) { /* Cancelado */ }
    };

    const handleGeneratePdf = async () => {
        const elementToPrint = printRef.current;
        if (!elementToPrint) return;

        setIsGeneratingPdf(true);
        const canvas = await html2canvas(elementToPrint, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const finalImgWidth = pdfWidth - 20;
        const finalImgHeight = finalImgWidth / ratio;

        pdf.addImage(imgData, 'PNG', 10, 10, finalImgWidth, finalImgHeight);
        pdf.save(`relatorio_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        setIsGeneratingPdf(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-2"><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar</button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{clientName}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? 'Gerando...' : <><DownloadIcon className="h-4 w-4 mr-2" />Baixar PDF</>}
                    </Button>
                    <Button variant="outline" onClick={() => onEdit(client, { initialTab: activeTab })}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button>
                    <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir</Button>
                </div>
            </header>
            
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
                    
                    <TabsContent value="general"><OverviewTab client={client} /></TabsContent>
                    
                    {/* [CORRIGIDO] A prop 'onEdit' foi passada para o ContractsTab */}
                    <TabsContent value="contracts"><ContractsTab client={client} onEdit={onEdit} /></TabsContent>
                    
                    <TabsContent value="beneficiaries"><BeneficiariesTab client={client} /></TabsContent>
                    <TabsContent value="documents"><DocumentsTab client={client} /></TabsContent>
                    <TabsContent value="history"><HistoryTab client={client} /></TabsContent>
                    <TabsContent value="internal"><InternalTab client={client} /></TabsContent>
                    <TabsContent value="cortex"><CortexTab client={client} /></TabsContent>
                </Tabs>
            </GlassPanel>
        </div>
    );
};

export default ClientDetailsPage;