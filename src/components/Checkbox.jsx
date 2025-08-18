import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';

const Checkbox = memo(forwardRef(({ className, ...props }, ref) => (
    <input
        type="checkbox"
        ref={ref}
        className={cn(
            "h-4 w-4 shrink-0 rounded-sm border-2 border-cyan-500/50 text-cyan-500 bg-gray-200 dark:bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900",
            className
        )}
        {...props}
    />
)));

export default Checkbox;