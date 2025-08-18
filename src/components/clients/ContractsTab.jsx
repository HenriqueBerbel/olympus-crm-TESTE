import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../utils';

// Componentes (com importações corrigidas)
import GlassPanel from '../GlassPanel';
import Badge from '../Badge';
import EmptyState from '../EmptyState';
import Button from '../Button';
import DetailItem from '../DetailItem'; // CORREÇÃO: Importado como default (sem chaves)

// Ícones
import { ChevronLeftIcon, PlusCircleIcon } from '../Icons';

// Subcomponente interno para evitar múltiplos exports
const ContractDetails = ({ contract, clientType }) => {
    const { users } = useData();
    const boletoOwner = users.find(u => u.id === contract.boletoResponsibleId);

    return (
        <>
            {/* DADOS DO CONTRATO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                <DetailItem label="Plano Fechado (Operadora)" value={contract?.planOperator} />
                <DetailItem label="Nº da Proposta" value={contract?.proposalNumber} />
                <DetailItem label="Nº da Apólice/Contrato" value={contract?.policyNumber} />
                <DetailItem label="Categoria" value={contract?.planCategory} />
                <DetailItem label="Acomodação" value={contract?.accommodation} />
                <DetailItem label="Tipo de Plano" value={contract?.planTypes?.join(', ')} />
                <DetailItem label="Tipo de Contrato" value={clientType} />
                <DetailItem label="Valor do Contrato" value={contract?.contractValue} isCurrency />
                <DetailItem label="Valor da Taxa" value={contract?.feeValue} isCurrency />
                <DetailItem label="Forma de Pagamento" value={contract?.paymentMethod} />
                <DetailItem label="Data da Vigência" value={formatDate(contract?.effectiveDate)} />
                <DetailItem label="Vencimento Mensal" value={contract?.monthlyDueDate ? `Dia ${contract.monthlyDueDate}`: 'N/A'} />
                <DetailItem label="Data Envio do Boleto" value={formatDate(contract?.boletoSentDate)} />
                <DetailItem label="Responsável pelo Boleto" value={boletoOwner?.name} />
                <DetailItem label="Renovação de Contrato" value={formatDate(contract?.renewalDate)} />
                <DetailItem label="Status" value={contract?.status} />
                <DetailItem label="Plano Anterior" value={contract?.previousPlan} />
            </div>

            {/* CREDENCIAIS EM LISTA */}
            {(contract.credentialsList || []).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10">
                    <h5 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-2">Credenciais</h5>
                    <div className="space-y-4">
                        {(contract.credentialsList).map(cred => (
                            <GlassPanel key={cred.id} className="p-4 bg-gray-100 dark:bg-black/20">
                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{cred.title}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                                    <DetailItem label="Email Criado" value={cred.createdEmail} />
                                    <DetailItem label="Senha do Email" value={cred.createdEmailPassword} isPassword />
                                    <DetailItem label="Site do Portal" value={cred.portalSite} isLink />
                                    <DetailItem label="Senha do Portal" value={cred.portalPassword} isPassword />
                                    <DetailItem label="Login do Portal" value={cred.portalLogin} />
                                    <DetailItem label="Usuário do Portal" value={cred.portalUser} />
                                    <DetailItem label="Login do App" value={cred.appLogin} />
                                    <DetailItem label="Senha do App" value={cred.appPassword} isPassword />
                                </div>
                            </GlassPanel>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

// Componente principal da página
const ContractsTab = ({ client, onBack, onEdit }) => {
    const activeContract = (client.contracts || []).find(c => c.status === 'ativo');
    const inactiveContracts = (client.contracts || []).filter(c => c.status !== 'ativo');
    
    return (
        <div className="space-y-6">
            {activeContract ? (
                <GlassPanel className="p-6 border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contrato Ativo</h3>
                        <Badge variant="success">ATIVO</Badge>
                    </div>
                    <ContractDetails contract={activeContract} clientType={client.general?.clientType} />
                </GlassPanel>
            ) : (
                <EmptyState title="Nenhum Contrato Ativo" message="Não há um contrato marcado como ativo para este cliente." />
            )}

            {inactiveContracts.length > 0 && (
                <GlassPanel className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Histórico de Contratos</h3>
                    <div className="space-y-4">
                        {inactiveContracts.map(contract => (
                            <div key={contract.id} className="p-4 bg-gray-100 dark:bg-black/20 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{contract.planOperator} - {formatDate(contract.effectiveDate)}</h4>
                                    <Badge variant="secondary">ARQUIVADO</Badge>
                                </div>
                                <ContractDetails contract={contract} clientType={client.general?.clientType} />
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            )}
            
            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onBack}><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar para Cliente</Button>
                <Button onClick={() => onEdit(client, { initialTab: 'contracts' })}><PlusCircleIcon className="h-4 w-4 mr-2" /> Gerenciar Contratos</Button>
            </div>
        </div>
    );
};

export default ContractsTab;