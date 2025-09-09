import React, { forwardRef, memo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitário (interno para portabilidade) ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Componente Label
 * Exibe um rótulo para campos de formulário com estilo e animação consistentes.
 */
const Label = memo(forwardRef(({ className, children, ...props }, ref) => {
    return (
        <motion.label
            ref={ref}
            
            // [MOTION] Animação de fade-in suave para o texto
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            
            className={cn(
                // [UI] Estilo de texto unificado com os outros componentes
                "text-sm font-semibold text-slate-700 dark:text-slate-300",
                
                // [UX] Garante bom espaçamento e comportamento de layout
                "block mb-1.5",
                
                className
            )}
            {...props}
        >
            {children}
        </motion.label>
    );
}));

Label.displayName = 'Label';

export default Label;
