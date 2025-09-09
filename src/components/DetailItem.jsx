import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitários e Componentes Internos ---

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Para evitar erros de importação, os ícones e componentes simples são definidos aqui.
const Label = memo(React.forwardRef(({ className, ...props }, ref) => (
    <motion.label ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className={cn("text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5", className)} {...props} />
)));

const EyeIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> );
const EyeOffIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> );
const CopyIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> );
const CheckIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg> );


// --- Componente DetailItem ---

const DetailItem = memo(({ label, value, isPassword = false, isLink = false, children, isCurrency = false, contourMode = false }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // [UX] Lógica de cópia com feedback visual imediato
    const handleCopy = () => {
        if (copied) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset o ícone após 2 segundos
        });
    };
    
    // Formatação do valor a ser exibido
    let displayValue = children ? children : (value || 'N/A');
    if (isLink && value) {
        displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">{value}</a>;
    } else if (isPassword && !showPassword) {
        displayValue = '••••••••';
    } else if (isCurrency) {
        // Lógica simples de formatação de moeda
        const numberValue = parseFloat(String(value).replace(/[^0-9,-]+/g, "").replace(",", "."));
        displayValue = isNaN(numberValue) ? 'N/A' : numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <motion.div 
            className="py-2"
            // [MOTION] Animação de entrada para cada item
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <Label>{label}</Label>
            <div className={cn(
                "group flex items-center justify-between mt-1 min-h-[40px]",
                // [UI] Estilo do modo contorno unificado com os Inputs
                contourMode && "rounded-lg border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-3"
            )}>
                <div className="text-md text-slate-800 dark:text-slate-100 break-all pr-2">
                    {displayValue}
                </div>
                
                {/* [MOTION & UX] Botões aparecem com slide+fade e têm feedback de cópia */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    {isPassword && value && (
                        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOffIcon className="h-4 w-4 text-slate-500" /> : <EyeIcon className="h-4 w-4 text-slate-500" />}
                        </button>
                    )}
                    {value && !children && (
                        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={handleCopy}>
                            <AnimatePresence mode="popLayout">
                                {copied ? (
                                    <motion.div key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="copy" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                                        <CopyIcon className="h-4 w-4 text-slate-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

export default DetailItem;
