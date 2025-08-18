// src/pages/ImportClientsPage.jsx

import React, { useState } from 'react';
import Papa from 'papaparse';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Select from '../components/Select';
import { ChevronLeftIcon, UploadCloudIcon, ArrowRightIcon, UsersIcon } from '../components/Icons';

const ImportClientsPage = ({ onBack }) => {
    const { addClient } = useData();
    const { toast } = useToast();
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapeamento, 3: Importação
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [isImporting, setIsImporting] = useState(false);

    // Campos do seu Firestore que podem ser importados
    const firestoreFields = [
        { key: 'general.holderName', label: 'Nome do Titular (PF/Adesão)' },
        { key: 'general.companyName', label: 'Nome da Empresa (PME)' },
        { key: 'general.email', label: 'Email' },
        { key: 'general.phone', label: 'Telefone' },
        { key: 'general.cnpj', label: 'CNPJ (PME)' },
        { key: 'general.holderCpf', label: 'CPF (PF/Adesão)' },
        { key: 'general.status', label: 'Status (Ativo/Inativo)' },
        { key: 'general.clientType', label: 'Tipo de Plano (PME, Pessoa Física, Adesão)' },
    ];

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setHeaders(results.meta.fields);
                    setFileData(results.data);
                    setStep(2); // Avança para o passo de mapeamento
                }
            });
        }
    };

    const handleMappingChange = (csvHeader, firestoreKey) => {
        setMapping(prev => ({ ...prev, [csvHeader]: firestoreKey }));
    };

    const handleImport = async () => {
        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of fileData) {
            const newClientData = { general: {} };
            
            for (const csvHeader in mapping) {
                const firestoreKey = mapping[csvHeader];
                if (firestoreKey && row[csvHeader]) {
                    const keys = firestoreKey.split('.');
                    if (keys.length > 1) {
                        newClientData[keys[0]] = { ...newClientData[keys[0]], [keys[1]]: row[csvHeader] };
                    }
                }
            }
            
            // Garante que dados essenciais tenham um valor padrão
            if (!newClientData.general.status) newClientData.general.status = 'Ativo';
            if (!newClientData.general.clientType) newClientData.general.clientType = 'PME';

            try {
                await addClient(newClientData);
                successCount++;
            } catch (e) {
                errorCount++;
            }
        }
        
        toast({ title: "Importação Concluída!", description: `${successCount} clientes importados com sucesso. ${errorCount} falharam.` });
        setIsImporting(false);
        onBack(); // Volta para a lista de clientes
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4">
                <ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar para Clientes
            </button>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Importar Clientes</h2>

            {step === 1 && (
                <GlassPanel className="p-8 text-center">
                    <UploadCloudIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Envie sua planilha</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Selecione um arquivo CSV com os dados dos seus clientes.</p>
                    <div className="mt-6">
                        <Button onClick={() => document.getElementById('csv-importer').click()}>
                            <UsersIcon className="h-5 w-5 mr-2" /> Escolher Arquivo
                        </Button>
                        <input type="file" id="csv-importer" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </div>
                </GlassPanel>
            )}

            {step === 2 && (
                <GlassPanel className="p-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">2. Mapeie as Colunas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Combine as colunas da sua planilha com os campos do sistema.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-6 border-t pt-6">
                        {headers.map(header => (
                            <div key={header} className="flex items-center justify-between">
                                <label className="font-bold text-gray-700 dark:text-gray-300">{header}</label>
                                <Select onChange={(e) => handleMappingChange(header, e.target.value)} className="w-1/2">
                                    <option value="">Ignorar esta coluna</option>
                                    {firestoreFields.map(field => (
                                        <option key={field.key} value={field.key}>{field.label}</option>
                                    ))}
                                </Select>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-end mt-8">
                        <Button onClick={handleImport} disabled={Object.keys(mapping).length === 0}>
                            Importar Clientes <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </GlassPanel>
            )}
        </div>
    );
};

export default ImportClientsPage;