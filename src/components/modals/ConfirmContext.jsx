import React, { useState, createContext, useContext, useRef } from 'react';
import ConfirmModal from '../components/modals/ConfirmModal'; // <-- Importa o modal

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState(null);
    const awaitingPromiseRef = useRef();

    const openConfirmation = (options) => {
        setConfirmState(options);
        return new Promise((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject };
        });
    };

    const handleClose = () => {
        if (awaitingPromiseRef.current) awaitingPromiseRef.current.reject();
        setConfirmState(null);
    };

    const handleConfirm = () => {
        if (awaitingPromiseRef.current) awaitingPromiseRef.current.resolve();
        setConfirmState(null);
    };

    // Removemos a exportação do 'value' daqui pois o componente agora é auto-suficiente
    return (
        <ConfirmContext.Provider value={openConfirmation}>
            {children}
            <ConfirmModal isOpen={!!confirmState} onClose={handleClose} onConfirm={handleConfirm} {...confirmState} />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);