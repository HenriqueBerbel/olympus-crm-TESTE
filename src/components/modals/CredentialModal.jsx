import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Button from '../Button';
import { useToast } from '../../contexts/NotificationContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs'; // Usando o componente de Tabs
import { GlobeIcon, MailIcon, SmartphoneIcon } from '../Icons'; // Supondo que você tenha esses ícones

const CredentialModal = ({ isOpen, onClose, onSave, credential }) => {
    const { toast } = useToast();

    const getInitialState = () => ({
        id: credential ? credential.id : null, // Preserva o ID ao editar
        title: '', createdEmail: '', createdEmailPassword: '',
        portalSite: '', portalPassword: '', portalLogin: '', portalUser: '',
        appLogin: '', appPassword: ''
    });

    const [formState, setFormState] = useState(getInitialState());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Popula o formulário se estiver em modo de edição, senão, reseta
            setFormState(credential ? { ...getInitialState(), ...credential } : getInitialState());
        } else {
            // Garante a limpeza do estado e do isSaving ao fechar
            setTimeout(() => {
                setFormState(getInitialState());
                setIsSaving(false);
            }, 200);
        }
    }, [isOpen, credential]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formState.title || formState.title.trim() === '') {
            toast({ title: "Campo Obrigatório", description: "O Título da credencial é obrigatório.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            // onSave é uma função síncrona que atualiza o estado do pai, mas usamos async/await por padrão
            await onSave(formState);
        } catch (error) {
            console.error("Falha ao salvar credencial no estado:", error);
            toast({ title: "Erro", description: "Não foi possível salvar a credencial.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // Requisitos principais aplicados: closeOnClickOutside e tamanho ajustado
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={credential ? "Editar Credencial" : "Adicionar Nova Credencial"} 
            size="2xl" 
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                    <div>
                        <Label htmlFor="cred-title">Título (Ex: Portal Amil Saúde, Acesso Dental Uni)</Label>
                        <Input id="cred-title" name="title" value={formState.title} onChange={handleChange} required placeholder="Identificação principal da credencial" disabled={isSaving}/>
                    </div>

                    {/* MELHORIA DE UI/UX: Abas para organizar os campos */}
                    <Tabs defaultValue="portal">
                        <TabsList>
                            <TabsTrigger value="portal"><GlobeIcon className="w-4 h-4 mr-2"/> Portal / Site</TabsTrigger>
                            <TabsTrigger value="email"><MailIcon className="w-4 h-4 mr-2"/> E-mail Criado</TabsTrigger>
                            <TabsTrigger value="app"><SmartphoneIcon className="w-4 h-4 mr-2"/> Aplicativo</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="portal" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="cred-portalSite">Site do Portal</Label><Input id="cred-portalSite" name="portalSite" value={formState.portalSite || ''} onChange={handleChange} placeholder="https://exemplo.com" disabled={isSaving}/></div>
                                <div><Label htmlFor="cred-portalUser">Usuário do Portal</Label><Input id="cred-portalUser" name="portalUser" value={formState.portalUser || ''} onChange={handleChange} disabled={isSaving}/></div>
                                <div><Label htmlFor="cred-portalLogin">Login do Portal</Label><Input id="cred-portalLogin" name="portalLogin" value={formState.portalLogin || ''} onChange={handleChange} disabled={isSaving}/></div>
                                <div><Label htmlFor="cred-portalPassword">Senha do Portal</Label><Input id="cred-portalPassword" type="text" name="portalPassword" value={formState.portalPassword || ''} onChange={handleChange} disabled={isSaving}/></div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="email" className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="cred-createdEmail">Email Criado</Label><Input id="cred-createdEmail" name="createdEmail" value={formState.createdEmail || ''} onChange={handleChange} disabled={isSaving}/></div>
                                <div><Label htmlFor="cred-createdEmailPassword">Senha do Email Criado</Label><Input id="cred-createdEmailPassword" type="text" name="createdEmailPassword" value={formState.createdEmailPassword || ''} onChange={handleChange} disabled={isSaving}/></div>
                            </div>
                        </TabsContent>

                        <TabsContent value="app" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="cred-appLogin">Login do App</Label><Input id="cred-appLogin" name="appLogin" value={formState.appLogin || ''} onChange={handleChange} disabled={isSaving}/></div>
                                <div><Label htmlFor="cred-appPassword">Senha do App</Label><Input id="cred-appPassword" type="text" name="appPassword" value={formState.appPassword || ''} onChange={handleChange} disabled={isSaving}/></div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                
                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Credencial'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CredentialModal;