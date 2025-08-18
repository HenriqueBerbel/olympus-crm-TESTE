import React, { forwardRef, memo } from 'react';
import { cn } from '../utils';
import { usePreferences } from '../contexts/PreferencesContext';

const Input = memo(forwardRef(({ className, error, mask, isCurrency = false, ...props }, ref) => {
    const { preferences } = usePreferences();

    const handleChange = (e) => {
        const { value } = e.target;
        if (mask) {
            e.target.value = mask(value);
        }
        if (preferences.uppercaseMode && !isCurrency && e.target.type !== 'email' && e.target.type !== 'password') {
            e.target.value = e.target.value.toUpperCase();
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    const handleCurrencyChange = (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        value = (Number(value) / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        e.target.value = `R$ ${value}`;
        if (props.onChange) {
            props.onChange(e);
        }
    };

    const finalProps = isCurrency ? { ...props, onChange: handleCurrencyChange } : { ...props, onChange: handleChange };

    return (
        <input
            ref={ref}
            className={cn(
                "flex h-10 w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all",
                error && "border-red-500 ring-red-500",
                preferences.uppercaseMode && "uppercase",
                className
            )}
            {...finalProps}
        />
    );
}));

export default Input;
