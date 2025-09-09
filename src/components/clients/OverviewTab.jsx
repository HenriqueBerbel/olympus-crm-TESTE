import React from 'react';

// Componentes
import FormSection from '../forms/FormSection';
import DetailItem from '../DetailItem';

const OverviewTab = ({ client }) => {
    const { general, address } = client || {};
    const clientType = general?.clientType;

    return (
        <>
            {/* Seção de Dados da Empresa */}
            <FormSection title="Dados da Empresa">
                {clientType === 'PME' && <DetailItem label="Nome da Empresa" value={general?.companyName} />}
                {clientType === 'PME' && <DetailItem label="CNPJ" value={general?.cnpj} />}
                <DetailItem label="Nome do Responsável" value={general?.responsibleName} />
                <DetailItem label="CPF do Responsável" value={general?.responsibleCpf} />
                <DetailItem label="Status" value={general?.status} />
            </FormSection>

            {/* Seção de Contato */}
            <FormSection title="Contato">
                <DetailItem label="Nome do Contato" value={general?.contactName} />
                <DetailItem label="Cargo do Contato" value={general?.contactRole} />
                <DetailItem label="Email Responsável" value={general?.email} />
                <DetailItem label="Telefone Responsável" value={general?.phone} />
            </FormSection>

            {/* Seção de Endereço */}
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

export default OverviewTab;