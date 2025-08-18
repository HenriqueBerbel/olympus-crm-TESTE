import React, { useState, createContext, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = ({ title, description, variant = 'default' }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, description, variant }]);
        setTimeout(() => setToasts(t => t.filter(currentToast => currentToast.id !== id)), 5000);
    };

    return (
        <NotificationContext.Provider value={{ toast, toasts }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useToast = () => useContext(NotificationContext);