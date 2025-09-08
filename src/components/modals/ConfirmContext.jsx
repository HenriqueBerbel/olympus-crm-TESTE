import React, { useState, createContext, useContext, useRef, useCallback } from 'react';
import ConfirmDialog from '../ConfirmDialog'; // Alterado para o nome do componente que você já me enviou antes. Se o nome for ConfirmModal, basta ajustar o import.

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState(null);
    const awaitingPromiseRef = useRef();

    const openConfirmation = useCallback((options) => {
        setConfirmState(options);
        return new Promise((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject };
        });
    }, []);

    const handleClose = useCallback(() => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.reject();
        }
        setConfirmState(null);
    }, []);

    const handleConfirm = useCallback(() => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve();
        }
        setConfirmState(null);
    }, []);

    return (
        <ConfirmContext.Provider value={openConfirmation}>
            {children}
            
            {/* Renderizamos o componente de diálogo de confirmação aqui.
              O `ConfirmDialog` que analisamos no começo já tem um layout ótimo para isso.
              Ele internamente usa o nosso Modal aprimorado.
            */}
            <ConfirmDialog 
                // Passamos todas as opções (title, description, etc.) para o diálogo
                confirmState={confirmState}
                handleCancel={handleClose}
                handleConfirm={handleConfirm}
            />
        </ConfirmContext.Provider>
    );
};

// Hook customizado para fácil acesso
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (context === null) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
};