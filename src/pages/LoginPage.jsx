import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/NotificationContext';
import GlassPanel from '../components/GlassPanel';
import Label from '../components/Label';
import Input from '../components/Input';
import Button from '../components/Button';

const LoginPage = () => {
    const { login } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password);
        if (!result.success) {
            toast({ title: "Falha na Autenticação", description: "Credenciais inválidas.", variant: "destructive" });
        }
        // O loading é desligado automaticamente pelo fluxo de autenticação, 
        // então não precisamos chamar setLoading(false) aqui em caso de sucesso.
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0D1117] p-4">
            <GlassPanel className="w-full max-w-sm p-8">
                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">OLYMPUS X</h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Acesso ao Ecossistema</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" />
                    </div>
                    <Button type="submit" variant="default" className="w-full !h-12 !text-base" disabled={loading}>
                        {loading ? 'Autenticando...' : 'Entrar'}
                    </Button>
                </form>
            </GlassPanel>
        </div>
    );
};

export default LoginPage;