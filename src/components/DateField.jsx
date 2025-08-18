import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';
import Input from './Input'; // Importa nosso componente Input
import { CalendarIcon } from './Icons';

const DateField = memo(forwardRef(({ className, ...props }, ref) => (
    <div className="relative">
        <Input
            ref={ref}
            type="date"
            className={cn("pr-10 dark:[color-scheme:dark]", className)}
            {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
    </div>
)));

export default DateField;