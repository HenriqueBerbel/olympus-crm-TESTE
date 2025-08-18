import React from 'react';
import { formatDateTime } from '../../utils';
import { HistoryIcon } from '../Icons';
import EmptyState from '../EmptyState'; // Adicionado para consistência

// CORREÇÃO: Alterado de "export const" para uma constante
const HistoryTab = ({ client }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {(client?.observations || []).length === 0 ? (
            <EmptyState title="Nenhum Histórico" message="Nenhuma observação foi adicionada para este cliente ainda." />
        ) : (
            (client.observations).map((obs, index) => (
                <div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg relative pl-8">
                    <HistoryIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 absolute top-4 left-2"/>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p>
                    <p className="text-xs text-gray-500 mt-2 text-right">{obs.authorName} em {formatDateTime(obs.timestamp)}</p>
                </div>
            ))
        )}
    </div>
);

// CORREÇÃO: Adicionada a exportação padrão
export default HistoryTab;