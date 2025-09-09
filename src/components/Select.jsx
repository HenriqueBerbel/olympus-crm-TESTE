import React, { forwardRef, memo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitários e Ícones (Internos para portabilidade) ---

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);


// --- Componente Select Principal ---

const Select = memo(forwardRef(({ className, children, error, placeholder, ...props }, ref) => (
    <SelectPrimitive.Root {...props}>
        <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                // [CORREÇÃO] Fundo sólido aplicado para consistência com os campos de Input
                "bg-slate-100 dark:bg-slate-900",
                "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                "disabled:cursor-not-allowed disabled:opacity-50",
                // Estilos específicos de tema
                "border-slate-200 text-slate-900 ring-offset-white focus:ring-slate-950",
                "dark:border-slate-800 dark:text-slate-50 dark:ring-offset-slate-950 dark:focus:ring-slate-300",
                error && "border-red-500 dark:border-red-500 focus:ring-red-500",
                className
            )}
        >
            <SelectPrimitive.Value placeholder={placeholder || "Selecione..."} />
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
            <AnimatePresence>
                <SelectPrimitive.Content 
                    asChild 
                    position="popper" 
                    sideOffset={5} 
                    className="z-50 min-w-[var(--radix-select-trigger-width)]"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        <div className="relative overflow-hidden rounded-lg border bg-white p-1 text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                            <SelectPrimitive.Viewport>
                                {children}
                            </SelectPrimitive.Viewport>
                        </div>
                    </motion.div>
                </SelectPrimitive.Content>
            </AnimatePresence>
        </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
)));

// --- Componente de Item do Select ---

const SelectItem = memo(forwardRef(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
            "focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-50",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <CheckIcon className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
)));

// Exportações
export { Select, SelectItem };
export default Select;

