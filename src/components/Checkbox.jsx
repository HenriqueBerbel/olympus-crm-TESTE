import React, { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitário ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Componente Checkbox com design de Rádio Botão ---
const Checkbox = forwardRef(({ className, children, onChange, value, ...props }, ref) => {
    
    // Wrapper para manter a compatibilidade com a função `onChange` dos seus formulários
    const handleCheckedChange = (checked) => {
        if (onChange) {
            onChange({ target: { value, checked } });
        }
    };
    
    return (
      <label className={cn(
        "group flex items-center gap-3 cursor-pointer select-none",
        // [CORREÇÃO DEFINITIVA] Cor do texto forçada para um tom quase branco no modo escuro
        "text-slate-800 dark:text-slate-100",
        "text-sm font-medium transition-colors hover:text-slate-950 dark:hover:text-white",
        className
      )}>
        <CheckboxPrimitive.Root
          ref={ref}
          onCheckedChange={handleCheckedChange}
          {...props}
          className={cn(
            "peer h-5 w-5 shrink-0 rounded-full border-2 transition-all duration-200",
            "bg-white dark:bg-slate-900",
            // Estilos de foco
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "dark:ring-offset-slate-950 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400",
            // Estilos de desabilitado
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Bordas com mais contraste
            "border-slate-400 dark:border-slate-500",
            "data-[state=checked]:border-cyan-500 dark:data-[state=checked]:border-cyan-400"
          )}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center h-full w-full relative">
              <AnimatePresence>
                {props.checked && (
                    <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
              </AnimatePresence>
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        
        {children}
      </label>
  );
});

export default Checkbox;

