import React, { useState } from 'react';
import { useConfirm } from '../../contexts/ConfirmContext';
import Button from '../Button';
import BeneficiaryModal from '../modals/BeneficiaryModal'; // CORREÇÃO: Importado como default
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../Icons';
import { formatDate } from '../../utils';

/**
 * Componente para gerenciar a lista de beneficiários dentro do formulário de cliente.
 * Recebe a lista atual de beneficiários e a função para atualizá-la no estado pai.
 */
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries, toast }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
    const confirm = useConfirm();

    /**
     * Chamado quando o modal de beneficiário é salvo.
     * Recebe os dados do modal e atualiza a lista no estado do componente pai.
     * @param {object} beneficiaryData - Os dados do beneficiário vindos do modal.
     */
    const handleSave = (beneficiaryData) => {
        // Se o beneficiário já tem um ID, edita. Senão, adiciona um novo.
        const updatedBeneficiaries = beneficiaryData.id
            ? (beneficiaries || []).map(b => (b.id === beneficiaryData.id ? beneficiaryData : b))
            : [...(beneficiaries || []), { ...beneficiaryData, id: `local_${Date.now()}` }];
        
        // Esta é a chamada crucial que envia a lista atualizada para o ClientFormPage
        setBeneficiaries(updatedBeneficiaries);
        
        toast({ title: "Beneficiário na Lista", description: `${beneficiaryData.name} foi ${beneficiaryData.id ? 'editado' : 'adicionado'} localmente.`, variant: 'violet' });
        
        // Fecha e reseta o modal
        setModalOpen(false);
        setCurrentBeneficiary(null);
    };

    /**
     * Remove um beneficiário da lista local.
     * @param {object} beneficiaryToRemove - O beneficiário a ser removido.
     */
    const handleRemove = async (beneficiaryToRemove) => {
        try {
            await confirm({ title: `Excluir ${beneficiaryToRemove.name}?`, description: "A alteração será aplicada ao salvar o cliente." });
            const updatedBeneficiaries = (beneficiaries || []).filter(b => b.id !== beneficiaryToRemove.id);
            setBeneficiaries(updatedBeneficiaries);
            toast({ title: "Removido da lista", description: `${beneficiaryToRemove.name} foi removido localmente.` });
        } catch (error) {
            // Ação cancelada pelo usuário
        }
    };

    /**
     * Abre o modal para adicionar um novo ou editar um beneficiário existente.
     * @param {object|null} beneficiary - O beneficiário a editar, ou null para adicionar um novo.
     */
    const handleOpenModal = (beneficiary = null) => {
        setCurrentBeneficiary(beneficiary ? { ...beneficiary } : null);
        setModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Gestão de Beneficiários</h3>
                <Button type="button" onClick={() => handleOpenModal()}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Adicionar Beneficiário
                </Button>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">
                {(beneficiaries || []).length === 0 
                    ? <p className="text-gray-500 text-center py-4">Nenhum beneficiário adicionado.</p>
                    : beneficiaries.map(ben => (
                        <div key={ben.id} className="flex justify-between items-center bg-white dark:bg-gray-800/70 p-3 rounded-md shadow-sm">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{ben.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ben.kinship} - Nasc: {formatDate(ben.dob)}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ben)}><PencilIcon className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/80 hover:text-red-500" onClick={() => handleRemove(ben)}><Trash2Icon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* O modal só é renderizado no DOM quando necessário */}
            {isModalOpen && (
                <BeneficiaryModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    beneficiary={currentBeneficiary}
                />
            )}
        </div>
    );
};

export default BeneficiariesForm;