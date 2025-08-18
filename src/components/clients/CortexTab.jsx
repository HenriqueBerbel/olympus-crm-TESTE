import React, { useState } from 'react';
import { useToast } from '../../contexts/NotificationContext';
import Cortex from '../../services/Cortex';
import GlassPanel from '../GlassPanel';
import Button from '../Button';
import { SparklesIcon } from '../Icons';

// CORREÇÃO: Alterado de "export const" para uma constante
const CortexTab = ({ client }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSummarize = async () => {
        setIsLoading(true);
        setSummary('');
        const result = await Cortex.summarizeHistory(client);
        if (result.startsWith('Erro:')) {
            toast({ title: 'Erro do Córtex', description: result, variant: 'destructive' });
        } else {
            setSummary(result);
        }
        setIsLoading(false);
    };

    return (
        <div>
            <div className="flex items-center gap-4">
                <Button variant="violet" onClick={handleSummarize} disabled={isLoading}>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    {isLoading ? 'Analisando Histórico...' : 'Sumarizar Histórico com IA'}
                </Button>
            </div>
            {isLoading && <p className="mt-4 text-cyan-500 dark:text-cyan-400">O Córtex Gemini está processando as informações...</p>}
            {summary && (
                <GlassPanel className="mt-6 p-6 bg-gray-100 dark:bg-black/20">
                    <h4 className="font-semibold text-lg text-violet-600 dark:text-violet-300 mb-3">Resumo da IA</h4>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap prose dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-1">
                        {summary}
                    </div>
                </GlassPanel>
            )}
        </div>
    );
};

// CORREÇÃO: Adicionada a exportação padrão
export default CortexTab;