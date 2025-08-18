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

// Subcomponente interno para a "Visão Geral"
const OverviewTab = ({ client }) => {
    const clientType = client?.general?.clientType;
    return (
        <>
            {clientType === 'PME' && (
                <FormSection title="Dados da Empresa">
                    <DetailItem label="Nome da Empresa" value={client.general?.companyName} />
                    <DetailItem label="CNPJ" value={client.general?.cnpj} />
                    <DetailItem label="Status" value={client.general?.status} />
                </FormSection>
            )}
            {/* Adicione outras visualizações para outros tipos de cliente se necessário */}
            <FormSection title="Endereço">
                <DetailItem label="CEP" value={client.address?.cep} />
                <DetailItem label="Logradouro" value={client.address?.street} />
            </FormSection>
        </>
    );
};

const ClientDetailsPage = ({ client, onBack, onEdit }) => {
    const { deleteClient } = useData();
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState('general');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef(null); // Referência para a área que será impressa

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

    // --- NOVA LÓGICA PARA GERAR O PDF ---
    const handleGeneratePdf = async () => {
        const elementToPrint = printRef.current;
        if (!elementToPrint) return;

        setIsGeneratingPdf(true);

        const canvas = await html2canvas(elementToPrint, {
            scale: 2, // Aumenta a resolução da "foto" para melhor qualidade
            useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Define as dimensões do PDF (A4) e da imagem
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const finalImgWidth = pdfWidth - 20; // Largura da imagem com margens
        const finalImgHeight = finalImgWidth / ratio;

        let position = 10; // Posição inicial com margem superior
        pdf.addImage(imgData, 'PNG', 10, position, finalImgWidth, finalImgHeight);
        
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
                    {/* --- NOVO BOTÃO DE DOWNLOAD PDF --- */}
                    <Button variant="outline" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? 'Gerando...' : <><DownloadIcon className="h-4 w-4 mr-2" />Baixar PDF</>}
                    </Button>
                    <Button variant="outline" onClick={() => onEdit(client, { initialTab: activeTab })}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button>
                    <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir</Button>
                </div>
            </header>
            
            {/* Adicionamos a `ref` ao GlassPanel que envolve o conteúdo */}
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
                    <TabsContent value="contracts"><ContractsTab client={client} /></TabsContent>
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