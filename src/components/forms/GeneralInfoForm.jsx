import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes
import FormSection from './FormSection';
import Label from '../Label';
import { Select, SelectItem } from '../Select'; // [CORREÇÃO] Importando o novo componente
import Input from '../Input';

// Utilitários
import { maskCNPJ, maskCPF, maskCEP } from '../../utils';

const GeneralInfoForm = ({ formData, handleChange, errors }) => {
    const clientType = formData?.general?.clientType;
    const kinshipOptions = ["Titular", "Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Cônjuge"];

    // [MELHORIA] Função para simplificar a criação dos Selects
    const handleSelectChange = (name, value) => {
        handleChange({ target: { name, value } });
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <Label>Tipo de Plano</Label>
                    {/* [CORREÇÃO] Usando o novo componente Select */}
                    <Select 
                        name="general.clientType" 
                        value={clientType || ''} 
                        onValueChange={(value) => handleSelectChange('general.clientType', value)}
                        placeholder="Selecione..."
                    >
                        <SelectItem value="PME">PME</SelectItem>
                        <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                        <SelectItem value="Adesão">Adesão</SelectItem>
                    </Select>
                </div>
            </div>

            {/* [ANIMAÇÃO] AnimatePresence garante a animação de entrada e saída dos formulários */}
            <AnimatePresence mode="wait">
                {clientType && (
                    <motion.div
                        key={clientType} // A 'key' garante que o React entenda que o componente está mudando
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* --- Formulário para PME --- */}
                        {clientType === 'PME' && (
                            <div className="space-y-8">
                                <FormSection title="Dados da Empresa" cols={3}>
                                    <div><Label>Nome da Empresa</Label><Input name="general.companyName" value={formData.general?.companyName || ''} onChange={handleChange} /></div>
                                    <div>
                                        <Label>Status</Label>
                                        <Select name="general.status" value={formData.general?.status || 'Ativo'} onValueChange={(v) => handleSelectChange('general.status', v)}>
                                            <SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem>
                                        </Select>
                                    </div>
                                    <div><Label>CNPJ</Label><Input name="general.cnpj" value={formData.general?.cnpj || ''} onChange={handleChange} mask={maskCNPJ} error={errors?.cnpj} maxLength="18" /></div>
                                    <div><Label>Nome do Responsável</Label><Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} /></div>
                                    <div><Label>CPF do Responsável</Label><Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" /></div>
                                </FormSection>
                                <FormSection title="Contato" cols={3}>
                                    <div><Label>Email Responsável</Label><Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} /></div>
                                    <div><Label>Telefone Responsável</Label><Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} /></div>
                                    <div></div> {/* Espaçador */}
                                    <div><Label>Nome do Contato</Label><Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} /></div>
                                    <div><Label>Cargo do Contato</Label><Input name="general.contactRole" value={formData.general?.contactRole || ''} onChange={handleChange} /></div>
                                    <div><Label>Telefone do Contato</Label><Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} /></div>
                                </FormSection>
                            </div>
                        )}

                        {/* --- Formulário para Pessoa Física / Adesão --- */}
                        {(clientType === 'Pessoa Física' || clientType === 'Adesão') && (
                           <div className="space-y-8">
                                <FormSection title="Dados do Titular" cols={3}>
                                    <div><Label>Nome Titular</Label><Input name="general.holderName" value={formData.general?.holderName || ''} onChange={handleChange} /></div>
                                    <div>
                                        <Label>Status</Label>
                                        <Select name="general.status" value={formData.general?.status || 'Ativo'} onValueChange={(v) => handleSelectChange('general.status', v)}>
                                            <SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem>
                                        </Select>
                                    </div>
                                    <div><Label>CPF Titular</Label><Input name="general.holderCpf" value={formData.general?.holderCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.holderCpf} maxLength="14" /></div>
                                </FormSection>
                                <FormSection title="Contato e Vínculo" cols={3}>
                                    <div><Label>Email Responsável</Label><Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} /></div>
                                    <div><Label>Telefone Responsável</Label><Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} /></div>
                                    {clientType === 'Pessoa Física' && (
                                         <div>
                                            <Label>Vínculo do Titular</Label>
                                            <Select name="general.kinship" value={formData.general?.kinship || ''} onValueChange={(v) => handleSelectChange('general.kinship', v)} placeholder="Selecione...">
                                                {kinshipOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </Select>
                                        </div>
                                    )}
                                </FormSection>
                           </div>
                        )}
                        
                        {/* Seção de Endereço (Comum a todos) */}
                        <FormSection title="Endereço" cols={3}>
                            <div><Label>CEP</Label><Input name="address.cep" value={formData.address?.cep || ''} onChange={handleChange} mask={maskCEP} maxLength="9" /></div>
                            <div className="md:col-span-2"><Label>Logradouro</Label><Input name="address.street" value={formData.address?.street || ''} onChange={handleChange} /></div>
                            <div><Label>Complemento</Label><Input name="address.complement" value={formData.address?.complement || ''} onChange={handleChange} /></div>
                            <div><Label>Bairro</Label><Input name="address.neighborhood" value={formData.address?.neighborhood || ''} onChange={handleChange} /></div>
                            <div><Label>Cidade</Label><Input name="address.city" value={formData.address?.city || ''} onChange={handleChange} /></div>
                            <div><Label>Estado</Label><Input name="address.state" value={formData.address?.state || ''} onChange={handleChange} /></div>
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GeneralInfoForm;