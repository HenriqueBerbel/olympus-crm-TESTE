import React from 'react';
import FormSection from './FormSection'; // CORREÇÃO: Importado como default
import Label from '../Label';
import Select from '../Select';
import Input from '../Input';
import { maskCNPJ, maskCPF, maskCEP } from '../../utils';

// CORREÇÃO: Alterado de "export const" para uma constante simples
const GeneralInfoForm = ({ formData, handleChange, errors }) => {
    const clientType = formData?.general?.clientType;
    const kinshipOptions = ["Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Cônjuge"];

    return (
        <>
            {/* Seção Principal que sempre aparece */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <Label>Tipo de Plano</Label>
                    <Select name="general.clientType" value={clientType || ''} onChange={handleChange}>
                        <option value="">Selecione...</option>
                        <option value="PME">PME</option>
                        <option value="Pessoa Física">Pessoa Física</option>
                        <option value="Adesão">Adesão</option>
                    </Select>
                </div>
            </div>

            {/* Renderização condicional baseada no Tipo de Plano */}
            {clientType && (
                <>
                    {/* --- Formulário para PME --- */}
                    {clientType === 'PME' && (
                        <>
                            <FormSection title="Dados da Empresa" cols={3}>
                                <div>
                                    <Label>Nome da Empresa</Label>
                                    <Input name="general.companyName" value={formData.general?.companyName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CNPJ</Label>
                                    <Input name="general.cnpj" value={formData.general?.cnpj || ''} onChange={handleChange} mask={maskCNPJ} error={errors?.cnpj} maxLength="18" />
                                    {errors?.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
                                </div>
                                <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                    {errors?.responsibleCpf && <p className="text-xs text-red-500 mt-1">{errors.responsibleCpf}</p>}
                                </div>
                            </FormSection>
                            <FormSection title="Contato" cols={3}>
                                <div>
                                    <Label>Responsável</Label>
                                    <Select name="general.responsibleStatus" value={formData.general?.responsibleStatus || 'Beneficiário'} onChange={handleChange}>
                                        <option>Beneficiário</option>
                                        <option>Não Beneficiário</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} error={errors?.email} />
                                </div>
                                <div>
                                    <Label>Telefone Responsável</Label>
                                    <Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome do Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Cargo do Contato</Label>
                                    <Input name="general.contactRole" value={formData.general?.contactRole || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone do Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                            </FormSection>
                        </>
                    )}

                    {/* --- Formulário para Pessoa Física --- */}
                    {clientType === 'Pessoa Física' && (
                        <>
                            <FormSection title="Dados do Titular" cols={3}>
                                <div>
                                    <Label>Nome Titular</Label>
                                    <Input name="general.holderName" value={formData.general?.holderName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CPF Titular</Label>
                                    <Input name="general.holderCpf" value={formData.general?.holderCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.holderCpf} maxLength="14" />
                                </div>
                                <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                </div>
                            </FormSection>
                            <FormSection title="Contato e Vínculo" cols={3}>
                                <div>
                                    <Label>Responsável</Label>
                                    <Select name="general.responsibleStatus" value={formData.general?.responsibleStatus || 'Beneficiário'} onChange={handleChange}>
                                        <option>Beneficiário</option>
                                        <option>Não Beneficiário</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Responsável</Label>
                                    <Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Vínculo do Titular</Label>
                                    <Select name="general.kinship" value={formData.general?.kinship || ''} onChange={handleChange}>
                                        <option value="">Selecione...</option>
                                        {kinshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </Select>
                                </div>
                            </FormSection>
                        </>
                    )}

                    {/* --- Formulário para Adesão --- */}
                    {clientType === 'Adesão' && (
                        <>
                            <FormSection title="Dados do Titular" cols={3}>
                                <div>
                                    <Label>Nome Titular</Label>
                                    <Input name="general.holderName" value={formData.general?.holderName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CPF Titular</Label>
                                    <Input name="general.holderCpf" value={formData.general?.holderCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.holderCpf} maxLength="14" />
                                </div>
                                <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                </div>
                            </FormSection>
                            <FormSection title="Dados de Adesão e Contato" cols={3}>
                                <div>
                                    <Label>Profissão</Label>
                                    <Input name="general.profession" value={formData.general?.profession || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Sindicato Filiado</Label>
                                    <Input name="general.union" value={formData.general?.union || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Administradora</Label>
                                    <Input name="general.administrator" value={formData.general?.administrator || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                            </FormSection>
                        </>
                    )}
                    
                    {/* Seção de Endereço (Comum a todos) */}
                    <FormSection title="Endereço" cols={3}>
                        <div>
                            <Label>CEP</Label>
                            <Input name="address.cep" value={formData.address?.cep || ''} onChange={handleChange} mask={maskCEP} maxLength="9" />
                        </div>
                        <div>
                            <Label>Logradouro</Label>
                            <Input name="address.street" value={formData.address?.street || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Complemento</Label>
                            <Input name="address.complement" value={formData.address?.complement || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Bairro</Label>
                            <Input name="address.neighborhood" value={formData.address?.neighborhood || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Cidade</Label>
                            <Input name="address.city" value={formData.address?.city || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Estado</Label>
                            <Input name="address.state" value={formData.address?.state || ''} onChange={handleChange} />
                        </div>
                    </FormSection>
                </>
            )}
        </>
    );
};

export default GeneralInfoForm;