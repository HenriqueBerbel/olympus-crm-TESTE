import React, { forwardRef, memo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitário ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Componente Button ---
const Button = memo(forwardRef(({ 
    className, 
    variant = 'default', 
    size = 'default', 
    children, 
    as: Comp = 'button', 
    ...props 
}, ref) => {

    // [ESTILO ANTIGO] Reintroduzimos as variantes de cor e brilho originais
    const variants = {
        default: "bg-cyan-500 text-white hover:bg-cyan-600 dark:shadow-[0_0_20px_rgba(6,182,212,0.5)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]",
        destructive: "bg-red-600 text-white hover:bg-red-700 dark:shadow-[0_0_15px_rgba(220,38,38,0.5)]",
        outline: "border border-cyan-500/50 bg-transparent text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 hover:border-cyan-500 dark:hover:border-cyan-400",
        ghost: "hover:bg-gray-900/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
        violet: "bg-violet-600 text-white hover:bg-violet-700 dark:shadow-[0_0_20px_rgba(192,38,211,0.5)]"
    };

    // [ESTILO ANTIGO] Reintroduzimos os tamanhos originais
    const sizes = {
        default: "h-9 px-4", // Altura ajustada para "fino"
        sm: "h-8 px-3",
        lg: "h-11 px-8",
        icon: "h-9 w-9"
    };

    return (
        // [ANIMAÇÃO NOVA] Mantemos o wrapper de animação
        <motion.div
            whileHover={{ y: -2, scale: 1.02 }} // Efeito de "levantar"
            whileTap={{ scale: 0.95 }} // Efeito de "pressionar"
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-block"
        >
            <Comp
                ref={ref}
                className={cn(
                    // [ESTILO ANTIGO] Usamos rounded-full para o formato de pílula
                    "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </Comp>
        </motion.div>
    );
}));

export default Button;

