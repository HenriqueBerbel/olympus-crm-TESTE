import React, { createContext, useContext, useState } from 'react';
import { cn } from '../utils';

// O componente TabsTrigger usa um <button>, mas não o nosso componente <Button> customizado.
// Portanto, não precisamos importar o Button.jsx aqui.
// Se no futuro você decidir usar o componente <Button> aqui dentro,
// lembre-se de importar sem chaves: import Button from './Button';

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
    <div className={cn("flex items-center border-b border-gray-200 dark:border-white/10 overflow-x-auto", className)}>
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
                "relative inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 disabled:pointer-events-none",
                isActive
                    ? "text-cyan-500 dark:text-cyan-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white",
                className
            )}
        >
            {children}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}
        </button>
    );
};

export const TabsContent = ({ value, children, className }) => {
    const { activeTab } = useContext(TabsContext);
    return activeTab === value ? <div className={cn("mt-6", className)}>{children}</div> : null;
};
