import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import DetailItem from '../DetailItem'; // CORREÇÃO: Importado como default
import { formatDate, calculateAge } from '../../utils';

// CORREÇÃO: Alterado de "export const" para uma constante
const BeneficiaryViewModal = ({ isOpen, onClose, beneficiary }) => {
    if (!beneficiary) return null;

    const getImcDisplay = (weightStr, heightStr) => {
        const weight = parseFloat(weightStr);
        const height = parseFloat(heightStr);
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            return `${imcValue.toFixed(2)} - ${classification}`;
        }
        return 'N/A';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${beneficiary.name}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    <DetailItem label="Nome Completo" value={beneficiary.name} />
                    <DetailItem label="CPF" value={beneficiary.cpf} />
                    <DetailItem label="Parentesco" value={beneficiary.kinship} />
                    <DetailItem label="Data de Nascimento" value={formatDate(beneficiary.dob)} />
                    <DetailItem label="Idade" value={calculateAge(beneficiary.dob) !== null ? `${calculateAge(beneficiary.dob)} anos` : 'N/A'} />
                    <DetailItem label="Número da Carteirinha" value={beneficiary.idCardNumber} />
                    <DetailItem label="Peso" value={beneficiary.weight ? `${beneficiary.weight} kg` : 'N/A'} />
                    <DetailItem label="Altura" value={beneficiary.height ? `${beneficiary.height} cm` : 'N/A'} />
                    <DetailItem label="IMC" value={getImcDisplay(beneficiary.weight, beneficiary.height)} />
                </div>

                {beneficiary.credentials && (beneficiary.credentials.appLogin || beneficiary.credentials.appPassword) && (
                    <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10">
                        <h5 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-2">Credenciais do Beneficiário</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <DetailItem label="Login do App" value={beneficiary.credentials.appLogin} />
                            <DetailItem label="Senha do App" value={beneficiary.credentials.appPassword} isPassword />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    );
};

export default BeneficiaryViewModal;