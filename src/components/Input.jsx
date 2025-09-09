import React, { forwardRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitários e Ícones (Internos) ---

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AlertCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);


// --- Componente Input Principal ---

const Input = memo(forwardRef(({ className, error, mask, ...props }, ref) => {
  
  // [CORREÇÃO] A prop `mask` agora é extraída aqui.
  // Isso a separa do objeto `...props`, impedindo que seja passada ao DOM.

  const handleChange = (e) => {
    // A lógica da máscara usa a variável `mask` diretamente.
    if (mask) {
      e.target.value = mask(e.target.value);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="relative w-full">
      <motion.input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "bg-slate-100 text-slate-900 placeholder:text-slate-500",
          "dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400",
          "border-slate-200 dark:border-slate-800",
          "focus:ring-slate-950 dark:focus:ring-slate-300 ring-offset-white dark:ring-offset-slate-950",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "pr-10",
          className
        )}
        onChange={handleChange}
        {...props} // O objeto `props` aqui não contém mais a `mask`.
      />
      
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AlertCircleIcon className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}));

export default Input;

