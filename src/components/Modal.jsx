import React from 'react';
import { createPortal } from 'react-dom';
import GlassPanel from './GlassPanel';
import Button from './Button';
import { XIcon } from './Icons';
import { cn } from '../utils';

// ALTERAÇÃO: O tamanho padrão agora é 'lg', um valor mais versátil.
const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;

    // ALTERAÇÃO: Adicionados todos os tamanhos comuns para tornar o modal mais flexível.
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl'
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 animate-fade-in p-4 pt-16 sm:pt-24 overflow-y-auto"
            onClick={onClose}
        >
            <GlassPanel
                className={cn(
                    "relative w-full animate-slide-up flex flex-col",
                    sizeClasses[size] // Esta linha agora funcionará para 'md' e outros tamanhos.
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <XIcon className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">{children}</div>
            </GlassPanel>
        </div>,
        document.body
    );
};

export default Modal;