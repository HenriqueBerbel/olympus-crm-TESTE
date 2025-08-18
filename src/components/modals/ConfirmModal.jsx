import React from 'react';
import Modal from '../Modal';
import Button from '../Button';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Ação"}>
            <p className="text-gray-700 dark:text-gray-300">{description || "Tem certeza que deseja prosseguir?"}</p>
            <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button variant="destructive" onClick={onConfirm}>Confirmar</Button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;