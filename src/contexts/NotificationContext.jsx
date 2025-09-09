import React, { createContext, useContext, useState, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitários e Ícones (para tornar o componente autônomo) ---
const CheckCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const InfoIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const XIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- 1. Contexto e Hook de Acesso ---
const NotificationContext = createContext();
export const useToast = () => useContext(NotificationContext);

// --- 2. O Provedor do Contexto ---
export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Função para ADICIONAR um toast. Ela apenas adiciona o dado ao estado.
    const toast = useCallback(({ title, description, variant = 'default' }) => {
        const id = Date.now(); // Gera um ID único
        setToasts(prev => [...prev, { id, title, description, variant }]);
    }, []);

    // Função para REMOVER um toast. Será usada pelo componente do toast.
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ toast }}>
            {children}
            {/* O Toaster é renderizado aqui para estar sempre presente na aplicação */}
            <Toaster toasts={toasts} removeToast={removeToast} />
        </NotificationContext.Provider>
    );
};

// --- 3. O Container dos Toasts (Toaster) ---
const Toaster = ({ toasts, removeToast }) => {
    // Usamos um Portal para renderizar os toasts no final do <body>, evitando problemas de sobreposição.
    return createPortal(
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} removeToast={removeToast} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
};

// --- 4. O Componente Visual do Toast ---
const Toast = memo(({ id, title, description, variant, removeToast }) => {
    // [CORREÇÃO] A lógica do timer agora vive dentro de cada toast,
    // garantindo que ele gerencie seu próprio tempo de vida.
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(id);
        }, 5000); // Desaparece após 5 segundos
        return () => clearTimeout(timer); // Limpa o timer se o componente for removido manualmente
    }, [id, removeToast]);

    const variants = {
        default: { icon: InfoIcon, classes: "bg-slate-800 border-slate-700 text-white" },
        destructive: { icon: XCircleIcon, classes: "bg-red-600 border-red-700 text-white" },
        success: { icon: CheckCircleIcon, classes: "bg-green-600 border-green-700 text-white" },
    };
    const { icon: Icon, classes } = variants[variant] || variants.default;

    return (
        <motion.div
            layout
            // [MOTION] Animações de entrada e saída
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn("relative flex w-full items-start space-x-4 rounded-xl border p-4 pr-8 shadow-lg mb-4", classes)}
        >
            <Icon className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
            </div>
            <button onClick={() => removeToast(id)} className="absolute top-3 right-3 p-1 rounded-full transition-colors hover:bg-white/10">
                <XIcon className="h-4 w-4" />
            </button>
        </motion.div>
    );
});