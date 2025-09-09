import React, { useEffect, forwardRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Componentes dependentes (mantidos como importações)
import GlassPanel from './GlassPanel';
import Button from './Button';

// --- Utilitários e Ícones (Agora internos para robustez) ---

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

// --- Componente Principal do Modal ---

// Criamos um componente animável a partir do GlassPanel
const MotionGlassPanel = motion(GlassPanel);

const Modal = ({ isOpen, onClose, title, children, size = 'lg', closeOnClickOutside = true }) => {
    
    // Efeito para fechar com a tecla 'Esc'
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const sizeClasses = {
        sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
        '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '5xl': 'max-w-5xl', '6xl': 'max-w-6xl'
    };
    
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    
                    // Animação do fundo (overlay)
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}

                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 p-4 pt-16 sm:pt-24 overflow-y-auto"
                    onClick={closeOnClickOutside ? onClose : undefined}
                >
                    <MotionGlassPanel
                        className={cn("relative w-full flex flex-col", sizeClasses[size])}
                        onClick={(e) => e.stopPropagation()}
                        
                        // Animação da janela do modal
                        initial={{ opacity: 0, scale: 0.95, y: -30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -30 }}
                        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    >
                        <div className={cn(
                            "flex-shrink-0 flex justify-between items-center p-6 pb-4",
                            // [UI] Borda consistente com o tema
                            "border-b border-slate-200/80 dark:border-slate-800/80"
                        )}>
                            <h3 id="modal-title" className={cn(
                                "text-xl font-semibold",
                                // [UI] Cor do título consistente com o tema
                                "text-slate-900 dark:text-slate-50"
                            )}>{title}</h3>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-grow p-6 overflow-y-auto">{children}</div>
                    </MotionGlassPanel>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default memo(Modal);
