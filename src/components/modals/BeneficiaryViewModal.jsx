import React, { useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import DetailItem from '../DetailItem';
import { formatDate, calculateAge } from '../../utils';

const BeneficiaryViewModal = ({ isOpen, onClose, beneficiary }) => {
    // A guarda inicial previne erros se o beneficiário ainda não foi carregado.
    if (!beneficiary) return null;

    // MELHORIA: useMemo para calcular a idade apenas quando a data de nascimento mudar.
    const ageDisplay = useMemo(() => {
        const age = calculateAge(beneficiary.dob);
        return age !== null ? `${age} anos` : 'N/A';
    }, [beneficiary.dob]);

    // MELHORIA: useMemo para calcular o IMC apenas quando peso ou altura mudarem.
    const imcDisplay = useMemo(() => {
        const weight = parseFloat(beneficiary.weight);
        const height = parseFloat(beneficiary.height);

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue < 25) classification = 'Normal';
            else if (imcValue < 30) classification = 'Sobrepeso';
            else classification = 'Obesidade';
            return `${imcValue.toFixed(2)} - ${classification}`;
        }
        return 'N/A';
    }, [beneficiary.weight, beneficiary.height]);

    return (
        // MELHORIA: Adicionado closeOnClickOutside para consistência
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Detalhes de ${beneficiary.name}`}
            closeOnClickOutside={false}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    <DetailItem label="Nome Completo" value={beneficiary.name} />
                    <DetailItem label="CPF" value={beneficiary.cpf} />
                    <DetailItem label="Parentesco" value={beneficiary.kinship} />
                    <DetailItem label="Data de Nascimento" value={formatDate(beneficiary.dob)} />
                    <DetailItem label="Idade" value={ageDisplay} />
                    <DetailItem label="Número da Carteirinha" value={beneficiary.idCardNumber} />
                    <DetailItem label="Peso" value={beneficiary.weight ? `${beneficiary.weight} kg` : 'N/A'} />
                    <DetailItem label="Altura" value={beneficiary.height ? `${beneficiary.height} cm` : 'N/A'} />
                    <DetailItem label="IMC" value={imcDisplay} />
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