import React, { useState } from 'react';

// Componentes e Utilitários
import Button from '../Button';
import ContractModal from '../modals/ContractModal';
import { cn, formatDate } from '../../utils';
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../Icons';
import { useConfirm } from '../../contexts/ConfirmContext';

const ContractsForm = ({ formData, setFormData }) => {
    // Estado para controlar o modal de contrato
    const [isContractModalOpen, setContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const confirm = useConfirm();

    // Funções que antes estavam na ClientFormPage, agora estão aqui
    const handleSaveContract = (contractData) => {
        const newContracts = [...(formData.contracts || [])];
        const index = newContracts.findIndex(c => c.id === contractData.id);

        // Se o novo contrato for ativo, desativa todos os outros
        if (contractData.status === 'ativo') {
            newContracts.forEach(c => {
                if (c.id !== contractData.id) c.status = 'inativo';
            });
        }

        if (index > -1) {
            // Editando um contrato existente
            newContracts[index] = contractData;
        } else {
            // Adicionando um novo contrato com um ID local temporário
            newContracts.push({ ...contractData, id: `local_${Date.now()}` });
        }
        
        // Atualiza o estado principal do formulário na página pai
        setFormData(prev => ({ ...prev, contracts: newContracts }));

        // Fecha o modal e limpa o estado de edição
        setContractModalOpen(false);
        setEditingContract(null);
    };

    const handleDeleteContract = async (contractId) => {
        try {
            await confirm({ title: "Excluir este contrato?", description: "Esta ação não pode ser desfeita. A exclusão só será efetivada ao salvar o cliente." });
            const newContracts = (formData.contracts || []).filter(c => c.id !== contractId);
            setFormData(prev => ({ ...prev, contracts: newContracts }));
        } catch (e) { /* Ação cancelada */ }
    };
    
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Gestão de Contratos</h3>
                <Button type="button" onClick={() => { setEditingContract(null); setContractModalOpen(true); }}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />Novo Contrato
                </Button>
            </div>
            <div className="space-y-4">
                {(formData.contracts || []).length === 0
                    ? <p className="text-gray-500 text-center py-4">Nenhum contrato adicionado.</p>
                    : (formData.contracts || []).map(contract => (
                        <div key={contract.id} className={cn("p-4 rounded-lg flex justify-between items-center", contract.status === 'ativo' ? 'bg-green-100/70 dark:bg-green-900/40 border-l-4 border-green-500' : 'bg-gray-100 dark:bg-black/20')}>
                            <div>
                                <p className="font-semibold">{contract.planOperator || 'Novo Contrato'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Nº: {contract.policyNumber || 'N/A'} - Início: {formatDate(contract.effectiveDate)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingContract(contract); setContractModalOpen(true); }}>
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteContract(contract.id)}>
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* O modal agora é controlado por este componente */}
            <ContractModal
                isOpen={isContractModalOpen}
                onClose={() => setContractModalOpen(false)}
                onSave={handleSaveContract}
                contract={editingContract}
                clientType={formData.general?.clientType}
            />
        </>
    );
};

export default ContractsForm;