import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';

// 1. Definimos o componente com a capacidade de receber a `ref`
const LabelWithRef = forwardRef(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-bold text-gray-600 dark:text-gray-400",
            className
        )}
        {...props}
    />
));

// 2. Aplicamos a otimização de performance com `memo`
const MemoizedLabel = memo(LabelWithRef);

// 3. (Opcional, mas recomendado) Adicionamos um nome de exibição para o Debugger
MemoizedLabel.displayName = 'Label';

// 4. Exportamos o componente final como padrão
export default MemoizedLabel;