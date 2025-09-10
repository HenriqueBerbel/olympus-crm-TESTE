import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TabsContext = createContext();

export const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);
    const isControlled = value !== undefined;
    const activeTab = isControlled ? value : internalActiveTab;

    const setActiveTab = (tabValue) => {
        if (!isControlled) {
            setInternalActiveTab(tabValue);
        }
        if (onValueChange) {
            onValueChange(tabValue);
        }
    };

    const contextValue = { activeTab, setActiveTab };

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ children, className }) => (
    /* =======================================================
       A CORREÇÃO FINAL ESTÁ AQUI
       A classe 'overflow-x-auto' foi REMOVIDA.
    ======================================================= */
    <div className={cn("relative flex items-center border-b border-slate-200 dark:border-slate-800", className)}>
        {children}
    </div>
);

export const TabsTrigger = ({ value, children, className }) => {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    const isActive = activeTab === value;

    return (
        <button
            type="button"
            onClick={() => setActiveTab(value)}
            className={cn(
                "relative inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors duration-200",
                isActive
                    ? "text-cyan-500 dark:text-cyan-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-50",
                className
            )}
        >
            {children}
            {isActive && (
                <motion.div 
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400"
                    layoutId="active-tab-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
        </button>
    );
};

export const TabsContent = ({ value, children, className }) => {
    const { activeTab } = useContext(TabsContext);
    
    return activeTab === value ? (
        <motion.div
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn("mt-6 outline-none", className)}
        >
            {children}
        </motion.div>
    ) : null;
};
