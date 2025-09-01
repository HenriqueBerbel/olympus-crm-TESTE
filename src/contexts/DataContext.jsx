import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
    collection, onSnapshot, addDoc, doc, updateDoc, setDoc,
    deleteDoc, query, orderBy, where, serverTimestamp 
} from "firebase/firestore";
import { db } from '../firebase/firebase.js';
import { useAuth } from './AuthContext.jsx';
import { FileTextIcon, CheckSquareIcon } from '../components/Icons';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    // Estados
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
    
    // Função de Log
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

    // Efeito para buscar dados do Firestore
    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            setClients([]); setLeads([]); setTasks([]); setUsers([]); setRoles([]);
            setTimeline([]); setOperators([]); setCommissions([]); setCompanyProfile(null);
            setLeadColumns([]); setTaskColumns([]); setCompletedEvents([]); 
            setPartners([]); setProductions([]);
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

        // [MELHORIA] Gerenciamento preciso do estado de carregamento
        let initialLoads = collectionsToFetch.length + 3;
        const onInitialLoadDone = () => {
            initialLoads--;
            if (initialLoads <= 0) {
                setLoading(false);
            }
        };

        const unsubscribes = collectionsToFetch.map(({ name, setter, sort }) => {
            const collRef = collection(db, name);
            const q = sort ? query(collRef, orderBy(sort[0], sort[1])) : collRef;
            return onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                onInitialLoadDone();
            }, (error) => {
                console.error(`Erro ao buscar ${name}:`, error);
                setter([]);
                onInitialLoadDone();
            });
        });

        const unsubLeadCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'leads'), orderBy('order')), (snapshot) => { setLeadColumns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); onInitialLoadDone(); });
        const unsubTaskCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'tasks'), orderBy('order')), (snapshot) => { setTaskColumns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); onInitialLoadDone(); });
        const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (doc) => { setCompanyProfile(doc.exists() ? doc.data() : null); onInitialLoadDone(); });

        unsubscribes.push(unsubLeadCols, unsubTaskCols, unsubProfile);
        
        return () => unsubscribes.forEach(unsub => unsub?.());
    }, [user]);

    // Lógica de Geração de Eventos para o Calendário
    const actionableEvents = useMemo(() => {
        const events = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clients) {
            clients.forEach(client => {
                (client.contracts || []).forEach(contract => {
                    if (contract.status !== 'ativo') return;
                    if (contract.boletoSentDate) {
                        const validDate = new Date(contract.boletoSentDate);
                        const sendDay = validDate.getDate() + 1;
                        let eventDate = new Date(today.getFullYear(), today.getMonth(), sendDay);
                        if (eventDate < today) {
                            eventDate = new Date(today.getFullYear(), today.getMonth() + 1, sendDay);
                        }
                        events.push({
                            id: `boleto-${client.id}-${contract.id || ''}`,
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
                        id: `task-${task.id}`,
                        title: `Tarefa: ${task.title}`,
                        date: new Date(task.dueDate), type: 'task', color: task.color || 'bg-red-500', icon: CheckSquareIcon,
                        data: { task }
                    });
                }
            });
        }
        return events;
    }, [clients, tasks]);

    // --- FUNÇÕES CRUD COMPLETAS ---

    const updateRole = useCallback(async (roleId, dataToUpdate) => {
        if (!db) return false;
        try {
            const roleRef = doc(db, "roles", roleId);
            await updateDoc(roleRef, dataToUpdate);
            const roleName = roles.find(r => r.id === roleId)?.name || 'Desconhecido';
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `Atualizou as permissões do cargo ${roleName}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar cargo:", e); return false; }
    }, [logAction, roles]);

    const addClient = useCallback(async (clientData) => {
        if(!db || !user) return null;
        try {
            const dataToSave = { ...clientData, ownerId: user.uid, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "clients"), dataToSave);
            logAction({ actionType: 'CRIAÇÃO', module: 'Clientes', description: `criou o cliente ${clientData.general.holderName || clientData.general.companyName}.` });
            return { id: docRef.id, ...dataToSave };
        } catch (e) { console.error("Erro ao adicionar cliente:", e); return null; }
    }, [user, logAction]);
    
    const updateClient = useCallback(async (clientId, updatedData) => {
        if (!db) return false;
        try {
            const clientRef = doc(db, "clients", clientId);
            await updateDoc(clientRef, updatedData);
            logAction({ actionType: 'EDIÇÃO', module: 'Clientes', description: `atualizou o cliente ${updatedData.general?.holderName || updatedData.general?.companyName}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar cliente:", e); return false; }
    }, [logAction]);

    const deleteClient = useCallback(async (clientId, clientName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "clients", clientId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Clientes', description: `excluiu o cliente ${clientName}.` });
            return true;
        } catch (e) { console.error("Erro ao deletar cliente:", e); return false; }
    }, [logAction]);

    const addLead = useCallback(async (leadData) => {
        if(!db || !user) return null;
        try {
            const dataToSave = { ...leadData, ownerId: user.uid, createdAt: serverTimestamp(), lastActivityDate: serverTimestamp() };
            const docRef = await addDoc(collection(db, "leads"), dataToSave);
            logAction({ actionType: 'CRIAÇÃO', module: 'Leads', description: `criou o lead ${leadData.name}.` });
            return { id: docRef.id, ...dataToSave };
        } catch (e) { console.error("Erro ao adicionar lead:", e); return null; }
    }, [user, logAction]);

    const updateLead = useCallback(async (leadId, updatedData) => {
        if (!db) return false;
        try {
            await updateDoc(doc(db, "leads", leadId), { ...updatedData, lastActivityDate: serverTimestamp() });
            logAction({ actionType: 'EDIÇÃO', module: 'Leads', description: `atualizou o lead ${updatedData.name}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar lead:", e); return false; }
    }, [logAction]);

    const deleteLead = useCallback(async (leadId, leadName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "leads", leadId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Leads', description: `excluiu o lead ${leadName}.`});
            return true;
        } catch (error) { console.error("Falha ao deletar lead no DataContext:", error); return false; }
    }, [logAction]);

    const addTask = useCallback(async (taskData) => {
        if (!db || !user) return null;
        try {
            const dataToSave = { ...taskData, ownerId: user.uid, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "tasks"), dataToSave);
            
            if (taskData.assignedTo && taskData.assignedTo !== user.uid) {
                await addDoc(collection(db, "notifications"), {
                    recipientId: taskData.assignedTo, senderName: user.name,
                    message: `${user.name} atribuiu uma nova tarefa para você: "${taskData.title}"`,
                    page: 'tasks', isRead: false, createdAt: serverTimestamp(),
                });
            }
            
            logAction({ actionType: 'CRIAÇÃO', module: 'Tarefas', description: `criou a tarefa "${taskData.title}".` });
            return { id: docRef.id, ...dataToSave };
        } catch (e) { console.error("Erro ao adicionar tarefa:", e); return null; }
    }, [user, logAction]);

    const updateTask = useCallback(async (taskId, updatedData) => {
        if(!db) return false;
        try {
            const dataToUpdate = { ...updatedData };
            const existingTask = tasks.find(t => t.id === taskId);
            if (updatedData.status === 'Concluída' && !existingTask?.completedAt) {
                dataToUpdate.completedAt = serverTimestamp();
            }
            await updateDoc(doc(db, "tasks", taskId), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: 'Tarefas', description: `atualizou a tarefa "${updatedData.title}".` });
            return true;
        } catch (e) { console.error("Erro ao atualizar tarefa:", e); return false; }
    }, [logAction, tasks]);

    const deleteTask = useCallback(async (taskId, taskTitle) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "tasks", taskId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Tarefas', description: `excluiu a tarefa "${taskTitle}".`});
            return true;
        } catch (e) { console.error("Erro ao deletar tarefa:", e); return false; }
    }, [logAction]);

    const addOperator = useCallback(async (operatorData) => {
        if(!db) return false;
        try {
            await addDoc(collection(db, "operators"), operatorData);
            logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou a operadora ${operatorData.name}.` });
            return true;
        } catch (e) { console.error("Erro ao adicionar operadora:", e); return false; }
    }, [logAction]);
    
    const updateOperator = useCallback(async (operatorId, dataToUpdate) => {
        if(!db) return false;
        try {
            await updateDoc(doc(db, "operators", operatorId), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `atualizou a operadora ${dataToUpdate.name}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar operadora:", e); return false; }
    }, [logAction]);

    const deleteOperator = useCallback(async (operatorId, operatorName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "operators", operatorId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu a operadora ${operatorName}.` });
            return true;
        } catch (e) { console.error("Erro ao deletar operadora:", e); return false; }
    }, [logAction]);
    
    const addPartner = useCallback(async (partnerData) => {
        if(!db) return false;
        try {
            await addDoc(collection(db, "partners"), partnerData);
            logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou o parceiro ${partnerData.name}.` });
            return true;
        } catch (e) { console.error("Erro ao adicionar parceiro:", e); return false; }
    }, [logAction]);

    const updatePartner = useCallback(async (partnerId, partnerData) => {
        if(!db) return false;
        try {
            await updateDoc(doc(db, "partners", partnerId), partnerData);
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `atualizou o parceiro ${partnerData.name}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar parceiro:", e); return false; }
    }, [logAction]);
    
    const deletePartner = useCallback(async (partnerId, partnerName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "partners", partnerId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu o parceiro ${partnerName}.` });
            return true;
        } catch (e) { console.error("Erro ao deletar parceiro:", e); return false; }
    }, [logAction]);
    
    const addCommission = useCallback(async (commissionData) => {
        if(!db || !user) return null;
        try {
            const dataToSave = { ...commissionData, ownerId: user.uid, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "commissions"), dataToSave);
            logAction({ actionType: 'CRIAÇÃO', module: 'Comissões', description: `lançou comissão para ${commissionData.clientName}.` });
            return { id: docRef.id, ...dataToSave };
        } catch (e) { console.error("Erro ao adicionar comissão:", e); return null; }
    }, [user, logAction]);
    
    const addProduction = useCallback(async (productionData) => {
        if(!db || !user) return null;
        try {
            const dataToSave = { ...productionData, ownerId: user.uid, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, "productions"), dataToSave);
            logAction({ actionType: 'CRIAÇÃO', module: 'Produção', description: `lançou produção para ${productionData.clientName}.` });
            return { id: docRef.id, ...dataToSave };
        } catch(e) { console.error("Erro ao adicionar produção:", e); return null; }
    }, [user, logAction]);

    const updateProduction = useCallback(async (productionId, dataToUpdate) => {
        if(!db) return false;
        try {
            await updateDoc(doc(db, "productions", productionId), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: 'Produção', description: `atualizou a produção do cliente ${dataToUpdate.clientName}.` });
            return true;
        } catch (e) { console.error("Erro ao atualizar produção:", e); return false; }
    }, [logAction]);

    const deleteProduction = useCallback(async (productionId, clientName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "productions", productionId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Produção', description: `excluiu a produção do cliente ${clientName}.` });
            return true;
        } catch (e) { console.error("Erro ao deletar produção:", e); return false; }
    }, [logAction]);
    
    const deleteKanbanColumn = useCallback(async (columnId) => {
        if (!db) return false;
        try {
            await deleteDoc(doc(db, "kanban_columns", columnId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Kanban', description: `Excluiu uma coluna do quadro.` });
            return true;
        } catch (error) { console.error("Erro ao deletar coluna Kanban:", error); return false; }
    }, [logAction]);

    const updateCompanyProfile = useCallback(async (data) => {
        if (!db) return false;
        try {
            const profileRef = doc(db, "company_profile", "main");
            await setDoc(profileRef, data, { merge: true });
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: 'Atualizou o perfil da empresa.' });
            return true;
        } catch (error) { console.error("Erro ao atualizar perfil da empresa:", error); return false; }
    }, [logAction]);

    const value = useMemo(() => ({
        loading,
        clients, leads, tasks, users, roles, timeline, operators, 
        commissions, companyProfile, leadColumns, taskColumns, 
        completedEvents, partners, productions,
        actionableEvents,
        logAction,
        updateRole,
        addClient, updateClient, deleteClient,
        addLead, updateLead, deleteLead,
        addTask, updateTask, deleteTask,
        addOperator, updateOperator, deleteOperator,
        addPartner, updatePartner, deletePartner,
        addCommission,
        addProduction, updateProduction, deleteProduction,
        deleteKanbanColumn,
        updateCompanyProfile,
    }), [
        loading, clients, leads, tasks, users, roles, timeline, operators, 
        commissions, companyProfile, leadColumns, taskColumns, 
        completedEvents, partners, productions,
        actionableEvents, logAction, updateRole, 
        addClient, updateClient, deleteClient, addLead, updateLead, deleteLead,
        addTask, updateTask, deleteTask, addOperator, updateOperator, deleteOperator,
        addPartner, updatePartner, deletePartner, addCommission, addProduction, 
        updateProduction, deleteProduction, deleteKanbanColumn, updateCompanyProfile
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);