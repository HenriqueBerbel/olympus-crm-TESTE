import React, { useState, memo } from 'react';
import { useToast } from '../contexts/NotificationContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { cn, formatCurrency } from '../utils';
import Label from './Label';
import Button from './Button';
import { EyeIcon, EyeOffIcon, CopyIcon } from './Icons';

// CORREÇÃO: Alterado de "export const" para uma constante
const DetailItem = memo(({ label, value, isPassword = false, isLink = false, children, isCurrency = false }) => {
    const { toast } = useToast();
    const { preferences } = usePreferences();
    const { contourMode, uppercaseMode } = preferences;
    const [showPassword, setShowPassword] = useState(false);
    
    const handleCopy = () => {
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = value;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            toast({ title: 'Copiado!', description: `${label} copiado.` });
        } catch (err) {
            toast({ title: 'Erro', description: `Não foi possível copiar.`, variant: 'destructive' });
        }
    };
    
    let displayValue = value || 'N/A';
    if (uppercaseMode && typeof displayValue === 'string' && !isCurrency) {
        displayValue = displayValue.toUpperCase();
    }
    
    return (
        <div className="py-1">
            <Label>{label}</Label>
            <div className={cn(
                "flex items-center justify-between mt-1 group",
                contourMode && "border border-gray-200 dark:border-white/10 rounded-lg px-3 min-h-[40px] bg-gray-100/30 dark:bg-black/10"
            )}>
                <div className={cn("text-md text-gray-800 dark:text-gray-100 break-words", uppercaseMode && "uppercase")}>
                    {children ? children :
                        (isLink && value ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">{displayValue}</a> :
                        (isPassword && !showPassword ? '••••••••' :
                        (isCurrency ? formatCurrency(value) : displayValue)))}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPassword && value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</Button>)}
                    {value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}><CopyIcon className="h-4 w-4" /></Button>)}
                </div>
            </div>
        </div>
    );
});

export default DetailItem;