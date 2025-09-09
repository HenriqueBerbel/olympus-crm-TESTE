import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Utilitários
import { useConfirm } from '../../contexts/ConfirmContext';
import { formatDate } from '../../utils';

// Componentes
import Button from '../Button';
import BeneficiaryModal from '../modals/BeneficiaryModal';
import { PlusCircleIcon, PencilIcon, Trash2Icon } from '../Icons';

// ========================================================================
//          *** VARIANTES DE ANIMAÇÃO ***
// ========================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};


// ========================================================================
//          *** FORMULÁRIO DE BENEFICIÁRIOS ***
// ========================================================================
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries, toast }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
    const confirm = useConfirm();

    const handleSave = (beneficiaryData) => {
        const updatedBeneficiaries = beneficiaryData.id
            ? (beneficiaries || []).map(b => (b.id === beneficiaryData.id ? beneficiaryData : b))
            : [...(beneficiaries || []), { ...beneficiaryData, id: `local_${Date.now()}` }];
        
        setBeneficiaries(updatedBeneficiaries);
        
        toast({ title: "Beneficiário na Lista", description: `${beneficiaryData.name} foi ${beneficiaryData.id ? 'editado' : 'adicionado'} localmente.`, variant: 'violet' });
        
        setModalOpen(false);
        setCurrentBeneficiary(null);
    };

    const handleRemove = async (beneficiaryToRemove) => {
        try {
            await confirm({ title: `Excluir ${beneficiaryToRemove.name}?`, description: "A alteração será aplicada ao salvar o cliente." });
            const updatedBeneficiaries = (beneficiaries || []).filter(b => b.id !== beneficiaryToRemove.id);
            setBeneficiaries(updatedBeneficiaries);
        } catch (error) { /* Ação cancelada */ }
    };

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
                {/* [ANIMAÇÃO] Usamos AnimatePresence para animar a entrada e saída dos itens da lista */}
                <AnimatePresence>
                    {(beneficiaries || []).length === 0 
                        ? (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-gray-500 text-center py-4"
                            >
                                Nenhum beneficiário adicionado.
                            </motion.p>
                        )
                        : (beneficiaries || []).map(ben => (
                            // [ANIMAÇÃO] Cada item da lista agora é um motion.div
                            <motion.div 
                                key={ben.id} 
                                layout // A mágica que faz a lista se reorganizar suavemente
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                whileHover={{ scale: 1.02 }}
                                className="flex justify-between items-center bg-white dark:bg-gray-800/70 p-3 rounded-md shadow-sm"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{ben.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{ben.kinship} - Nasc: {formatDate(ben.dob)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ben)}><PencilIcon className="h-4 w-4" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/80 hover:text-red-500" onClick={() => handleRemove(ben)}><Trash2Icon className="h-4 w-4" /></Button>
                                </div>
                            </motion.div>
                        ))
                    }
                </AnimatePresence>
            </div>

            {/* [CORREÇÃO] O modal agora é renderizado fora do condicional, 
                e seu estado de aberto/fechado é controlado pela prop 'isOpen'.
                Isso permite que a animação de saída funcione. */}
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