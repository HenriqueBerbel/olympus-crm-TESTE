import React, { useState } from 'react';
import { useConfirm } from '../../contexts/ConfirmContext';
import Button from '../Button';
import BeneficiaryModal from '../modals/BeneficiaryModal'; // CORREÇÃO: Importado como default
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../Icons';
import { formatDate } from '../../utils';

// CORREÇÃO: Alterado de "export const" para uma constante simples
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries, toast }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
    const confirm = useConfirm();

    const handleSave = (beneficiaryData) => {
        const updatedBeneficiaries = beneficiaryData.id
            ? (beneficiaries || []).map(b => (b.id === beneficiaryData.id ? beneficiaryData : b))
            : [...(beneficiaries || []), { ...beneficiaryData, id: `local_${Date.now()}` }];
        
        setBeneficiaries(updatedBeneficiaries);
        toast({ title: "Beneficiário Atualizado", description: `${beneficiaryData.name} foi ${beneficiaryData.id ? 'editado' : 'adicionado'} à lista.`, variant: 'violet' });
        setModalOpen(false);
        setCurrentBeneficiary(null);
    };

    const handleRemove = async (beneficiaryToRemove) => {
        try {
            await confirm({ title: `Excluir Beneficiário ${beneficiaryToRemove.name}?`, description: "A remoção é permanente." });
            const updatedBeneficiaries = (beneficiaries || []).filter(b => b.id !== beneficiaryToRemove.id);
            setBeneficiaries(updatedBeneficiaries);
            toast({ title: "Removido da lista", description: `${beneficiaryToRemove.name} foi removido.` });
        } catch (error) {
            // Ação cancelada pelo usuário, não faz nada.
        }
    };

    const handleOpenModal = (beneficiary = null) => {
        setCurrentBeneficiary(beneficiary ? { ...beneficiary } : null);
        setModalOpen(true);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Beneficiários</h3>
                <Button type="button" onClick={() => handleOpenModal()}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Beneficiário</Button>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">
                {(beneficiaries || []).length === 0 ?
                    <p className="text-gray-500 text-center py-4">Nenhum beneficiário adicionado.</p>
                    : beneficiaries.map(ben => (
                        <div key={ben.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{ben.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ben.kinship} - {formatDate(ben.dob)}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ben)}><PencilIcon className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleRemove(ben)}><Trash2Icon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
            </div>
            <BeneficiaryModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                beneficiary={currentBeneficiary}
            />
        </div>
    );
};

export default BeneficiariesForm;