import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';
import { ChevronDownIcon } from './Icons';

const Select = memo(forwardRef(({ className, children, error, ...props }, ref) => (
    <div className="relative">
        <select
            ref={ref}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all appearance-none pr-8",
                error && "border-red-500 ring-red-500",
                className
            )}
            {...props}
        >
            {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
    </div>
)));

export default Select;