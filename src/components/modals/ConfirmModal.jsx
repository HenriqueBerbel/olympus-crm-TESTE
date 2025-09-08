import React, { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertTriangleIcon } from '../Icons'; // Supondo que você tenha este ícone
import { cn } from '../../utils';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Você tem certeza?",
    description = "Esta ação não pode ser desfeita.",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = true, // Nova prop para controlar o estilo
}) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirmClick = async () => {
        setIsLoading(true);
        try {
            // A função onConfirm é a que vem de fora (ex: a que deleta o usuário)
            await onConfirm();
        } catch (error) {
            // Se a função onConfirm falhar, o erro será capturado aqui.
            // O modal permanecerá aberto para o usuário tentar novamente se desejar.
            console.error("A ação de confirmação falhou:", error);
        } finally {
            // Este bloco será executado independentemente de sucesso ou falha
            setIsLoading(false);
        }
    };

    return (
        // MELHORIA: closeOnClickOutside e tamanho padrão ajustado
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="sm" 
            closeOnClickOutside={false}
        >
            {/* MELHORIA DE UI/DESIGN: Layout totalmente novo e mais profissional */}
            <div className="text-center p-2">
                {/* Ícone aparece apenas em ações destrutivas */}
                {isDestructive && (
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4">
                        <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </Button>
                {/* MELHORIA: Botão muda de cor e tem estado de carregamento */}
                <Button 
                    variant={isDestructive ? 'destructive' : 'default'} 
                    onClick={handleConfirmClick} 
                    disabled={isLoading}
                    autoFocus
                >
                    {isLoading ? 'Processando...' : confirmText}
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;