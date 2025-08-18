import React, { useState, createContext, useContext, useRef } from 'react';

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

    const value = { openConfirmation, confirmState, handleClose, handleConfirm };

    return (
        <ConfirmContext.Provider value={value}>
            {children}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);