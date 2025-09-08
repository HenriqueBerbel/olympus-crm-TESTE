import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
    collection, onSnapshot, addDoc, doc, updateDoc, setDoc,
    deleteDoc, query, orderBy, where, serverTimestamp, getDocs, writeBatch
} from "firebase/firestore";
import { db } from '../firebase/firebase.js';
import { useAuth } from './AuthContext.jsx';
import { FileTextIcon, CheckSquareIcon } from '../components/Icons';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    // --- ESTADOS ---
    const [clients, setClients] = useState([]);
    const [leads, setLeads] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [operators, setOperators] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(null);
    const [leadColumns, setLeadColumns] = useState([]);
    const [taskColumns, setTaskColumns] = useState([]);
    const [completedEvents, setCompletedEvents] = useState([]);
    const [partners, setPartners] = useState([]);
    const [productions, setProductions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- FUNÇÃO DE LOG ---
    const logAction = useCallback(async (logData) => {
        if (!db || !user) return;
        try {
            await addDoc(collection(db, 'timeline'), {
                ...logData,
                userId: user.uid,
                userName: user.name,
                userAvatar: user.avatar || null,
                timestamp: serverTimestamp()
            });
        } catch (error) { console.error("Erro ao registrar log:", error); }
    }, [user]);

    // --- EFEITO PRINCIPAL PARA BUSCA DE DADOS ---
    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            const clearAllStates = [
                setClients, setLeads, setTasks, setUsers, setRoles, setTimeline,
                setOperators, setCommissions, setCompanyProfile, setLeadColumns,
                setTaskColumns, setCompletedEvents, setPartners, setProductions
            ];
            clearAllStates.forEach(setter => setter(setter === setCompanyProfile ? null : []));
            return;
        }

        setLoading(true);
        const collectionsToFetch = [
            { name: 'clients', setter: setClients }, { name: 'leads', setter: setLeads },
            { name: 'tasks', setter: setTasks }, { name: 'users', setter: setUsers },
            { name: 'roles', setter: setRoles }, { name: 'operators', setter: setOperators },
            { name: 'timeline', setter: setTimeline, sort: ['timestamp', 'desc'] },
            { name: 'commissions', setter: setCommissions }, { name: 'completed_events', setter: setCompletedEvents },
            { name: 'partners', setter: setPartners }, { name: 'productions', setter: setProductions }
        ];

        let initialLoadCount = collectionsToFetch.length + 3;
        const onInitialLoadDone = () => {
            initialLoadCount--;
            if (initialLoadCount <= 0) setLoading(false);
        };

        const unsubscribes = collectionsToFetch.map(({ name, setter, sort }) => {
            const q = sort ? query(collection(db, name), orderBy(...sort)) : collection(db, name);
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                onInitialLoadDone();
            }, (error) => { console.error(`Erro ao buscar ${name}:`, error); setter([]); onInitialLoadDone(); });
        });

        const unsubLeadCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'leads'), orderBy('order')), (s) => { setLeadColumns(s.docs.map(d => ({ id: d.id, ...d.data() }))); onInitialLoadDone(); });
        const unsubTaskCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'tasks'), orderBy('order')), (s) => { setTaskColumns(s.docs.map(d => ({ id: d.id, ...d.data() }))); onInitialLoadDone(); });
        const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (d) => { setCompanyProfile(d.exists() ? d.data() : null); onInitialLoadDone(); });

        unsubscribes.push(unsubLeadCols, unsubTaskCols, unsubProfile);
        
        return () => unsubscribes.forEach(unsub => unsub?.());
    }, [user]);

    // --- GERAÇÃO DE EVENTOS PARA O CALENDÁRIO ---
    const actionableEvents = useMemo(() => {
        const events = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // **CORREÇÃO CRÍTICA APLICADA AQUI**
        if (clients) {
            clients.forEach(client => {
                (client.contracts || []).forEach(contract => {
                    if (contract.status !== 'ativo' || !contract.boletoSentDate) return;
                    
                    const validDate = new Date(contract.boletoSentDate + 'T00:00:00');
                    const sendDay = validDate.getDate();

                    for (let monthOffset = -2; monthOffset <= 12; monthOffset++) {
                        const eventDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, sendDay);
                        const eventOccurrenceId = `boleto-${client.id}-${contract.id || ''}-${eventDate.getFullYear()}-${eventDate.getMonth()}`;

                        events.push({
                            id: eventOccurrenceId,
                            title: `Enviar boleto para ${client.general?.companyName || client.general?.holderName}`,
                            date: eventDate, type: 'boletoSend', color: 'bg-cyan-500', icon: FileTextIcon,
                            data: { client, contract }
                        });
                    }
                });
            });
        }
        
        if (tasks) {
            tasks.forEach(task => {
                if (task.dueDate && task.status !== 'Concluída') {
                    events.push({
                        id: `task-${task.id}`, title: `Tarefa: ${task.title}`,
                        date: new Date(task.dueDate + 'T00:00:00'), type: 'task',
                        color: task.color || 'bg-red-500', icon: CheckSquareIcon, data: { task }
                    });
                }
            });
        }
        return events;
    }, [clients, tasks]);

    // --- FUNÇÕES DE CRUD (Create, Read, Update, Delete) ---
    // **MELHORIA ARQUITETURAL: "FÁBRICA" DE FUNÇÕES CRUD**
    const createCrudHandlers = (collectionName, singularName, moduleName, nameField = 'name') => {
        const getName = (data) => {
            if (typeof nameField === 'function') return nameField(data);
            return nameField.split('.').reduce((o, i) => o?.[i], data) || `item sem nome`;
        };

        const add = useCallback(async (data) => {
            if (!db || !user) throw new Error("Usuário não autenticado.");
            let dataToSave = { ...data, ownerId: user.uid, createdAt: serverTimestamp() };
            if(collectionName === 'leads') dataToSave.lastActivityDate = serverTimestamp();
            const docRef = await addDoc(collection(db, collectionName), dataToSave);
            logAction({ actionType: 'CRIAÇÃO', module: moduleName, description: `criou o ${singularName} ${getName(dataToSave)}.` });
            return { id: docRef.id, ...dataToSave };
        }, [user, logAction]);

        const update = useCallback(async (id, data) => {
            if (!db) throw new Error("Conexão com o banco de dados perdida.");
            let dataToUpdate = {...data};
            if(collectionName === 'leads') dataToUpdate.lastActivityDate = serverTimestamp();
            if(collectionName === 'tasks' && data.status === 'Concluída') {
                const existingTask = (tasks || []).find(t => t.id === id);
                if (!existingTask?.completedAt) dataToUpdate.completedAt = serverTimestamp();
            }
            await updateDoc(doc(db, collectionName, id), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: moduleName, description: `atualizou o ${singularName} ${getName(dataToUpdate)}.` });
            return true;
        }, [user, logAction, tasks]);

        const remove = useCallback(async (id, itemName) => {
            if (!db) throw new Error("Conexão com o banco de dados perdida.");
            await deleteDoc(doc(db, collectionName, id));
            logAction({ actionType: 'EXCLUSÃO', module: moduleName, description: `excluiu o ${singularName} ${itemName}.` });
            return true;
        }, [logAction]);

        return { add, update, remove };
    };

    const { add: addClient, update: updateClient, remove: deleteClient } = createCrudHandlers('clients', 'cliente', 'Clientes', data => data.general?.companyName || data.general?.holderName);
    const { add: addLead, update: updateLead, remove: deleteLead } = createCrudHandlers('leads', 'lead', 'Leads');
    const { add: addTask, update: updateTask, remove: deleteTask } = createCrudHandlers('tasks', 'tarefa', 'Tarefas', 'title');
    const { add: addOperator, update: updateOperator, remove: deleteOperator } = createCrudHandlers('operators', 'operadora', 'Corporativo');
    const { add: addPartner, update: updatePartner, remove: deletePartner } = createCrudHandlers('partners', 'parceiro', 'Corporativo');
    const { add: addProduction, update: updateProduction, remove: deleteProduction } = createCrudHandlers('productions', 'produção', 'Produção', 'clientName');
    const { add: addCommission, update: updateCommission, remove: deleteCommission } = createCrudHandlers('commissions', 'comissão', 'Comissões', 'clientName');

    // --- FUNÇÕES ESPECÍFICAS (LÓGICA ORIGINAL RESTAURADA) ---
    const toggleEventCompletion = useCallback(async (event, isCompleted) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const completedEventsRef = collection(db, "completed_events");
        if (isCompleted) {
            await addDoc(completedEventsRef, {
                eventId: event.id,
                userId: user.uid,
                completedAt: serverTimestamp(),
            });
        } else {
            const q = query(completedEventsRef, where("eventId", "==", event.id), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        return true;
    }, [user]);

    const updateRole = useCallback(async (roleId, dataToUpdate) => {
        if (!db) throw new Error("Conexão com o banco de dados perdida.");
        const roleRef = doc(db, "roles", roleId);
        await updateDoc(roleRef, dataToUpdate);
        const roleName = roles.find(r => r.id === roleId)?.name || 'Desconhecido';
        logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `Atualizou as permissões do cargo ${roleName}.` });
        return true;
    }, [logAction, roles]);
    
    const deleteKanbanColumn = useCallback(async (columnId) => {
        if (!db) throw new Error("Conexão com o banco de dados perdida.");
        await deleteDoc(doc(db, "kanban_columns", columnId));
        logAction({ actionType: 'EXCLUSÃO', module: 'Kanban', description: `Excluiu uma coluna do quadro.` });
        return true;
    }, [logAction]);

    const updateCompanyProfile = useCallback(async (data) => {
        if (!db) throw new Error("Conexão com o banco de dados perdida.");
        const profileRef = doc(db, "company_profile", "main");
        await setDoc(profileRef, data, { merge: true });
        logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: 'Atualizou o perfil da empresa.' });
        return true;
    }, [logAction]);

    // --- VALOR DO CONTEXTO ---
    const value = useMemo(() => ({
        loading, clients, leads, tasks, users, roles, timeline, operators, 
        commissions, companyProfile, leadColumns, taskColumns, 
        completedEvents, partners, productions, actionableEvents,
        logAction, toggleEventCompletion, updateRole,
        addClient, updateClient, deleteClient,
        addLead, updateLead, deleteLead,
        addTask, updateTask, deleteTask,
        addOperator, updateOperator, deleteOperator,
        addPartner, updatePartner, deletePartner,
        addCommission, updateCommission, deleteCommission,
        addProduction, updateProduction, deleteProduction,
        deleteKanbanColumn, updateCompanyProfile,
    }), [
        loading, clients, leads, tasks, users, roles, timeline, operators, 
        commissions, companyProfile, leadColumns, taskColumns, completedEvents,
        partners, productions, actionableEvents, logAction, toggleEventCompletion,
        updateRole, addClient, updateClient, deleteClient, addLead, updateLead,
        deleteLead, addTask, updateTask, deleteTask, addOperator, updateOperator,
        deleteOperator, addPartner, updatePartner, deletePartner, addCommission,
        updateCommission, deleteCommission, addProduction, updateProduction,
        deleteProduction, deleteKanbanColumn, updateCompanyProfile
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === null) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};