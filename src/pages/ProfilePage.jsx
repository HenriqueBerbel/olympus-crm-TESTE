import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Hooks
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { usePreferences } from '../contexts/PreferencesContext';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Input from '../components/Input';
import Label from '../components/Label';
import Switch from '../components/Switch';
import { Avatar } from '../components/Avatar'; // <-- CORREÇÃO 1: Import simplificado

// Ícones e Utilitários
import { CameraIcon, UsersIcon, TargetIcon, CheckSquareIcon, HistoryIcon } from '../components/Icons';
import { cn, formatDateTime } from '../utils';

// Subcomponente para os Cards de Métrica
const MetricCard = ({ value, label, icon }) => (
    <GlassPanel className="p-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    </GlassPanel>
);

const ProfilePage = () => {
    const { user, updateUserProfile, updateUserPassword } = useAuth();
    const { clients, leads, tasks, timeline } = useData();
    const { preferences, updatePreferences } = usePreferences();
    const { toast } = useToast();
    const storage = getStorage();
    const avatarInputRef = useRef(null);

    // Estados do formulário e da UI
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) setName(user.name);
    }, [user]);

    // Lógica para o upload da foto de perfil
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;
        if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
            toast({ title: "Arquivo muito grande", description: "Por favor, escolha uma imagem menor que 2MB.", variant: "destructive" });
            return;
        }
        setIsUploading(true);
        const storageRef = ref(storage, `avatars/${user.uid}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateUserProfile(user.uid, { avatar: downloadURL });
            toast({ title: "Sucesso!", description: "Sua foto de perfil foi atualizada." });
        } catch (error) {
            console.error("Erro no upload: ", error);
            toast({ title: "Erro no Upload", description: "Não foi possível enviar sua imagem.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Lógica para salvar o nome do perfil
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const success = await updateUserProfile(user.uid, { name });
        toast({ title: success ? "Sucesso" : "Erro", description: success ? "Seu nome foi atualizado." : "Não foi possível atualizar o nome.", variant: success ? 'default' : 'destructive' });
    };

    // Lógica para alterar a senha
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: 'destructive' }); return; }
        if (newPassword.length < 6) { toast({ title: "Erro", description: "A nova senha deve ter no mínimo 6 caracteres.", variant: 'destructive' }); return; }
        
        const result = await updateUserPassword(currentPassword, newPassword);
        if (result === true) {
            toast({ title: "Sucesso", description: "Sua senha foi atualizada." });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } else {
            let errorMessage = "Não foi possível atualizar a senha.";
            if (result === 'auth/wrong-password') errorMessage = "A senha atual está incorreta.";
            toast({ title: "Erro", description: errorMessage, variant: 'destructive' });
        }
    };
    
    // Lógica para salvar as preferências de interface
    const handlePreferenceChange = async (key, value) => {
        await updatePreferences({ [key]: value });
    };

    // Calcula as métricas pessoais do usuário
    const userMetrics = useMemo(() => {
        const safeClients = Array.isArray(clients) ? clients : [];
        const safeLeads = Array.isArray(leads) ? leads : [];
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        if (!user?.uid) return { clients: 0, leads: 0, tasks: 0 };
        return {
            clients: safeClients.filter(c => c.internal?.brokerId === user.uid).length,
            leads: safeLeads.filter(l => l.ownerId === user.uid).length,
            tasks: safeTasks.filter(t => t.assignedTo === user.uid && t.status !== 'Concluída').length,
        };
    }, [clients, leads, tasks, user]);
    
    // Filtra o timeline para mostrar apenas as atividades do usuário logado
    const userTimeline = useMemo(() => 
        (Array.isArray(timeline) ? timeline : []).filter(item => item.userId === user?.uid).slice(0, 5),
        [timeline, user]
    );

    return (
        <div className={cn("p-4 sm:p-6 lg:p-8", preferences.uppercaseMode && "uppercase")}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Meu Perfil</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Coluna da Esquerda: Perfil e Métricas --- */}
                <div className="lg:col-span-1 space-y-8">
                    <GlassPanel className="p-6 flex flex-col items-center text-center">
                        <div className="relative group">
                            {/* --- CORREÇÃO 2: Uso do novo componente Avatar --- */}
                            <Avatar 
                                src={user?.avatar} 
                                fallbackText={user?.name?.[0] || '?'} 
                                alt={user?.name}
                                className="w-32 h-32 text-5xl border-4 border-white dark:border-gray-800 shadow-lg" 
                            />
                            <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <CameraIcon className="w-8 h-8" />
                            </button>
                            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" className="hidden" disabled={isUploading} />
                        </div>
                        {isUploading && <p className="mt-4 text-sm text-cyan-500 animate-pulse">Enviando imagem...</p>}
                        <h3 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">{name}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{user?.role?.name || user?.role}</p>
                    </GlassPanel>

                    <MetricCard value={userMetrics.clients} label="Clientes na Carteira" icon={<UsersIcon className="w-6 h-6 text-cyan-500"/>} />
                    <MetricCard value={userMetrics.leads} label="Leads Ativos" icon={<TargetIcon className="w-6 h-6 text-cyan-500"/>} />
                    <MetricCard value={userMetrics.tasks} label="Tarefas Pendentes" icon={<CheckSquareIcon className="w-6 h-6 text-cyan-500"/>} />
                </div>

                {/* --- Coluna da Direita: Configurações e Atividade --- */}
                <div className="lg:col-span-2 space-y-8">
                    <GlassPanel className="p-6">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Informações e Segurança</h3>
                        <form onSubmit={handleProfileUpdate} className="space-y-4 mb-8">
                             <div><Label>Nome Completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                             <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
                             <div className="flex justify-end"><Button type="submit">Salvar Nome</Button></div>
                        </form>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4 border-t border-gray-200 dark:border-white/10 pt-6">
                            <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200">Alterar Senha</h4>
                            <div><Label>Senha Atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                            <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                            <div><Label>Confirmar Nova Senha</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                            <div className="flex justify-end"><Button type="submit">Alterar Senha</Button></div>
                        </form>
                    </GlassPanel>
                    
                     <GlassPanel className="p-6">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Minha Atividade Recente</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {userTimeline.length > 0 ? userTimeline.map(log => (
                                <div key={log.id} className="flex items-start gap-3"><HistoryIcon className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" /><div><p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p><p className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</p></div></div>
                            )) : <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade registrada ainda.</p>}
                        </div>
                    </GlassPanel>

                    <GlassPanel className="p-6">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Preferências de Interface</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Modo Contorno</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Exibe uma borda em campos de informação para melhor visualização.</p>
                                </div>
                                <Switch checked={preferences?.contourMode || false} onChange={(value) => handlePreferenceChange('contourMode', value)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Modo Maiúsculas</Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Exibe textos e campos do sistema em CAIXA ALTA.</p>
                                </div>
                                <Switch checked={preferences?.uppercaseMode || false} onChange={(value) => handlePreferenceChange('uppercaseMode', value)} />
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;