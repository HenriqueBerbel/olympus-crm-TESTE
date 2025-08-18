// src/components/clients/DocumentsTab.jsx
import React from 'react';
import Button from '../Button';
import GlassPanel from '../GlassPanel';
import EmptyState from '../EmptyState';
import { DownloadIcon, FileTextIcon } from '../Icons';

const DocumentsTab = ({ client }) => {
    const documents = client?.documents || [];
    return (
        <div>
            {documents.length > 0 ? (
                <div className="space-y-3">
                    {documents.map((doc, index) => (
                        <GlassPanel key={index} className="p-3 flex justify-between items-center bg-gray-100 dark:bg-black/20">
                            <div className="flex items-center gap-3">
                                <FileTextIcon className="h-6 w-6 text-cyan-500" />
                                <span className="font-semibold text-gray-900 dark:text-white">{doc.name}</span>
                            </div>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline"><DownloadIcon className="h-4 w-4 mr-2" />Baixar</Button>
                            </a>
                        </GlassPanel>
                    ))}
                </div>
            ) : (
                <EmptyState title="Nenhum Documento" message="Nenhum arquivo foi enviado para este cliente ainda." />
            )}
        </div>
    );
};

export default DocumentsTab;