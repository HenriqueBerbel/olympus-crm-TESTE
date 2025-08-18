import React, { memo } from 'react';
import { cn } from '../utils';

const Badge = memo(({ children, variant = 'default', className }) => {
    const variants = {
        default: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200",
        secondary: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
        outline: "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200"
    };
    return <span className={cn("text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full", variants[variant], className)}>{children}</span>;
});

export default Badge;