import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../Button';
import { HistoryIcon } from '../Icons';
import { formatDateTime } from '../../utils';

const Textarea = (props) => (
    <textarea 
        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        {...props}
    />
);

// CORREÇÃO: Alterado de "export const" para uma constante simples
const HistoryForm = ({ observations, setObservations }) => {
    const [newObservation, setNewObservation] = useState('');
    const { user } = useAuth();

    const handleAddObservation = () => {
        if (!newObservation.trim()) return;
        const observationToAdd = {
            text: newObservation,
            authorName: user?.name || 'Sistema',
            authorId: user?.id,
            timestamp: new Date().toISOString(),
        };
        setObservations([observationToAdd, ...observations]);
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
                    <Button type="button" onClick={handleAddObservation} disabled={!newObservation.trim()}>
                        Adicionar ao Histórico
                    </Button>
                </div>
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <h3 className="text-lg font-semibold">Histórico de Observações</h3>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
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