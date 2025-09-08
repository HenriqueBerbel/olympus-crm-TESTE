import React from 'react';
import { useContext } from 'react';
import { ConfirmContext } from '../contexts/ConfirmContext';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangleIcon } from './Icons';

const ConfirmDialog = () => {
    const { confirmState, handleCancel, handleConfirm } = useContext(ConfirmContext);

    if (!confirmState) {
        return null;
    }

    const {
        title = "Você tem certeza?",
        description = "Esta ação não pode ser desfeita.",
        confirmText = "Confirmar",
        cancelText = "Cancelar",
        size = 'sm'
    } = confirmState;

    return (
        <Modal 
            isOpen={!!confirmState} 
            onClose={handleCancel} 
            size={size} 
            closeOnClickOutside={false} // <-- A ÚNICA MUDANÇA É AQUI!
        >
            {/* O conteúdo do modal foi totalmente redesenhado */}
            <div className="text-center p-2">
                {/* Ícone centralizado e estilizado */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4">
                    <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                
                {/* Título e Descrição */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                </div>
            </div>
            
            {/* Botões com layout mais limpo */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCancel}>
                    {cancelText}
                </Button>
                <Button variant="destructive" onClick={handleConfirm} autoFocus>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;