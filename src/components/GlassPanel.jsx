import React, { forwardRef, memo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilitário (interno para portabilidade) ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Componente GlassPanel
 * Cria um painel com efeito de "vidro fosco" (glassmorphism) que surge com uma animação suave.
 * @param {string} className - Classes CSS adicionais para customização.
 * @param {React.ReactNode} children - O conteúdo a ser exibido dentro do painel.
 * @param {boolean} cortex - Prop especial para aplicar um estilo "cortex-active".
 * @param {object} props - Outras props (como `onClick`) passadas para o `div`.
 */
const GlassPanel = memo(forwardRef(
    ({ className, children, cortex = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                
                // [MOTION] Animação de entrada suave, estilo Apple
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    duration: 0.5, 
                    ease: [0.25, 1, 0.5, 1] // Curva de easing suave (ease-out)
                }}
                
                className={cn(
                    // [UI] Estilos de "glass" usando as cores do tema para consistência
                    // A opacidade /60 e /70 mantém o efeito de transparência
                    "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl",
                    
                    // [UI] Bordas e sombras refinadas
                    "border border-slate-200/80 dark:border-slate-800/80",
                    "rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20",
                    
                    // Estilo condicional para a variante "cortex"
                    cortex && "cortex-active",
                    
                    // Combina com quaisquer classes customizadas
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
));

GlassPanel.displayName = 'GlassPanel';

export default GlassPanel;
