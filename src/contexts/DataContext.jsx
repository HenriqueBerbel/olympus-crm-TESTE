import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase/firebase.js'; // <-- CORREÇÃO APLICADA AQUI
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [data, setData] = useState({
        clients: undefined,
        leads: undefined,
        tasks: undefined,
        users: undefined,
        timeline: undefined,
        operators: undefined,
        commissions: undefined,
        companyProfile: undefined,
        leadColumns: undefined,
        taskColumns: undefined,
        completedEvents: undefined,
        partners: undefined,
        productions: undefined,
    });
    const [loading, setLoading] = useState(true);

    const logAction = async (logData) => {
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
    };

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        const collectionsToFetch = {
            clients: 'clients',
            leads: 'leads',
            tasks: 'tasks',
            users: 'users',
            operators: 'operators',
            timeline: 'timeline',
            commissions: 'commissions',
            completedEvents: 'completed_events',
            partners: 'partners',
            productions: 'productions'
        };
        
        const unsubscribes = Object.entries(collectionsToFetch).map(([stateKey, collectionName]) => {
            const q = collectionName === 'timeline'
                ? query(collection(db, collectionName), orderBy('timestamp', 'desc'))
                : collection(db, collectionName);
            
            return onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(prev => ({ ...prev, [stateKey]: items }));
            }, (error) => {
                console.error(`Erro ao buscar ${collectionName}:`, error);
                setData(prev => ({...prev, [stateKey]: []}));
            });
        });

        const unsubLeadCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'leads'), orderBy('order')), (snapshot) => setData(prev => ({...prev, leadColumns: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))})));
        const unsubTaskCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'tasks'), orderBy('order')), (snapshot) => setData(prev => ({...prev, taskColumns: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))})));
        unsubscribes.push(unsubLeadCols, unsubTaskCols);

        const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (doc) => setData(prev => ({ ...prev, companyProfile: doc.exists() ? doc.data() : {} })));
        unsubscribes.push(unsubProfile);
        
        const timer = setTimeout(() => setLoading(false), 2500);
        
        return () => {
            unsubscribes.forEach(unsub => unsub?.());
            clearTimeout(timer);
        };
    }, []);

    // --- Funções CRUD (Create, Read, Update, Delete) ---

    const addClient = async (clientData) => {
        if(!db) return null;
        try {
            const docRef = await addDoc(collection(db, "clients"), { ...clientData, createdAt: serverTimestamp() });
            logAction({ actionType: 'CRIAÇÃO', module: 'Clientes', description: `criou o cliente ${clientData.general.holderName || clientData.general.companyName}.` });
            return { id: docRef.id, ...clientData };
        } catch (e) { return null; }
    };
    
    const updateClient = async (clientId, updatedData) => {
        if (!db) return null;
        try {
            const clientRef = doc(db, "clients", clientId);
            await updateDoc(clientRef, updatedData);
            logAction({ actionType: 'EDIÇÃO', module: 'Clientes', description: `atualizou o cliente ${updatedData.general?.holderName || updatedData.general?.companyName}.` });
            return { id: clientId, ...updatedData };
        } catch (e) { return null; }
    };

    const deleteClient = async (clientId, clientName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "clients", clientId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Clientes', description: `excluiu o cliente ${clientName}.` });
            return true;
        } catch (e) { return false; }
    };

    const addLead = async (leadData) => {
        if(!db) return null;
        try {
            const docRef = await addDoc(collection(db, "leads"), {...leadData, createdAt: serverTimestamp(), lastActivityDate: serverTimestamp()});
            logAction({ actionType: 'CRIAÇÃO', module: 'Leads', description: `criou o lead ${leadData.name}.` });
            return { id: docRef.id, ...leadData };
        } catch (e) { return null; }
    };

    const updateLead = async (leadId, updatedData) => {
        if (!db) return false;
        try {
            await updateDoc(doc(db, "leads", leadId), { ...updatedData, lastActivityDate: serverTimestamp() });
            logAction({ actionType: 'EDIÇÃO', module: 'Leads', description: `atualizou o lead ${updatedData.name}.` });
            return true;
        } catch (e) { return false; }
    };

    const deleteLead = async (leadId, leadName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "leads", leadId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Leads', description: `excluiu o lead ${leadName}.`});
            return true;
        } catch (e) { return false; }
    };

    const addTask = async (taskData) => {
        if (!db || !user) return null;
        try {
            const docRef = await addDoc(collection(db, "tasks"), { ...taskData, createdAt: serverTimestamp() });
            
            if (taskData.assignedTo && taskData.assignedTo !== user.uid) {
                await addDoc(collection(db, "notifications"), {
                    recipientId: taskData.assignedTo,
                    senderName: user.name,
                    message: `${user.name} atribuiu uma nova tarefa para você: "${taskData.title}"`,
                    page: 'tasks',
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }
            
            logAction({ actionType: 'CRIAÇÃO', module: 'Tarefas', description: `criou a tarefa "${taskData.title}".` });
            return { id: docRef.id, ...taskData };
        } catch (e) {
            console.error("Erro ao adicionar tarefa:", e);
            return null;
        }
    };

    const updateTask = async (taskId, updatedData) => {
        if(!db) return false;
        try {
            const dataToUpdate = { ...updatedData };
            if (updatedData.status === 'Concluída' && (!data.tasks.find(t=>t.id === taskId).completedAt) ) {
                dataToUpdate.completedAt = serverTimestamp();
            }
            await updateDoc(doc(db, "tasks", taskId), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: 'Tarefas', description: `atualizou a tarefa "${updatedData.title}".` });
            return true;
        } catch (e) { return false; }
    };

    const deleteTask = async (taskId, taskTitle) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "tasks", taskId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Tarefas', description: `excluiu a tarefa "${taskTitle}".`});
            return true;
        } catch (e) { return false; }
    };

    const addOperator = async (operatorData) => {
        if(!db) return false;
        try {
            await addDoc(collection(db, "operators"), operatorData);
            logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou a operadora ${operatorData.name}.` });
            return true;
        } catch (e) { return false; }
    };
    
    const deleteOperator = async (operatorId, operatorName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "operators", operatorId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu a operadora ${operatorName}.` });
            return true;
        } catch (e) { return false; }
    };
    
    const updateOperator = async (operatorId, dataToUpdate) => {
        if(!db) return false;
        try {
            await updateDoc(doc(db, "operators", operatorId), dataToUpdate);
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `atualizou a operadora ${dataToUpdate.name}.` });
            return true;
        } catch (e) { return false; }
    };

    const addPartner = async (partnerData) => {
        if(!db) return false;
        try {
            await addDoc(collection(db, "partners"), partnerData);
            logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou o parceiro ${partnerData.name}.` });
            return true;
        } catch (e) { return false; }
    };

    const updatePartner = async (partnerId, partnerData) => {
        if(!db) return false;
        try {
            await updateDoc(doc(db, "partners", partnerId), partnerData);
            logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `atualizou o parceiro ${partnerData.name}.` });
            return true;
        } catch (e) { return false; }
    };
    
    const deletePartner = async (partnerId, partnerName) => {
        if(!db) return false;
        try {
            await deleteDoc(doc(db, "partners", partnerId));
            logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu o parceiro ${partnerName}.` });
            return true;
        } catch (e) { return false; }
    };
    
    const addCommission = async (commissionData) => {
        if(!db) return null;
        try {
            const docRef = await addDoc(collection(db, "commissions"), { ...commissionData, createdAt: serverTimestamp() });
            logAction({ actionType: 'CRIAÇÃO', module: 'Comissões', description: `lançou comissão para ${commissionData.clientName}.` });
            return { id: docRef.id, ...commissionData };
        } catch (e) { return null; }
    };
    
    const value = {
        ...data,
        loading,
        logAction,
        addClient,
        updateClient,
        deleteClient,
        addLead,
        updateLead,
        deleteLead,
        addTask,
        updateTask,
        deleteTask,
        addOperator,
        deleteOperator,
        updateOperator,
        addPartner,
        updatePartner,
        deletePartner,
        addCommission,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
