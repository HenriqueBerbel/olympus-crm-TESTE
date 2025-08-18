// src/components/forms/DocumentsForm.jsx

import React from 'react';
import Button from '../Button';
import { UploadCloudIcon, DownloadIcon, Trash2Icon, FileTextIcon } from '../Icons';
import { cn } from '../../utils';

const DocumentsForm = ({ documents = [], onFileUpload, onFileDelete, isUploading }) => {
    
    // Simula o clique no input de arquivo escondido
    const handleUploadClick = () => {
        document.getElementById('file-upload-input').click();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Documentos do Cliente</h3>
                <input 
                    type="file" 
                    id="file-upload-input"
                    className="hidden"
                    onChange={(e) => onFileUpload(e.target.files[0])}
                    disabled={isUploading}
                />
                <Button type="button" onClick={handleUploadClick} disabled={isUploading}>
                    <UploadCloudIcon className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
                </Button>
            </div>

            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3 min-h-[150px]">
                {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum documento enviado para este cliente.</p>
                ) : (
                    documents.map((doc, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md">
                            <div className="flex items-center gap-3">
                                <FileTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                <span className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Baixar">
                                        <DownloadIcon className="h-4 w-4" />
                                    </Button>
                                </a>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" title="Excluir" onClick={() => onFileDelete(doc)}>
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Lembre-se de clicar em "Salvar Cliente" no final para confirmar as alterações nos documentos.</p>
        </div>
    );
};

export default DocumentsForm;