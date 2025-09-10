import React, { useState } from 'react';
import Button from '../Button';
import { HistoryIcon } from '../Icons';
import { formatDateTime } from '../../utils';

const Textarea = (props) => (
    <textarea 
        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        {...props}
    />
);

// O componente agora é "burro": recebe 'onAddObservation' e não usa mais 'useAuth' ou 'setObservations'.
const HistoryForm = ({ observations, onAddObservation }) => {
    const [newObservation, setNewObservation] = useState('');

    const handleAddClick = () => {
        // 1. Chama a função do componente pai, passando apenas o texto.
        onAddObservation(newObservation);
        // 2. Limpa o campo de texto local.
        setNewObservation('');
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Adicionar Observação</label>
                <Textarea
                    placeholder="Digite uma nova observação sobre o cliente..."
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    rows={4}
                />
                <div className="flex justify-end mt-2">
                    <Button type="button" onClick={handleAddClick} disabled={!newObservation.trim()}>
                        Adicionar ao Histórico
                    </Button>
                </div>
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <h3 className="text-lg font-semibold">Histórico de Observações</h3>
            <div className="space-y-3 pr-2">
                {(observations || []).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum histórico de observações.</p>
                ) : (
                    observations.map((obs, index) => (
                        <div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg relative pl-10">
                            <HistoryIcon className="h-5 w-5 text-cyan-500 absolute top-4 left-3" />
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p>
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {obs.authorName} em {formatDateTime(obs.timestamp)}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryForm;

