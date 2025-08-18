import React, { useState } from 'react';
import Button from '../Button';
import BeneficiaryViewModal from '../modals/BeneficiaryViewModal'; // CORREÇÃO: Importado como default (sem chaves)
import EmptyState from '../EmptyState';
import { EyeIcon } from '../Icons';
import { formatDate } from '../../utils';

const BeneficiariesTab = ({ client }) => {
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const beneficiaries = client?.beneficiaries || [];

    const handleViewDetails = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setViewModalOpen(true);
    };

    if (beneficiaries.length === 0) {
        return <EmptyState title="Nenhum Beneficiário Cadastrado" message="Você pode adicionar beneficiários na tela de edição do cliente." />;
    }

    return (
        <>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {beneficiaries.map(ben => (
                    <div key={ben.id || ben.name} className="flex justify-between items-center bg-gray-100 dark:bg-black/20 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{ben.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Parentesco: {ben.kinship} | Nascimento: {formatDate(ben.dob)}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(ben)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Ver Detalhes
                        </Button>
                    </div>
                ))}
            </div>

            {/* O modal é renderizado aqui mas só fica visível quando o estado 'isOpen' é true */}
            <BeneficiaryViewModal
                isOpen={isViewModalOpen}
                onClose={() => setViewModalOpen(false)}
                beneficiary={selectedBeneficiary}
            />
        </>
    );
};

export default BeneficiariesTab;