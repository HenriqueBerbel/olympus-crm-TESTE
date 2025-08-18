import React from 'react';
import { cn } from '../utils'; // Importa a função utilitária para unir classes de CSS

/**
 * Componente GlassPanel
 * * Cria um painel com efeito de "vidro fosco" (glassmorphism) para ser usado como contêiner.
 * * - É otimizado com `React.memo` para evitar re-renderizações desnecessárias.
 * - Usa `React.forwardRef` para que possa receber uma `ref` e passá-la para o `div` principal.
 * * @param {string} className - Classes CSS adicionais para customização.
 * @param {React.ReactNode} children - O conteúdo que será exibido dentro do painel.
 * @param {boolean} cortex - Uma prop especial para aplicar um estilo "cortex-active".
 * @param {object} props - Quaisquer outras props (como `onClick`) serão passadas para o `div`.
 */
const GlassPanel = React.memo(React.forwardRef(
    ({ className, children, cortex = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // Estilos base para o efeito "glass"
                    "bg-white/70 dark:bg-[#161b22]/50 backdrop-blur-2xl",
                    "border border-gray-200 dark:border-white/10",
                    "rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20",
                    
                    // Estilo condicional para a variante "cortex"
                    cortex && "cortex-active",
                    
                    // Combina com quaisquer classes customizadas passadas via props
                    className
                )}
                {...props} // Passa adiante outras props como onClick, etc.
            >
                {children}
            </div>
        );
    }
));

// Define um nome de exibição para facilitar a depuração no React DevTools
GlassPanel.displayName = 'GlassPanel';

export default GlassPanel;