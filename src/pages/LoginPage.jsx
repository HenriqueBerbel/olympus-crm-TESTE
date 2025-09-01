import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import Label from '../components/Label';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogInIcon } from '../components/Icons';

const LoginPage = () => {
    const { login } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const db = getFirestore();

    // Efeito para buscar a URL do logo ao carregar a página
    useEffect(() => {
        const fetchCompanyProfile = async () => {
            try {
                const profileDoc = await getDoc(doc(db, "company_profile", "main"));
                if (profileDoc.exists() && profileDoc.data().logoUrl) {
                    setLogoUrl(profileDoc.data().logoUrl);
                }
            } catch (error) {
                console.error("Erro ao buscar perfil da empresa:", error);
            }
        };
        fetchCompanyProfile();
    }, [db]);

    // Função para traduzir os erros do Firebase
    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'O formato do e-mail é inválido.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'E-mail ou senha incorretos.';
            default:
                return 'Ocorreu um erro. Tente novamente.';
        }
    };

    // Função para submeter o formulário de login
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Campos Vazios", description: "Por favor, preencha o e-mail e a senha.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const result = await login(email, password);
        if (!result.success) {
            const message = getFirebaseErrorMessage(result.code);
            toast({ title: "Falha na Autenticação", description: message, variant: "destructive" });
            setLoading(false); // Só desativa o loading se houver erro
        }
        // Se o login for bem-sucedido, o App.jsx vai redirecionar, então não precisa desativar o loading
    };

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop)' }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg p-8 md:p-10 rounded-2xl border border-white/20 shadow-2xl">
                    <div className="text-center mb-8">
                        {logoUrl && (
                            <img 
                                src={logoUrl} 
                                alt="Logo da Empresa" 
                                className="mx-auto h-16 w-auto mb-4 object-contain"
                                // Esconde a imagem se ela não carregar, para não mostrar um ícone quebrado
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <h1 className="text-4xl font-bold text-white">OLYMPUS X</h1>
                        <p className="text-gray-300 mt-2">Acesso ao Ecossistema de Gestão</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="email" className="text-gray-200">Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="mt-2"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-gray-200">Senha</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="mt-2"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" className="w-full !h-12 !text-base font-semibold" disabled={loading}>
                            {loading ? (
                                <span className="animate-pulse">Autenticando...</span>
                            ) : (
                                <>
                                    <LogInIcon className="h-5 w-5 mr-2" />
                                    Entrar
                                </>
                            )}
                        </Button>
                    </form>
                </div>
                 <p className="text-center text-xs text-gray-400 mt-6">
                    © 2025 Olympus X CRM. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
