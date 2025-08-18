import React from 'react';
import { useData } from '../../contexts/DataContext';

// CORREÇÃO: A importação do DetailItem agora é 'default' (sem chaves)
import DetailItem from '../DetailItem';

const InternalTab = ({ client }) => {
    const { users } = useData();

    // Lógica para encontrar os nomes do corretor e supervisor a partir de seus IDs
    const broker = users.find(u => u.id === client?.internal?.brokerId);
    const supervisor = users.find(u => u.id === client?.internal?.supervisorId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <DetailItem label="Corretor Responsável">
                {broker ? broker.name : 'Não definido'}
            </DetailItem>
            <DetailItem label="Supervisor">
                {supervisor ? supervisor.name : 'Não definido'}
            </DetailItem>
            {/* Adicione outros DetailItems para outros dados internos aqui, se necessário */}
        </div>
    );
};

// Mantendo o padrão para componentes de aba
export default InternalTab;