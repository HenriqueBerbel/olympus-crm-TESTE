import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';

// Componentes
import Label from '../components/Label';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogInIcon, EyeIcon, EyeOffIcon } from '../components/Icons';

// ========================================================================
//          *** PÁGINA DE LOGIN REFINADA ***
// ========================================================================

const LoginPage = () => {
    const { login } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // [UX] Estado para mostrar/ocultar senha
    const db = getFirestore();

    // Efeito para buscar a URL do logo (sem alterações)
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
    
    // Função para traduzir erros do Firebase (sem alterações)
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

    // Submissão do formulário (sem alterações na lógica)
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
            setLoading(false);
        }
    };

    // Variantes de Animação
    const panelVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop)' }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <motion.div 
                className="relative z-10 w-full max-w-md"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xl p-8 md:p-10 rounded-2xl border border-white/20 shadow-2xl">
                    <motion.div variants={itemVariants} className="text-center mb-8">
                        {logoUrl && (
                            <img 
                                src={logoUrl} 
                                alt="Logo da Empresa" 
                                className="mx-auto h-16 w-auto mb-4 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <h1 className="text-4xl font-bold text-white tracking-tight">OLYMPUS X</h1>
                        <p className="text-gray-300 mt-2">Acesso ao Ecossistema de Gestão</p>
                    </motion.div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div variants={itemVariants}>
                            <Label htmlFor="email" className="text-gray-200">Email</Label>
                            <Input 
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                                required className="mt-2" placeholder="seu@email.com"
                            />
                        </motion.div>
                        
                        <motion.div variants={itemVariants}>
                            <Label htmlFor="password" className="text-gray-200">Senha</Label>
                            {/* [UX] Input de senha com botão de mostrar/ocultar */}
                            <div className="relative mt-2">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Button 
                                type="submit" 
                                className="w-full !h-12 !text-base font-semibold" 
                                disabled={loading}
                                as={motion.button} // Permite animar o botão
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.span
                                            key="loading"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="animate-pulse"
                                        >
                                            Autenticando...
                                        </motion.span>
                                    ) : (
                                        <motion.span key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                                            <LogInIcon className="h-5 w-5 mr-2" />
                                            Entrar
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </form>
                </div>
                
                <motion.p variants={itemVariants} className="text-center text-xs text-gray-400 mt-8">
                    © {new Date().getFullYear()} Olympus X CRM. Todos os direitos reservados.
                </motion.p>
            </motion.div>
        </div>
    );
};

export default LoginPage;