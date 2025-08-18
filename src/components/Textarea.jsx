import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';
import { usePreferences } from '../contexts/PreferencesContext';
import { CalendarIcon, ChevronDownIcon } from './Icons'; // Vamos precisar dos ícones aqui

const Textarea = memo(forwardRef(({ className, ...props }, ref) => {
    const { preferences } = usePreferences();

    const handleChange = (e) => {
        if (preferences.uppercaseMode) {
            e.target.value = e.target.value.toUpperCase();
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return (
        <textarea
            ref={ref}
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all",
                preferences.uppercaseMode && "uppercase",
                className
            )}
            {...props}
            onChange={handleChange}
        />
    );
}));

export default Textarea;