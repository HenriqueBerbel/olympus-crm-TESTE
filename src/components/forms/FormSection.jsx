import React from 'react';
import { cn } from '../../utils';

// CORREÇÃO: Alterado de "export const" para uma constante simples
const FormSection = ({ title, children, cols = 3 }) => (
    <div className="mb-8">
        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">{title}</h3>
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-6",
            `lg:grid-cols-${cols}`
        )}>
            {children}
        </div>
    </div>
);

export default FormSection;