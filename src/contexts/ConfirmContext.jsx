// src/contexts/ConfirmContext.jsx

import React, { useState, createContext, useContext, useRef, useCallback } from 'react';

// Exportamos o contexto para que possa ser usado diretamente pelo ConfirmDialog.jsx
export const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
    // 'confirmState' armazena os dados do modal (título, descrição) ou é 'null' se estiver fechado.
    const [confirmState, setConfirmState] = useState(null);
    
    // 'useRef' é usado para manter uma referência às funções 'resolve' e 'reject' da promessa
    // sem causar re-renderizações quando elas são definidas.
    const awaitingPromiseRef = useRef();

    /**
     * Função principal para abrir o diálogo de confirmação.
     * @param {object} options - As opções de configuração para o diálogo (title, description, etc.).
     * @returns {Promise<boolean>} - Retorna uma promessa que resolve para 'true' na confirmação
     * e rejeita (ou resolve para 'false') no cancelamento.
     */
    const openConfirmation = useCallback((options) => {
        setConfirmState(options); // Mostra o modal com as opções recebidas
        return new Promise((resolve, reject) => {
            // Armazena as funções 'resolve' e 'reject' para que possam ser chamadas pelos handlers
            awaitingPromiseRef.current = { resolve, reject };
        });
    }, []); // useCallback sem dependências, pois não depende de nenhum estado ou prop.

    // [MELHORIA APLICADA]
    // A lógica de fechar o modal é isolada em sua própria função.
    const handleClose = useCallback(() => {
        setConfirmState(null);
    }, []);

    // [MELHORIA APLICADA]
    // A função de confirmação agora primeiro resolve a promessa e DEPOIS fecha o modal.
    const handleConfirm = useCallback(() => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve(true); // Resolve a promessa com 'true'
        }
        handleClose(); // Em seguida, fecha o modal
    }, [handleClose]); // Depende de handleClose
    
    // [MELHORIA APLICADA]
    // A função de cancelamento primeiro rejeita a promessa e DEPOIS fecha o modal.
    const handleCancel = useCallback(() => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.reject(false); // Rejeita a promessa com 'false'
        }
        handleClose(); // Em seguida, fecha o modal
    }, [handleClose]); // Depende de handleClose

    // O valor fornecido pelo contexto para os componentes filhos.
    const value = { 
        openConfirmation, 
        confirmState, 
        handleConfirm, 
        handleCancel
    };

    return (
        <ConfirmContext.Provider value={value}>
            {children}
        </ConfirmContext.Provider>
    );
};

/**
 * Hook customizado para simplificar o uso do contexto de confirmação.
 * Componentes que usam este hook recebem diretamente a função 'openConfirmation'.
 * @returns {function} A função 'openConfirmation'.
 */
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm deve ser usado dentro de um ConfirmProvider');
    }
    // Retornamos apenas a função que os componentes precisam chamar.
    return context.openConfirmation;
};