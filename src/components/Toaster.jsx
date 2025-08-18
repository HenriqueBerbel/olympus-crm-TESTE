import React from 'react';
import { createPortal } from 'react-dom';
import GlassPanel from './GlassPanel';
import { useToast } from '../contexts/NotificationContext';
import { cn } from '../utils';

const Toaster = () => {
    const { toasts } = useToast();
    return createPortal(
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {toasts.map(({ id, title, description, variant }) => (
                <GlassPanel
                    key={id}
                    className={cn(
                        "p-4 border-l-4",
                        variant === 'destructive' ? 'border-red-500' :
                        variant === 'violet' ? 'border-violet-500' :
                        'border-cyan-500'
                    )}
                >
                    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                    {description && <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>}
                </GlassPanel>
            ))}
        </div>,
        document.body
    );
};

export default Toaster;