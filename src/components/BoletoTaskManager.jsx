import { useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../firebase/firebase';
import { useData } from '../contexts/DataContext';

const BoletoTaskManager = () => {
    const { actionableEvents, users, addTask } = useData();
    const isSyncing = useRef(false);

    useEffect(() => {
        const syncEventsToTasks = async () => {
            if (isSyncing.current) {
                return;
            }
            isSyncing.current = true;
            console.log("BoletoTaskManager: Iniciando sincronização...");

            try {
                // CORREÇÃO: Verifica se 'actionableEvents' e 'users' existem antes de usar '.length'
                if (!actionableEvents || !users || !db) {
                    console.log("BoletoTaskManager: Dados necessários (eventos, usuários) ainda não disponíveis. Aguardando...");
                    isSyncing.current = false;
                    return;
                }

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const pendingBoletoEvents = actionableEvents.filter(event => {
                    if (event.type !== 'boletoSend') return false;
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    // Lógica para processar eventos pendentes
                    return eventDate <= hoje && eventDate.getFullYear() >= (hoje.getFullYear() - 1);
                });

                if (pendingBoletoEvents.length === 0) {
                    isSyncing.current = false;
                    console.log("BoletoTaskManager: Nenhum evento de boleto pendente para processar.");
                    return;
                }
                
                for (const event of pendingBoletoEvents) {
                    const { client, contract, originalDate } = event.data;
                    const clientDisplayName = client.general?.companyName || client.general?.holderName || 'Cliente Sem Nome';

                    const tasksRef = collection(db, 'tasks');
                    const q = query(tasksRef,
                        where('isBoletoTask', '==', true),
                        where('linkedToId', '==', client.id),
                        where('boletoCycle', '==', originalDate)
                    );

                    const querySnapshot = await getDocs(q);
                    const taskAlreadyExists = !querySnapshot.empty;

                    if (!taskAlreadyExists) {
                        console.log(`CRIANDO tarefa para ${clientDisplayName}, ciclo ${originalDate}`);

                        const tituloTarefa = `Enviar Boleto - ${clientDisplayName}`;
                        const description = `Acessar portal da ${contract.planOperator || 'Operadora'} para o boleto de ${originalDate.split('-')[1]}/${originalDate.split('-')[0]}.\n\nEnviar para o WhatsApp:\nhttps://wa.me/55${(client.general.contactPhone || client.general.phone || '').replace(/\D/g, '')}`;

                        const newTask = {
                            title: tituloTarefa,
                            description: description,
                            assignedTo: contract.boletoResponsibleId,
                            dueDate: event.date.toISOString().split('T')[0],
                            priority: 'Alta',
                            status: 'Pendente',
                            color: '#0EA5E9',
                            linkedToId: client.id,
                            linkedToType: 'client',
                            archived: false,
                            isBoletoTask: true,
                            boletoCycle: originalDate
                        };
                        await addTask(newTask);
                    }
                }
            } catch (error) {
                // Linha 78, onde o erro era logado
                console.error("BoletoTaskManager: Erro.", error);
            } finally {
                isSyncing.current = false;
                console.log("BoletoTaskManager: Sincronização finalizada.");
            }
        };

        // Roda a sincronização após um tempo inicial e depois a cada 5 minutos
        const initialSyncTimeout = setTimeout(syncEventsToTasks, 5000); 
        const intervalId = setInterval(syncEventsToTasks, 300000); 

        return () => {
            clearTimeout(initialSyncTimeout);
            clearInterval(intervalId);
        };
    }, [actionableEvents, users, addTask]);

    return null; // Este componente não renderiza nada na tela
};

export default BoletoTaskManager;