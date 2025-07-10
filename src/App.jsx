import React, { useState, createContext, useContext, useEffect, useRef, forwardRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';

// Importações do Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser as deleteFirebaseAuthUser } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, orderBy, where, getDocs, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from './firebase.js';


// --- ÍCONES SVG (Otimizados com React.memo) ---
const IconWrapper = memo((props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />);
const HomeIcon = memo((props) => <IconWrapper {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></IconWrapper>);
const UsersIcon = memo((props) => <IconWrapper {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconWrapper>);
const BuildingIcon = memo((props) => <IconWrapper {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="9" y2="9.01"></line><line x1="15" y1="9" x2="15" y2="9.01"></line><line x1="9" y1="15" x2="9" y2="15.01"></line><line x1="15" y1="15" x2="15" y2="15.01"></line></IconWrapper>);
const CalendarIcon = memo((props) => <IconWrapper {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></IconWrapper>);
const BellIcon = memo((props) => <IconWrapper {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></IconWrapper>);
const PlusCircleIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></IconWrapper>);
const SearchIcon = memo((props) => <IconWrapper {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></IconWrapper>);
const FilterIcon = memo((props) => <IconWrapper {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></IconWrapper>);
const UserCircleIcon = memo((props) => <IconWrapper {...props}><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></IconWrapper>);
const ChevronLeftIcon = memo((props) => <IconWrapper {...props}><polyline points="15 18 9 12 15 6" /></IconWrapper>);
const ChevronRightIcon = memo((props) => <IconWrapper {...props}><polyline points="9 18 15 12 9 6" /></IconWrapper>);
const ChevronDownIcon = memo((props) => <IconWrapper {...props}><polyline points="6 9 12 15 18 9" /></IconWrapper>);
const CopyIcon = memo((props) => <IconWrapper {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></IconWrapper>);
const EyeIcon = memo((props) => <IconWrapper {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></IconWrapper>);
const EyeOffIcon = memo((props) => <IconWrapper {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></IconWrapper>);
const Trash2Icon = memo((props) => <IconWrapper {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></IconWrapper>);
const PencilIcon = memo((props) => <IconWrapper {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></IconWrapper>);
const XIcon = memo((props) => <IconWrapper {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper>);
const LogOutIcon = memo((props) => <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></IconWrapper>);
const SunIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconWrapper>);
const MoonIcon = memo((props) => <IconWrapper {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></IconWrapper>);
const InfoIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></IconWrapper>);
const TargetIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></IconWrapper>);
const CheckSquareIcon = memo((props) => <IconWrapper {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></IconWrapper>);
const ZapIcon = memo((props) => <IconWrapper {...props} className="text-violet-500 dark:text-violet-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconWrapper>);
const HistoryIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></IconWrapper>);
const CommandIcon = memo((props) => <IconWrapper {...props}><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></IconWrapper>);
const SparklesIcon = memo((props) => <IconWrapper {...props}><path d="M9.96 5.04a2.5 2.5 0 1 0-3.52 3.52" /><path d="M2.5 2.5 5 5" /><path d="M12 3a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1Z" /><path d="M21 12h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M3 12H1a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M12 21a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Z" /><path d="m18.54 5.46-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m6.87 17.13-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m18.54 18.54-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /><path d="m6.87 6.87-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /></IconWrapper>);
const FileTextIcon = memo((props) => <IconWrapper {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></IconWrapper>);
const AlertTriangleIcon = memo((props) => <IconWrapper {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></IconWrapper>);
const RefreshCwIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M3 12a9 9 0 0 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></IconWrapper>);
const TrendingUpIcon = memo((props) => <IconWrapper {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></IconWrapper>);
const DollarSignIcon = memo((props) => <IconWrapper {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></IconWrapper>);
const BarChart2Icon = memo((props) => <IconWrapper {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IconWrapper>);
const PieChartIcon = memo((props) => <IconWrapper {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></IconWrapper>);
const BriefcaseIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></IconWrapper>);
const AwardIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></IconWrapper>);


// --- UTILS & HELPERS ---
const cn = (...inputs) => inputs.flat().filter(Boolean).join(' ');
const calculateAge = (dob) => { if (!dob) return null; const age = new Date(new Date() - new Date(dob)).getFullYear() - 1970; return age; };
const formatDate = (dateString) => dateString ? new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
const formatDateTime = (timestamp) => timestamp?.toDate ? timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

// --- CÓRTEX GEMINI ---
const GEMINI_API_KEY = "AIzaSyCO10TMykkiY5dIBQiOLhr38GcjuV8rN0k";

const Cortex = {
    run: async (prompt) => {
        if (!GEMINI_API_KEY) return "Erro: Chave de API não configurada.";
        const api_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(api_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Erro na API Gemini:", response.status, errorBody);
                return `Erro na API: ${response.status}`;
            }
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Falha ao contatar a API do Gemini:", error);
            return "Erro de conexão com a IA.";
        }
    },
    analyzeLead: async (lead) => {
        const prompt = `Analise as seguintes notas sobre um lead de vendas e retorne um score de 1 a 100 e uma breve justificativa. O formato da resposta deve ser um JSON com as chaves "score" (number) e "justification" (string). Notas do Lead: "${lead.notes || 'Nenhuma nota fornecida.'}"`;
        const resultText = await Cortex.run(prompt);
        if (typeof resultText !== 'string' || resultText.startsWith('Erro')) {
            console.error("Cortex.run returned an error or invalid data:", resultText);
            const justification = resultText.includes('429') ? "Análise indisponível (limite de quota atingido)." : "Não foi possível analisar as notas (erro de API).";
            return { score: 0, justification };
        }
        try {
            return JSON.parse(resultText.replace(/```json|```/g, '').trim());
        } catch (e) {
            console.error("Erro ao parsear a resposta da IA para Lead Scoring:", e);
            return { score: 50, justification: "Não foi possível analisar as notas." };
        }
    },
    summarizeHistory: async (client) => {
        const observationsText = (client.observations || []).map(obs => `Em ${formatDateTime(obs.timestamp)} por ${obs.authorName}: ${obs.text}`).join('\n');
        const prompt = `Resuma o seguinte histórico de observações de um cliente em 3 a 4 bullet points concisos. Foque nos pontos mais importantes para um rápido entendimento do relacionamento. Histórico: "${observationsText || 'Nenhum histórico de observações.'}"`;
        return await Cortex.run(prompt);
    }
};

// --- CONTEXTOS E PROVIDERS ---
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    const value = { theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
const useTheme = () => useContext(ThemeContext);

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                if (!db) {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'Usuário', permissionLevel: 'Corretor' });
                    setLoading(false);
                    return;
                }
                const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
                    setUser(doc.exists() ? { uid: firebaseUser.uid, email: firebaseUser.email, ...doc.data() } : { uid: firebaseUser.uid, email: firebaseUser.email, name: 'Usuário Incompleto', permissionLevel: 'Corretor' });
                    setLoading(false);
                });
                return () => unsubDoc();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
    }, []);

    const login = async (email, password) => { if (!auth) return { success: false, code: 'auth/no-firebase' }; try { await signInWithEmailAndPassword(auth, email, password); return { success: true }; } catch (error) { return { success: false, code: error.code }; } };
    const logout = async () => { if (auth) await signOut(auth).catch(e => console.error("Logout error", e)); };
    const addUser = async (userData) => { if (!auth || !db) return { success: false, code: 'auth/no-firebase' }; try { const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password); const { password, ...dataToSave } = userData; await setDoc(doc(db, "users", cred.user.uid), dataToSave); return { success: true }; } catch (error) { return { success: false, code: error.code }; } };
    const deleteUser = async (userId) => { if (!db) return false; try { await deleteDoc(doc(db, "users", userId)); return true; } catch (error) { console.error("Erro ao apagar usuário:", error); return false; } };
    const updateUserProfile = async (uid, data) => { if (!db) return false; try { await updateDoc(doc(db, "users", uid), data); return true; } catch (error) { console.error("Erro ao atualizar perfil:", error); return false; } };
    const updateUserPassword = async (currentPassword, newPassword) => { const user = auth?.currentUser; if (!user) return 'no-user'; try { await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword)); await updatePassword(user, newPassword); return true; } catch (error) { return error.code; } };
    
    const value = { user, loading, login, logout, addUser, deleteUser, updateUserProfile, updateUserPassword };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

const DataContext = createContext();
const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [data, setData] = useState({ clients: [], leads: [], tasks: [], users: [], timeline: [], operators: [], companyProfile: {}, loading: true });

    const logAction = async (logData) => { if (!db || !user) return; try { await addDoc(collection(db, 'timeline'), { ...logData, userId: user.uid, userName: user.name, userAvatar: user.avatar || null, timestamp: serverTimestamp() }); } catch (error) { console.error("Erro ao registrar log:", error); } };
    
    useEffect(() => {
        if (!db) { setData(d => ({ ...d, loading: false })); return; }
        const collections = { clients: 'clients', leads: 'leads', tasks: 'tasks', users: 'users', operators: 'operators', timeline: 'timeline' };
        
        const unsubscribes = Object.entries(collections).map(([stateKey, collectionName]) => {
            const q = collectionName === 'timeline' ? query(collection(db, collectionName), orderBy('timestamp', 'desc')) : collection(db, collectionName);
            return onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(prev => ({ ...prev, [stateKey]: items }));
            }, (error) => console.error(`Erro ao buscar ${collectionName}:`, error));
        });

        const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (doc) => setData(prev => ({ ...prev, companyProfile: doc.exists() ? doc.data() : {} })));
        unsubscribes.push(unsubProfile);
        
        const timer = setTimeout(() => setData(d => ({ ...d, loading: false })), 1500);
        
        return () => { unsubscribes.forEach(unsub => unsub?.()); clearTimeout(timer); };
    }, []);

    const addClient = async (clientData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "clients"), clientData); logAction({ actionType: 'CRIAÇÃO', module: 'Clientes', description: `criou o cliente ${clientData.general.holderName}.`, entity: { type: 'Cliente', id: docRef.id, name: clientData.general.holderName }, linkTo: `/clients/${docRef.id}` }); return { id: docRef.id, ...clientData }; } catch (e) { console.error("Erro ao adicionar cliente:", e); return null; } };
    const updateClient = async (clientId, updatedData) => { if (!db) return null; try { const clientRef = doc(db, "clients", clientId); await updateDoc(clientRef, updatedData); logAction({ actionType: 'EDIÇÃO', module: 'Clientes', description: `atualizou o cliente ${updatedData.general?.holderName || 'sem nome'}.`, entity: { type: 'Cliente', id: clientId, name: updatedData.general?.holderName }, linkTo: `/clients/${clientId}`}); return { id: clientId, ...updatedData }; } catch (e) { console.error("Erro ao atualizar cliente:", e); return null; } };
    const deleteClient = async (clientId, clientName) => { if(!db) return false; try { await deleteDoc(doc(db, "clients", clientId)); logAction({ actionType: 'EXCLUSÃO', module: 'Clientes', description: `excluiu o cliente ${clientName}.`, entity: { type: 'Cliente', id: clientId, name: clientName } }); return true; } catch (e) { console.error("Erro ao apagar cliente:", e); return false; } };
    const addLead = async (leadData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "leads"), {...leadData, createdAt: serverTimestamp(), lastActivityDate: serverTimestamp()}); logAction({ actionType: 'CRIAÇÃO', module: 'Leads', description: `criou o lead ${leadData.name}.`, entity: { type: 'Lead', id: docRef.id, name: leadData.name } }); return { id: docRef.id, ...leadData }; } catch (e) { console.error("Erro ao adicionar lead:", e); return null; } };
    const updateLead = async (leadId, updatedData) => { if (!db) return false; try { await updateDoc(doc(db, "leads", leadId), { ...updatedData, lastActivityDate: serverTimestamp() }); logAction({ actionType: 'EDIÇÃO', module: 'Leads', description: `atualizou o lead ${updatedData.name}.`}); return true; } catch (e) { console.error("Erro ao atualizar lead:", e); return false; } };
    const deleteLead = async (leadId, leadName) => { if(!db) return false; try { await deleteDoc(doc(db, "leads", leadId)); logAction({ actionType: 'EXCLUSÃO', module: 'Leads', description: `excluiu o lead ${leadName}.`}); return true; } catch (e) { console.error("Erro ao apagar lead:", e); return false; } };
    const convertLeadToClient = async (lead) => { return true; };
    const addTask = async (taskData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "tasks"), {...taskData, createdAt: serverTimestamp()}); logAction({ actionType: 'CRIAÇÃO', module: 'Tarefas', description: `criou a tarefa "${taskData.title}".`, entity: { type: 'Tarefa', id: docRef.id, name: taskData.title } }); return { id: docRef.id, ...taskData }; } catch (e) { console.error("Erro ao adicionar tarefa:", e); return null; } };
    const updateTask = async (taskId, updatedData) => { if(!db) return false; try { await updateDoc(doc(db, "tasks", taskId), updatedData); logAction({ actionType: 'EDIÇÃO', module: 'Tarefas', description: `atualizou a tarefa "${updatedData.title}".`}); return true; } catch (e) { console.error("Erro ao atualizar tarefa:", e); return false; } };
    const deleteTask = async (taskId, taskTitle) => { if(!db) return false; try { await deleteDoc(doc(db, "tasks", taskId)); logAction({ actionType: 'EXCLUSÃO', module: 'Tarefas', description: `excluiu a tarefa "${taskTitle}".`}); return true; } catch (e) { console.error("Erro ao apagar tarefa:", e); return false; } };
    const addOperator = async (operatorData) => { if(!db) return false; try { await addDoc(collection(db, "operators"), operatorData); logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou a operadora ${operatorData.name}.` }); return true; } catch (e) { return false; } };
    const deleteOperator = async (operatorId, operatorName) => { if(!db) return false; try { await deleteDoc(doc(db, "operators", operatorId)); logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu a operadora ${operatorName}.` }); return true; } catch (e) { return false; } };
    const updateCompanyProfile = async (data) => { if(!db) return false; try { await setDoc(doc(db, 'company_profile', 'main'), data); logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: 'atualizou os dados da empresa.' }); return true; } catch (e) { console.error("Erro ao atualizar perfil da empresa:", e); return false; }};

    const value = { ...data, getClientById: (id) => data.clients.find(c => c.id === id), addClient, updateClient, deleteClient, addLead, updateLead, deleteLead, convertLeadToClient, addTask, updateTask, deleteTask, addOperator, deleteOperator, updateCompanyProfile, logAction };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
const useData = () => useContext(DataContext);

const NotificationContext = createContext();
const NotificationProvider = ({ children }) => { const [toasts, setToasts] = useState([]); const toast = ({ title, description, variant = 'default' }) => { const id = Date.now(); setToasts(prev => [...prev, { id, title, description, variant }]); setTimeout(() => setToasts(t => t.filter(currentToast => currentToast.id !== id)), 5000); }; return <NotificationContext.Provider value={{ toast, toasts }}>{children}<Toaster /></NotificationContext.Provider>; };
const useToast = () => useContext(NotificationContext);

const ConfirmContext = createContext();
const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState(null);
    const awaitingPromiseRef = useRef();
    const openConfirmation = (options) => { setConfirmState(options); return new Promise((resolve, reject) => { awaitingPromiseRef.current = { resolve, reject }; }); };
    const handleClose = () => { if (awaitingPromiseRef.current) awaitingPromiseRef.current.reject(); setConfirmState(null); };
    const handleConfirm = () => { if (awaitingPromiseRef.current) awaitingPromiseRef.current.resolve(); setConfirmState(null); };
    return (<ConfirmContext.Provider value={openConfirmation}>{children}<ConfirmModal isOpen={!!confirmState} onClose={handleClose} onConfirm={handleConfirm} {...confirmState} /></ConfirmContext.Provider>);
};
const useConfirm = () => useContext(ConfirmContext);

// --- COMPONENTES DE UI (Condensados) ---
const GlassPanel = memo(forwardRef(({ className, children, cortex = false, ...props }, ref) => <div ref={ref} className={cn("bg-white/70 dark:bg-[#161b22]/50 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20", cortex && "cortex-active", className)} {...props}>{children}</div>));
const Button = memo(forwardRef(({ className, variant = 'default', size, children, ...props }, ref) => { const variants = { default: "bg-cyan-500 text-white hover:bg-cyan-600 dark:shadow-[0_0_20px_rgba(6,182,212,0.5)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]", destructive: "bg-red-600 text-white hover:bg-red-700 dark:shadow-[0_0_15px_rgba(220,38,38,0.5)]", outline: "border border-cyan-500/50 bg-transparent text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 hover:border-cyan-500 dark:hover:border-cyan-400", ghost: "hover:bg-gray-900/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white", violet: "bg-violet-600 text-white hover:bg-violet-700 dark:shadow-[0_0_20px_rgba(192,38,211,0.5)]" }; const sizes = { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" }; return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} {...props}>{children}</button>; }));
const Input = memo(forwardRef(({ className, error, ...props }, ref) => <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all", error && "border-red-500 ring-red-500", className)} {...props} />));
const Label = memo(forwardRef(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-medium text-gray-600 dark:text-gray-400", className)} {...props} />));
const Textarea = memo(forwardRef(({ className, ...props }, ref) => <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all", className)} {...props} />));
const Select = memo(forwardRef(({ className, children, error, ...props }, ref) => <div className="relative"><select ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all appearance-none pr-8", error && "border-red-500 ring-red-500", className)} {...props}>{children}</select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" /></div></div>));
const DateField = memo(forwardRef(({ className, ...props }, ref) => <div className="relative"><Input ref={ref} type="date" className={cn("pr-10", className)} {...props} /><div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><CalendarIcon className="h-5 w-5 text-gray-400" /></div></div>));
const Checkbox = memo(forwardRef(({ className, ...props }, ref) => <input type="checkbox" ref={ref} className={cn("h-4 w-4 shrink-0 rounded-sm border-2 border-cyan-500/50 text-cyan-500 bg-gray-200 dark:bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900", className)} {...props} />));
const TabsContext = createContext();
const Tabs = ({ defaultValue, children, className }) => { const [activeTab, setActiveTab] = useState(defaultValue); return <TabsContext.Provider value={{ activeTab, setActiveTab }}><div className={className}>{children}</div></TabsContext.Provider>; };
const TabsList = ({ children, className }) => <div className={cn("flex items-center border-b border-gray-200 dark:border-white/10 overflow-x-auto", className)}>{children}</div>;
const TabsTrigger = ({ value, children, className }) => { const { activeTab, setActiveTab } = useContext(TabsContext); const isActive = activeTab === value; return <button type="button" onClick={() => setActiveTab(value)} className={cn("relative inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 disabled:pointer-events-none", isActive ? "text-cyan-500 dark:text-cyan-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white", className)}>{children}{isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}</button>; };
const TabsContent = ({ value, children, className }) => { const { activeTab } = useContext(TabsContext); return activeTab === value ? <div className={cn("mt-6", className)}>{children}</div> : null; };
const Modal = ({ isOpen, onClose, title, children }) => { if (!isOpen) return null; return createPortal(<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 animate-fade-in p-4 pt-16 sm:pt-24 overflow-y-auto" onClick={onClose}><GlassPanel className="relative w-full max-w-2xl animate-slide-up flex flex-col" onClick={(e) => e.stopPropagation()}><div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-white/10"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3><Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><XIcon className="h-5 w-5" /></Button></div><div className="flex-grow p-6 overflow-y-auto">{children}</div></GlassPanel></div>, document.body); };
const Toaster = () => { const { toasts } = useToast(); return createPortal(<div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">{toasts.map(({ id, title, description, variant }) => (<GlassPanel key={id} className={cn("p-4 border-l-4", variant === 'destructive' ? 'border-red-500' : variant === 'violet' ? 'border-violet-500' : 'border-cyan-500')}><p className="font-semibold text-gray-900 dark:text-white">{title}</p><p className="text-sm text-gray-700 dark:text-gray-300">{description}</p></GlassPanel>))}</div>, document.body); };
const SkeletonRow = () => (<tr className="animate-pulse"><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2"></div></td><td className="px-6 py-4"><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div></td></tr>);
const EmptyState = ({ title, message, actionText, onAction }) => (<div className="text-center py-16"><ZapIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" /><h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>{onAction && <div className="mt-6"><Button onClick={onAction}><PlusCircleIcon className="h-5 w-5 mr-2" />{actionText}</Button></div>}</div>);
const Badge = memo(({ children, variant = 'default', className }) => { const variants = { default: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200", secondary: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200", outline: "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300", success: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200", warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200", danger: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200" }; return <span className={cn("text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full", variants[variant], className)}>{children}</span>});
const Avatar = ({ children, className }) => <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>{children}</div>;
const AvatarImage = ({ src, ...props }) => <img src={src} className="aspect-square h-full w-full" {...props} />;
const AvatarFallback = ({ children, ...props }) => <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700" {...props}>{children}</span>;

// --- COMPONENTES DE FORMULÁRIO COMPLETOS ---
const FormSection = ({ title, children, cols = 3 }) => (<div className="mb-8"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">{title}</h3><div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>{children}</div></div>);
const GeneralInfoForm = ({ formData, handleChange, errors }) => (<FormSection title="Visão Geral"><div><Label>Status do Cliente</Label><Select name="general.status" value={formData?.general?.status || ''} onChange={handleChange} error={errors?.status}><option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option></Select></div><div><Label>Tipo de Pessoa</Label><Select name="general.clientType" value={formData?.general?.clientType || ''} onChange={handleChange} error={errors?.clientType}><option>PME</option><option>Pessoa Física</option><option>Adesão</option></Select></div><div className="lg:col-span-1"><Label>Nome da Empresa / Cliente</Label><Input name="general.companyName" value={formData?.general?.companyName || ''} onChange={handleChange} error={errors?.companyName} /></div>{formData?.general?.clientType === 'PME' && (<><div><Label>CNPJ</Label><Input name="general.cnpj" value={formData?.general?.cnpj || ''} onChange={handleChange} /></div><div><Label>Nome do Responsável</Label><Input name="general.responsibleName" value={formData?.general?.responsibleName || ''} onChange={handleChange} /></div><div><Label>CPF do Responsável</Label><Input name="general.responsibleCpf" value={formData?.general?.responsibleCpf || ''} onChange={handleChange} /></div></>)}<div><Label>Nome do Titular</Label><Input name="general.holderName" value={formData?.general?.holderName || ''} onChange={handleChange} error={errors?.holderName} /></div><div><Label>CPF do Titular</Label><Input name="general.holderCpf" value={formData?.general?.holderCpf || ''} onChange={handleChange} error={errors?.holderCpf} /></div><div><Label>E-mail do Cliente</Label><Input type="email" name="general.email" value={formData?.general?.email || ''} onChange={handleChange} error={errors?.email} /></div><div><Label>Celular / Telefone (Cliente)</Label><Input type="tel" name="general.phone" value={formData?.general?.phone || ''} onChange={handleChange} /></div><div><Label>Nome do Contato (recados)</Label><Input name="general.contactName" value={formData?.general?.contactName || ''} onChange={handleChange} /></div><div><Label>Celular / Telefone (Contato)</Label><Input type="tel" name="general.contactPhone" value={formData?.general?.contactPhone || ''} onChange={handleChange} /></div></FormSection>);
const ContractValuesForm = ({ formData, handleChange, handleCheckboxChange }) => { const { operators } = useData(); return (<FormSection title="Contrato e Valores"><div><Label>Número da Proposta</Label><Input name="contract.proposalNumber" value={formData?.contract?.proposalNumber || ''} onChange={handleChange} /></div><div><Label>Número da Apólice / Contrato</Label><Input name="contract.policyNumber" value={formData?.contract?.policyNumber || ''} onChange={handleChange} /></div><div><Label>Plano Fechado (Operadora)</Label><Select name="contract.planOperator" value={formData?.contract?.planOperator || ''} onChange={handleChange}><option value="">Selecione a Operadora</option>{operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}</Select></div><div><Label>Plano Anterior</Label><Input name="contract.previousPlan" value={formData?.contract?.previousPlan || ''} onChange={handleChange} /></div><div className="lg:col-span-3"><Label>Tipo de Plano</Label><div className="flex gap-4 mt-2 text-gray-800 dark:text-gray-300"><label className="flex items-center gap-2"><Checkbox name="contract.planTypes" value="Saúde" checked={formData?.contract?.planTypes?.includes('Saúde')} onChange={handleCheckboxChange} /> Saúde</label><label className="flex items-center gap-2"><Checkbox name="contract.planTypes" value="Dental" checked={formData?.contract?.planTypes?.includes('Dental')} onChange={handleCheckboxChange} /> Dental</label></div></div><div><Label>Categoria do Plano</Label><Input name="contract.planCategory" value={formData?.contract?.planCategory || ''} onChange={handleChange} /></div><div><Label>Acomodação</Label><Select name="contract.accommodation" value={formData?.contract?.accommodation || ''} onChange={handleChange}><option>Enfermaria</option><option>Apartamento</option></Select></div><div><Label>Valor do Contrato</Label><Input type="number" step="0.01" name="contract.contractValue" value={formData?.contract?.contractValue || ''} onChange={handleChange} /></div><div><Label>Valor da Taxa</Label><Input type="number" step="0.01" name="contract.feeValue" value={formData?.contract?.feeValue || ''} onChange={handleChange} /></div><div><Label>Forma de Pagamento</Label><Select name="contract.paymentMethod" value={formData?.contract?.paymentMethod || ''} onChange={handleChange}><option>Boleto</option><option>Cartão de Crédito</option><option>Débito Automático</option><option>Pix</option></Select></div><div><Label>Vencimento Mensal (Dia)</Label><Input type="number" name="contract.monthlyDueDate" value={formData?.contract?.monthlyDueDate || ''} onChange={handleChange} /></div><div><Label>Data da Vigência</Label><DateField name="contract.effectiveDate" value={formData?.contract?.effectiveDate || ''} onChange={handleChange} /></div><div><Label>Data Envio do Boleto</Label><DateField name="contract.boletoSentDate" value={formData?.contract?.boletoSentDate || ''} onChange={handleChange} /></div><div><Label>Data Fim do Contrato</Label><DateField name="contract.dataFimContrato" value={formData?.contract?.dataFimContrato || ''} onChange={handleChange} /></div></FormSection>); };
const CredentialsAccessForm = ({ formData, handleChange }) => (<FormSection title="Credenciais e Acessos"><div><Label>E-mail Criado</Label><Input type="email" name="credentials.createdEmail" value={formData?.credentials?.createdEmail || ''} onChange={handleChange} /></div><div><Label>Senha do E-mail Criado</Label><Input type="password" name="credentials.emailPassword" value={formData?.credentials?.emailPassword || ''} onChange={handleChange} /></div><div><Label>Site do Portal</Label><Input type="url" name="credentials.portalSite" value={formData?.credentials?.portalSite || ''} onChange={handleChange} /></div><div><Label>Login do Portal</Label><Input name="credentials.portalLogin" value={formData?.credentials?.portalLogin || ''} onChange={handleChange} /></div><div><Label>Senha do Portal</Label><Input type="password" name="credentials.portalPassword" value={formData?.credentials?.portalPassword || ''} onChange={handleChange} /></div><div><Label>Login do App</Label><Input name="credentials.appLogin" value={formData?.credentials?.appLogin || ''} onChange={handleChange} /></div><div><Label>Senha do App</Label><Input type="password" name="credentials.appPassword" value={formData?.credentials?.appPassword || ''} onChange={handleChange} /></div></FormSection>);
const InternalDataForm = ({ formData, handleChange }) => { const { users } = useData(); return (<FormSection title="Dados Internos e Gestão" cols={2}><div><Label>Corretor Responsável</Label><Select name="internal.brokerId" value={formData?.internal?.brokerId || ''} onChange={handleChange}><option value="">Selecione...</option>{users.filter(u => u.permissionLevel === 'Corretor').map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}</Select></div><div><Label>Supervisor</Label><Select name="internal.supervisorId" value={formData?.internal?.supervisorId || ''} onChange={handleChange}><option value="">Selecione...</option>{users.filter(u => u.permissionLevel === 'Supervisor').map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}</Select></div></FormSection>); };

// --- ✅ SOLUÇÃO DEFINITIVA PARA BENEFICIÁRIOS ---
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries, clientId, toast }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
    const confirm = useConfirm();

    // ESTA É A FUNÇÃO CORRIGIDA
    const handleSave = (beneficiaryData) => {
        // Lógica unificada para criar ou editar
        const updatedBeneficiaries = beneficiaryData.id
            // Se tem ID, estamos editando: mapeia o array e substitui o item antigo pelo novo
            ? (beneficiaries || []).map(b => (b.id === beneficiaryData.id ? beneficiaryData : b))
            // Se não tem ID, estamos adicionando: cria um novo array com os itens antigos mais o novo
            : [...(beneficiaries || []), { ...beneficiaryData, id: `local_${Date.now()}` }];

        // PASSO CRUCIAL:
        // Apenas atualiza o estado no componente PAI (ClientForm).
        // Nenhuma gravação no banco de dados acontece aqui.
        setBeneficiaries(updatedBeneficiaries);

        toast({
            title: "Beneficiário Atualizado",
            description: `${beneficiaryData.name} foi ${beneficiaryData.id ? 'editado' : 'adicionado'} à lista. Salve o cliente para confirmar.`,
            variant: 'violet'
        });

        // Fecha o modal
        setModalOpen(false);
        setCurrentBeneficiary(null);
    };

    const handleRemove = async (beneficiaryToRemove) => {
        try {
            await confirm({ title: `Excluir ${beneficiaryToRemove.name}?`, description: "A remoção é permanente." });

            // Simplesmente filtra o array e atualiza o estado no PAI.
            const updatedBeneficiaries = (beneficiaries || []).filter(b => b.id !== beneficiaryToRemove.id);
            setBeneficiaries(updatedBeneficiaries);

            toast({ title: "Removido da lista", description: `${beneficiaryToRemove.name} foi removido. Salve o cliente para confirmar.` });
        } catch (error) {
             // O usuário cancelou, não faz nada
            if (error) { // Apenas se for um erro de verdade
                 console.error("Erro ao remover beneficiário da lista:", error);
                 toast({ title: "Erro", description: "Não foi possível remover o beneficiário da lista.", variant: 'destructive' });
            }
        }
    };

    const handleOpenModal = (beneficiary = null) => {
        setCurrentBeneficiary(beneficiary ? { ...beneficiary } : null); // Passa uma cópia para evitar mutação direta
        setModalOpen(true);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Beneficiários</h3>
                <Button type="button" onClick={() => handleOpenModal()}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar</Button>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">
                {(beneficiaries || []).length === 0
                    ? <p className="text-gray-500 text-center py-4">Nenhum beneficiário adicionado.</p>
                    : beneficiaries.map(ben => (
                        <div key={ben.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{ben.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ben.kinship} - {formatDate(ben.dob)}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ben)}><PencilIcon className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleRemove(ben)}><Trash2Icon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))
                }
            </div>
            <BeneficiaryModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} beneficiary={currentBeneficiary} />
        </div>
    );
};
const BeneficiaryModal = ({ isOpen, onClose, onSave, beneficiary }) => {
    const getInitialFormState = () => ({
        id: null,
        name: '',
        dob: '',
        kinship: 'Titular',
        weight: '',
        height: '',
        idCardNumber: '',
        credentials: { 
            portalLogin: '', 
            portalPassword: '' 
        }
    });

    const [formState, setFormState] = useState(getInitialFormState());

    useEffect(() => {
        if (isOpen) {
            if (beneficiary) {
                setFormState({ ...getInitialFormState(), ...beneficiary, id: beneficiary.id || `ben_${Date.now()}` });
            } else {
                setFormState(getInitialFormState());
            }
        }
    }, [beneficiary, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('credentials.')) {
            const field = name.split('.')[1];
            setFormState(prev => ({
                ...prev,
                credentials: { ...prev.credentials, [field]: value }
            }));
        } else {
            setFormState({ ...formState, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={beneficiary ? "Editar Beneficiário" : "Adicionar Beneficiário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="info" className="w-full">
                    <TabsList>
                        <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
                        <TabsTrigger value="credentials">Credenciais de Acesso</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info">
                        <div className="space-y-4 pt-4">
                            <div><Label>Nome Completo</Label><Input name="name" value={formState.name} onChange={handleChange} required /></div>
                            <div><Label>Data de Nascimento</Label><DateField name="dob" value={formState.dob} onChange={handleChange} required /></div>
                            <div><Label>Parentesco</Label><Select name="kinship" value={formState.kinship} onChange={handleChange} required><option>Titular</option><option>Cônjuge</option><option>Filho(a)</option><option>Outro</option></Select></div>
                            <div><Label>Peso (kg)</Label><Input type="number" name="weight" value={formState.weight} onChange={handleChange} /></div>
                            <div><Label>Altura (m)</Label><Input type="number" step="0.01" name="height" value={formState.height} onChange={handleChange} /></div>
                            <div><Label>Número da Carteirinha</Label><Input name="idCardNumber" value={formState.idCardNumber} onChange={handleChange} /></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="credentials">
                        <div className="space-y-4 pt-4">
                            <div><Label>Login do Portal</Label><Input name="credentials.portalLogin" value={formState.credentials.portalLogin} onChange={handleChange} /></div>
                            <div><Label>Senha do Portal</Label><Input type="password" name="credentials.portalPassword" value={formState.credentials.portalPassword} onChange={handleChange} /></div>
                        </div>
                    </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};
const HistoryForm = ({ observations, setObservations }) => { const { user } = useAuth(); const [newObservation, setNewObservation] = useState(''); const handleAddObservation = () => { if (!newObservation.trim()) return; const observationEntry = { text: newObservation, authorId: user.uid, authorName: user.name, timestamp: new Date() }; setObservations([observationEntry, ...(observations || [])]); setNewObservation(''); }; return (<div className="mb-8"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">Histórico de Observações</h3><div className="space-y-4"><div><Label>Nova Observação</Label><Textarea value={newObservation} onChange={(e) => setNewObservation(e.target.value)} rows={4} placeholder="Adicione uma nova anotação sobre a interação com o cliente..." /><div className="text-right mt-2"><Button type="button" size="sm" onClick={handleAddObservation}>Adicionar ao Histórico</Button></div></div><div className="space-y-4 max-h-96 overflow-y-auto pr-2">{(observations || []).length === 0 ? (<p className="text-gray-500 text-center py-4">Nenhuma observação registrada.</p>) : ((observations || []).map((obs, index) => (<div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg"><p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p><p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-right">{obs.authorName} em {formatDateTime(obs.timestamp)}</p></div>)))}</div></div></div>); };
const DetailItem = memo(({ label, value, isPassword = false, isLink = false, children }) => { const { toast } = useToast(); const [showPassword, setShowPassword] = useState(false); const handleCopy = () => { try { const tempInput = document.createElement('textarea'); tempInput.value = value; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); toast({ title: 'Copiado!', description: `${label} copiado.` }); } catch (err) { console.error('Falha ao copiar:', err); toast({ title: 'Erro', description: `Não foi possível copiar.`, variant: 'destructive' }); } }; const displayValue = value || 'N/A'; return (<div className="py-3"><Label>{label}</Label><div className="flex items-center justify-between mt-1 group"><div className="text-md text-gray-800 dark:text-gray-100 break-words">{children ? children : (isLink && value ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">{displayValue}</a> : (isPassword && !showPassword ? '••••••••' : displayValue))}</div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{isPassword && value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</Button>)}{value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}><CopyIcon className="h-4 w-4" /></Button>)}</div></div></div>); });
const ContractValuesTab = ({ client }) => (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="Nº da Proposta" value={client?.contract?.proposalNumber} /><DetailItem label="Nº da Apólice/Contrato" value={client?.contract?.policyNumber} /><DetailItem label="Operadora" value={client?.contract?.planOperator} /><DetailItem label="Plano Anterior" value={client?.contract?.previousPlan} /><DetailItem label="Tipo de Plano" value={client?.contract?.planTypes?.join(', ')} /><DetailItem label="Categoria" value={client?.contract?.planCategory} /><DetailItem label="Acomodação" value={client?.contract?.accommodation} /><DetailItem label="Valor do Contrato" value={client?.contract?.contractValue ? `R$ ${client.contract.contractValue}` : 'N/A'} /><DetailItem label="Valor da Taxa" value={client?.contract?.feeValue ? `R$ ${client.contract.feeValue}` : 'N/A'} /><DetailItem label="Forma de Pagamento" value={client?.contract?.paymentMethod} /><DetailItem label="Data da Vigência" value={formatDate(client?.contract?.effectiveDate)} /><DetailItem label="Data Fim do Contrato" value={formatDate(client?.contract?.dataFimContrato)} /><DetailItem label="Vencimento Mensal" value={client?.contract?.monthlyDueDate ? `Dia ${client.contract.monthlyDueDate}`: 'N/A'} /><DetailItem label="Data Envio do Boleto" value={formatDate(client?.contract?.boletoSentDate)} /></div>);
const CredentialsTab = ({ client }) => (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="E-mail Criado" value={client?.credentials?.createdEmail} /><DetailItem label="Senha do E-mail" value={client?.credentials?.emailPassword} isPassword /><DetailItem label="Site do Portal" value={client?.credentials?.portalSite} isLink /><DetailItem label="Login do Portal" value={client?.credentials?.portalLogin} /><DetailItem label="Senha do Portal" value={client?.credentials?.portalPassword} isPassword /><DetailItem label="Login do App" value={client?.credentials?.appLogin} /><DetailItem label="Senha do App" value={client?.credentials?.appPassword} isPassword /></div>);
const InternalTab = ({ client }) => { const { users } = useData(); const broker = users.find(u => u.id === client?.internal?.brokerId); const supervisor = users.find(u => u.id === client?.internal?.supervisorId); return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="Corretor" value={broker?.name} /><DetailItem label="Supervisor" value={supervisor?.name} /></div>); };
const BeneficiariesTab = ({ client }) => (<div>{(client?.beneficiaries || []).length > 0 ? (<div className="space-y-4">{(client?.beneficiaries || []).map(ben => (<GlassPanel key={ben?.id} className="p-4 bg-gray-100 dark:bg-black/20"><h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{ben?.name} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">- {ben?.kinship}</span></h4><Tabs defaultValue="info"><TabsList><TabsTrigger value="info">Informações</TabsTrigger><TabsTrigger value="credentials">Credenciais</TabsTrigger></TabsList><TabsContent value="info"><div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm"><p><span className="font-medium text-gray-500 dark:text-gray-400">Nascimento:</span> {formatDate(ben?.dob) || 'N/A'}</p><p><span className="font-medium text-gray-500 dark:text-gray-400">Peso:</span> {ben?.weight ? `${ben.weight} kg` : 'N/A'}</p><p><span className="font-medium text-gray-500 dark:text-gray-400">Altura:</span> {ben?.height ? `${ben.height} m` : 'N/A'}</p><p><span className="font-medium text-gray-500 dark:text-gray-400">Carteirinha:</span> {ben?.idCardNumber || 'N/A'}</p></div></TabsContent><TabsContent value="credentials"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="Login do Portal" value={ben?.credentials?.portalLogin} /><DetailItem label="Senha do Portal" value={ben?.credentials?.portalPassword} isPassword /></div></TabsContent></Tabs></GlassPanel>))}</div>) : (<p className="text-gray-500">Nenhum beneficiário cadastrado.</p>)}</div>);
const HistoryTab = ({ client }) => (<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{(client?.observations || []).length === 0 ? (<p className="text-gray-500 text-center py-8">Nenhum histórico de observações para este cliente.</p>) : ((client?.observations || []).map((obs, index) => (<div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg relative pl-8"><HistoryIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 absolute top-4 left-2"/><p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p><p className="text-xs text-gray-500 mt-2 text-right">{obs.authorName} em {formatDateTime(obs.timestamp)}</p></div>)))}</div>);
const CortexTab = ({ client }) => { const [summary, setSummary] = useState(''); const [isLoading, setIsLoading] = useState(false); const { toast } = useToast(); const handleSummarize = async () => { setIsLoading(true); setSummary(''); const result = await Cortex.summarizeHistory(client); if (result.startsWith('Erro:')) { toast({ title: 'Erro do Córtex', description: result, variant: 'destructive' }); } else { setSummary(result); } setIsLoading(false); }; return (<div><div className="flex items-center gap-4"><Button variant="violet" onClick={handleSummarize} disabled={isLoading}><SparklesIcon className="h-4 w-4 mr-2" />{isLoading ? 'Analisando Histórico...' : 'Sumarizar Histórico com IA'}</Button></div>{isLoading && <p className="mt-4 text-cyan-500 dark:text-cyan-400">O Córtex Gemini está processando as informações...</p>}{summary && (<GlassPanel className="mt-6 p-6 bg-gray-100 dark:bg-black/20"><h4 className="font-semibold text-lg text-violet-600 dark:text-violet-300 mb-3">Resumo da IA</h4><div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap prose dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-1">{summary}</div></GlassPanel>)}</div>); };
const CommissionForm = ({ formData, handleChange }) => {
    const commissionData = formData?.commission || {};

    return (
        <FormSection title="Dados de Comissionamento" cols={2}>
            <div>
                <Label>Valor do Contrato (Base para Comissão)</Label>
                <Input type="number" step="0.01" name="commission.contractValue" value={commissionData.contractValue || ''} onChange={handleChange} placeholder="Ex: 7000.00" />
            </div>
             <div>
                <Label>Taxa de Comissão (Ex: 1.0 para 100%, 3.0 para 300%)</Label>
                <Input type="number" step="0.1" name="commission.commissionRate" value={commissionData.commissionRate || ''} onChange={handleChange} placeholder="Ex: 3.0" />
            </div>
            <div>
                <Label>Estrutura de Pagamento</Label>
                <Select name="commission.paymentStructure" value={commissionData.paymentStructure || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    <option value="à vista">À Vista</option>
                    <option value="parcelado">Parcelado</option>
                    <option value="antecipado">Antecipado</option>
                    <option value="por boleto">Por Boleto</option>
                </Select>
            </div>
            {commissionData.paymentStructure === 'parcelado' && (
                 <div>
                    <Label>Número de Parcelas</Label>
                    <Input type="number" name="commission.parcelCount" value={commissionData.parcelCount || ''} onChange={handleChange} />
                </div>
            )}
            <div>
                <Label>Parcelas Já Recebidas</Label>
                <Input type="number" name="commission.receivedInstallments" value={commissionData.receivedInstallments || 0} onChange={handleChange} />
            </div>
            <div>
                <Label>Data de Início do Pagamento da Comissão</Label>
                <DateField name="commission.paymentStartDate" value={commissionData.paymentStartDate || ''} onChange={handleChange} />
            </div>
             <div className="md:col-span-2">
                <Label>Status do Pagamento da Comissão</Label>
                <Select name="commission.status" value={commissionData.status || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Pagamento Parcial">Pagamento Parcial</option>
                    <option value="Pago">Pago</option>
                    <option value="Cancelado">Cancelado</option>
                </Select>
            </div>
        </FormSection>
    );
};

const CommissionDetailsTab = ({ client }) => {
    const commission = client?.commission;
    if (!commission) return <p className="text-gray-500">Nenhuma informação de comissão cadastrada para este cliente.</p>;

    const totalCommission = (commission.contractValue || 0) * (commission.commissionRate || 0);
    const installmentValue = commission.paymentStructure === 'parcelado' && commission.parcelCount > 0
        ? totalCommission / commission.parcelCount
        : totalCommission;

    const statusVariant = {
        'Pago': 'success',
        'Pagamento Parcial': 'warning',
        'Pendente': 'secondary',
        'Cancelado': 'danger'
    }[commission.status] || 'default';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <DetailItem label="Status da Comissão">
                <Badge variant={statusVariant}>{commission.status || 'N/A'}</Badge>
            </DetailItem>
            <DetailItem label="Valor Base do Contrato" value={formatCurrency(commission.contractValue)} />
            <DetailItem label="Taxa de Comissão" value={`${(commission.commissionRate || 0) * 100}%`} />
            <DetailItem label="Comissão Total Estimada" value={formatCurrency(totalCommission)} />
            <DetailItem label="Estrutura de Pagamento" value={commission.paymentStructure} />
            {commission.paymentStructure === 'parcelado' && (
                <>
                    <DetailItem label="Número de Parcelas" value={commission.parcelCount} />
                    <DetailItem label="Valor por Parcela" value={formatCurrency(installmentValue)} />
                    <DetailItem label="Parcelas Recebidas" value={commission.receivedInstallments} />
                </>
            )}
            <DetailItem label="Data de Início dos Pagamentos" value={formatDate(commission.paymentStartDate)} />
        </div>
    );
};

// --- KANBAN & CARDS ---
const KanbanBoard = ({ columns, onDragEnd, children }) => { const [draggedItem, setDraggedItem] = useState(null); const [dragOverColumn, setDragOverColumn] = useState(null); const handleDragStart = (e, item, sourceColumnId) => { setDraggedItem({ item, sourceColumnId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); }; const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); }; const handleDrop = (e, targetColumnId) => { e.preventDefault(); if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) { onDragEnd(draggedItem.item, targetColumnId); } setDraggedItem(null); setDragOverColumn(null); }; return (<div className="flex gap-6 overflow-x-auto p-2">{Object.entries(columns).map(([columnId, column]) => (<div key={columnId} className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === columnId ? 'bg-gray-200/50 dark:bg-white/10' : '')} onDragOver={(e) => handleDragOver(e, columnId)} onDrop={(e) => handleDrop(e, columnId)} onDragLeave={() => setDragOverColumn(null)}><div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.color }}><h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3><span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span></div><div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">{column.items.length > 0 ? (column.items.map(item => (<div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, columnId)}>{typeof children === 'function' && children(item)}</div>))) : (<div className="text-center text-sm text-gray-500 dark:text-gray-600 p-4">Nenhum item aqui.</div>)}</div></div>))}</div>); };
const LeadCard = memo(({ lead, onConvert, onEdit }) => { const [analysis, setAnalysis] = useState(null); const [isLoading, setIsLoading] = useState(false); const [isAiActive, setAiActive] = useState(false); const handleAnalyze = async () => { setIsLoading(true); setAiActive(true); const result = await Cortex.analyzeLead(lead); setAnalysis(result); setIsLoading(false); }; const score = analysis?.score || 0; const justification = analysis?.justification || "Análise pendente..."; return (<GlassPanel className="p-4 cursor-grab active:cursor-grabbing group" cortex={score > 75}><div className="flex justify-between items-start"><div><p className="font-bold text-gray-900 dark:text-white cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400" onClick={() => onEdit(lead)}>{lead.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{lead.company || 'Sem empresa'}</p></div>{isAiActive ? (<div className={cn("text-center transition-opacity", score > 75 && "cortex-active p-1 rounded-lg")}>{isLoading ? (<div className="animate-spin h-5 w-5 border-2 border-violet-500 dark:border-violet-400 border-t-transparent rounded-full mx-auto my-1"></div>) : (<p className="text-xl font-bold text-violet-600 dark:text-violet-400">{score}</p>)}<p className="text-xs text-violet-600 dark:text-violet-500">Score</p></div>) : (<Button variant="violet" size="sm" onClick={handleAnalyze} className="h-auto py-1 px-2 text-xs"><SparklesIcon className="h-3 w-3 mr-1.5" />Analisar com IA</Button>)}</div><div className="mt-3 text-xs text-gray-500"><p>Criado em: {lead.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</p></div></GlassPanel>); });
const TaskCard = memo(({ task, onEdit, onDelete }) => { const { clients, leads, users } = useData(); const linkedItem = task.linkedToType === 'client' ? clients.find(c => c.id === task.linkedToId) : leads.find(l => l.id === task.linkedToId); const assignedUser = users.find(u => u.id === task.assignedTo); const priorityColors = { 'Alta': 'border-red-500', 'Média': 'border-yellow-500', 'Baixa': 'border-blue-500' }; return (<GlassPanel className={cn("p-4 cursor-grab active:cursor-grabbing group border-l-4", priorityColors[task.priority] || 'border-gray-500')}><div className="flex justify-between items-start"><p className="font-bold text-gray-900 dark:text-white flex-grow">{task.title}</p><div className="flex opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}><PencilIcon className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70 hover:text-red-400" onClick={() => onDelete(task)}><Trash2Icon className="h-4 w-4" /></Button></div></div>{linkedItem && ( <p className="text-xs mt-2 text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded-md inline-block">{task.linkedToType === 'client' ? 'Cliente: ' : 'Lead: '} {linkedItem.general?.holderName || linkedItem.name}</p>)}<p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{task.description}</p><div className="mt-3 text-xs text-gray-500 flex justify-between items-center"><span>Prazo: {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}</span>{assignedUser && <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 border-2 border-violet-400 dark:border-violet-700" title={assignedUser.name}>{assignedUser.name?.[0]}</div>}</div></GlassPanel>); });

// --- MODAIS ---
const LeadModal = ({ isOpen, onClose, onSave, lead }) => { const { user } = useAuth(); const [formState, setFormState] = useState({}); useEffect(() => { if (lead) { setFormState(lead); } else { setFormState({ name: '', company: '', email: '', phone: '', notes: '', status: 'Novo', ownerId: user?.uid, responseDeadlineDays: 3 }); } }, [lead, isOpen, user]); const handleChange = (e) => setFormState(p => ({...p, [e.target.name]: e.target.value})); const handleSubmit = (e) => { e.preventDefault(); onSave(formState); onClose(); }; return (<Modal isOpen={isOpen} onClose={onClose} title={lead ? "Editar Lead" : "Adicionar Novo Lead"}><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Nome do Lead</Label><Input name="name" value={formState.name || ''} onChange={handleChange} required /></div><div><Label>Empresa</Label><Input name="company" value={formState.company || ''} onChange={handleChange} /></div><div><Label>Email</Label><Input type="email" name="email" value={formState.email || ''} onChange={handleChange} /></div><div><Label>Telefone</Label><Input type="tel" name="phone" value={formState.phone || ''} onChange={handleChange} /></div></div><div><Label>Observações (Córtex AI irá analisar estas notas)</Label><Textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={4} placeholder="Ex: Indicado por cliente X, precisa fechar com urgência, decisor da empresa..."/></div><div><Label>Prazo de Resposta (dias)</Label><Input type="number" name="responseDeadlineDays" value={formState.responseDeadlineDays || 3} onChange={handleChange} /></div><div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Lead</Button></div></form></Modal>); };
const AddCollaboratorModal = ({ isOpen, onClose, onSave }) => { const [formData, setFormData] = useState({ name: '', email: '', password: '', permissionLevel: 'Corretor', supervisorId: '' }); const { users } = useData(); const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value })); const handleSubmit = (e) => { e.preventDefault(); onSave(formData); setFormData({ name: '', email: '', password: '', permissionLevel: 'Corretor', supervisorId: '' }); }; return (<Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Colaborador"><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Nome Completo</Label><Input name="name" onChange={handleChange} required /></div><div><Label>Email</Label><Input type="email" name="email" onChange={handleChange} required /></div><div><Label>Senha</Label><Input type="password" name="password" onChange={handleChange} required /></div><div><Label>Nível de Permissão</Label><Select name="permissionLevel" value={formData.permissionLevel} onChange={handleChange}><option>Corretor</option><option>Supervisor</option><option>Admin</option></Select></div>{formData.permissionLevel === 'Corretor' && (<div><Label>Vincular ao Supervisor</Label><Select name="supervisorId" value={formData.supervisorId} onChange={handleChange}><option value="">Nenhum</option>{users.filter(u => u.permissionLevel === 'Supervisor').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>)}<div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Adicionar</Button></div></form></Modal>); };
const AddOperatorModal = ({ isOpen, onClose, onSave }) => { const [name, setName] = useState(''); const handleSubmit = (e) => { e.preventDefault(); onSave({ name }); setName(''); }; return (<Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Operadora"><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Nome da Operadora</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Adicionar</Button></div></form></Modal>); };
const TaskModal = ({ isOpen, onClose, onSave, task }) => { const { users, clients, leads } = useData(); const [formState, setFormState] = useState({}); useEffect(() => { setFormState(task ? task : { title: '', description: '', assignedTo: '', dueDate: '', priority: 'Média', linkedToId: '', linkedToType: '', status: 'Pendente' }); }, [task, isOpen]); const handleChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value })); const handleLinkChange = (e) => { const [type, id] = e.target.value.split('-'); setFormState(p => ({ ...p, linkedToType: type, linkedToId: id })); }; const handleSubmit = (e) => { e.preventDefault(); onSave(formState); }; const linkedValue = formState.linkedToType && formState.linkedToId ? `${formState.linkedToType}-${formState.linkedToId}` : ''; return (<Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarefa" : "Adicionar Nova Tarefa"}><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Título</Label><Input name="title" value={formState.title || ''} onChange={handleChange} required /></div><div><Label>Descrição</Label><Textarea name="description" value={formState.description || ''} onChange={handleChange} rows={3} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Responsável</Label><Select name="assignedTo" value={formState.assignedTo || ''} onChange={handleChange}><option value="">Ninguém</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div><div><Label>Data de Vencimento</Label><DateField name="dueDate" value={formState.dueDate || ''} onChange={handleChange} /></div></div><div><Label>Prioridade</Label><Select name="priority" value={formState.priority || 'Média'} onChange={handleChange}><option>Baixa</option><option>Média</option><option>Alta</option></Select></div><div><Label>Vincular a Cliente/Lead</Label><Select value={linkedValue} onChange={handleLinkChange}><option value="">Nenhum</option><optgroup label="Clientes">{clients.map(c => <option key={c.id} value={`client-${c.id}`}>{c.general?.holderName || c.general?.companyName}</option>)}</optgroup><optgroup label="Leads">{leads.map(l => <option key={l.id} value={`lead-${l.id}`}>{l.name}</option>)}</optgroup></Select></div><div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Tarefa</Button></div></form></Modal>); };
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description }) => { if (!isOpen) return null; return (<Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Ação"}><p className="text-gray-700 dark:text-gray-300">{description || "Tem certeza que deseja prosseguir? Esta ação não pode ser desfeita."}</p><div className="flex justify-end gap-4 mt-6"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="destructive" onClick={onConfirm}>Confirmar</Button></div></Modal>); };

// --- PÁGINAS E COMPONENTES PRINCIPAIS ---
function LoginPage() { const { login } = useAuth(); const { toast } = useToast(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const result = await login(email, password); if (!result.success) { toast({ title: "Falha na Autenticação", description: "Credenciais inválidas ou erro de rede.", variant: "destructive" }); } setLoading(false); }; return (<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0D1117] p-4"><GlassPanel className="w-full max-w-sm p-8"><h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">OLYMPUS X</h1><p className="text-center text-gray-500 dark:text-gray-400 mb-8">Acesso ao Ecossistema Inteligente</p><form onSubmit={handleSubmit} className="space-y-6"><div><Label htmlFor="email">Email do Utilizador</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" /></div><div><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" /></div><Button type="submit" variant="default" className="w-full !h-12 !text-base" disabled={loading}>{loading ? 'A Autenticar...' : 'Entrar'}</Button></form></GlassPanel></div>); }

function ClientForm({ client, onSave, onCancel, isConversion = false, leadData = null }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const { addClient, updateClient, loading } = useData();
    const { toast } = useToast();
    const confirm = useConfirm(); // Trazendo o hook de confirmação de volta

    useEffect(() => {
        const defaultData = {
            general: { status: 'Ativo', clientType: 'PME' },
            contract: { planTypes: [] },
            credentials: {},
            internal: {},
            beneficiaries: [],
            observations: [],
            commission: {}
        };

        if (isConversion && leadData) {
            const conversionData = {
                ...defaultData,
                general: { ...defaultData.general, companyName: leadData.company || '', holderName: leadData.name, email: leadData.email, phone: leadData.phone },
                internal: { brokerId: leadData.ownerId },
                observations: leadData.notes ? [{ text: `Nota original do Lead: ${leadData.notes}`, authorId: leadData.ownerId, authorName: 'Sistema', timestamp: new Date() }] : []
            };
            setFormData(conversionData);
        } else if (client) {
            setFormData({ ...defaultData, ...JSON.parse(JSON.stringify(client)) });
        } else {
            setFormData(defaultData);
        }
        setErrors({});
    }, [client?.id, isConversion, leadData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(p => {
                const newState = { ...p };
                let current = newState;
                keys.slice(0, -1).forEach(key => { current[key] = { ...current[key] }; current = current[key]; });
                current[keys[keys.length - 1]] = value;
                return newState;
            });
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
        if (errors[keys[keys.length - 1]]) setErrors(p => ({ ...p, [keys[keys.length - 1]]: null }));
    };

    const handleCheckboxChange = (e) => {
        const { name, value, checked } = e.target;
        const [section, field] = name.split('.');
        const current = formData[section]?.[field] || [];
        const newValues = checked ? [...current, value] : current.filter(v => v !== value);
        setFormData(p => ({ ...p, [section]: { ...p[section], [field]: newValues } }));
    };

    const handleSetBeneficiaries = (newBeneficiaries) => {
        setFormData(p => ({ ...p, beneficiaries: newBeneficiaries }));
    };

    const handleSetObservations = (newObservations) => {
        setFormData(p => ({ ...p, observations: newObservations }));
    };

    const validateForm = () => {
        const newErrors = {};
        const { general } = formData;
        if (!general.status) newErrors.status = true;
        if (!general.clientType) newErrors.clientType = true;
        if (!general.companyName && !general.holderName) newErrors.companyName = true;
        if (!general.holderName) newErrors.holderName = true;
        if (!general.holderCpf) newErrors.holderCpf = true;
        if (!general.email) newErrors.email = true;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ PASSO 2: Esta função SÓ executa a lógica de salvamento.
    const executeSave = async () => {
        if (!validateForm()) {
            toast({ title: "Validação Falhou", description: "Por favor, preencha todos os campos obrigatórios.", variant: 'destructive' });
            return;
        }

        const { id, ...dataToSave } = formData;
        const clientName = formData.general?.holderName || formData.general?.companyName;
        const isEditing = !!formData.id;

        if (!Array.isArray(dataToSave.beneficiaries)) {
            dataToSave.beneficiaries = [];
        }

        const result = isEditing ? await updateClient(id, dataToSave) : await addClient(dataToSave);

        if (result) {
            // A toast de sucesso agora é mais genérica, pois não sabemos se é criação ou edição aqui.
            // A toast específica será mostrada pelo componente `Dashboard` após a navegação, se necessário.
            onSave(result, leadData?.id);
        } else {
            toast({ title: "Erro na Operação", description: `Não foi possível salvar os dados do cliente.`, variant: 'destructive' });
        }
    };
    
    // ✅ PASSO 1: O botão "Concluir Edição" chama esta função.
    const handleConfirmation = async () => {
        const clientName = formData.general?.holderName || formData.general?.companyName;
        const isEditing = !!formData.id;
        const confirmationMessage = isConversion ? `Confirmar conversão do lead '${clientName}' em cliente?` : (isEditing ? `Deseja realmente ATUALIZAR os dados do cliente '${clientName}'?` : `Deseja CRIAR um novo cliente com o nome '${clientName}'?`);
        
        try {
            // Abre o modal e espera o usuário clicar em "Confirmar" ou "Cancelar".
            await confirm({ title: "Confirmar Ação", description: confirmationMessage });
            // Se o usuário clicou em "Confirmar", a linha abaixo é executada.
            await executeSave();
        } catch (error) {
            // Se o usuário clicou em "Cancelar", a promessa é rejeitada e cai aqui.
            // Não fazemos nada, apenas permanecemos na tela de edição.
            console.log("Ação cancelada pelo usuário.");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{isConversion ? `Converter Lead: ${leadData?.name || ''}` : (formData.id ? 'Editar Cliente' : 'Adicionar Novo Cliente')}</h2>
            {/* O formulário agora é apenas um container visual, não usamos mais o onSubmit. */}
            <div>
                <GlassPanel className="p-6">
                    <Tabs defaultValue="general">
                        <TabsList>
                             <TabsTrigger value="general">Visão Geral</TabsTrigger>
                            <TabsTrigger value="contract">Contrato</TabsTrigger>
                            <TabsTrigger value="commission">Comissões</TabsTrigger>
                            <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                            <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                            <TabsTrigger value="internal">Dados Internos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralInfoForm formData={formData} handleChange={handleChange} errors={errors} />
                        </TabsContent>
                        <TabsContent value="contract">
                            <ContractValuesForm formData={formData} handleChange={handleChange} handleCheckboxChange={handleCheckboxChange} />
                        </TabsContent>
                         <TabsContent value="commission">
                            <CommissionForm formData={formData} handleChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="beneficiaries">
                            <BeneficiariesForm
                                beneficiaries={formData.beneficiaries || []}
                                setBeneficiaries={handleSetBeneficiaries}
                                clientId={formData.id}
                                toast={toast}
                            />
                        </TabsContent>
                        <TabsContent value="history">
                            <HistoryForm observations={formData.observations || []} setObservations={handleSetObservations} />
                        </TabsContent>
                        <TabsContent value="credentials">
                            <CredentialsAccessForm formData={formData} handleChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="internal">
                            <InternalDataForm formData={formData} handleChange={handleChange} />
                        </TabsContent>
                    </Tabs>
                </GlassPanel>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
                    {/* O botão agora é do tipo "button" e chama o handleConfirmation, não é mais um "submit" */}
                    <Button type="button" onClick={handleConfirmation} disabled={loading}>{loading ? 'A Guardar...' : (isConversion ? 'Converter em Cliente' : (formData.id ? 'Concluir Edição' : 'Guardar Cliente'))}</Button>
                </div>
            </div>
        </div>
    );
}

const ClientsList = ({ onClientSelect, onAddClient }) => {
    const { clients, loading, operators } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', operator: '', month: '' });
    const [showFilters, setShowFilters] = useState(false);
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const filteredClients = useMemo(() => clients.filter(client => {
        const searchMatch = (`${client?.general?.companyName || ''} ${client?.general?.holderName || ''} ${client?.general?.email || ''}`).toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filters.status ? client?.general?.status === filters.status : true;
        const operatorMatch = filters.operator ? client?.contract?.planOperator === filters.operator : true;
        const monthMatch = filters.month ? client?.contract?.effectiveDate?.startsWith(filters.month) : true;
        return searchMatch && statusMatch && operatorMatch && monthMatch;
    }), [clients, searchTerm, filters]);

    const renderTableRows = () => {
        if (loading) return Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />);
        if (filteredClients.length > 0) {
            return filteredClients.map((client) => (<tr key={client.id} onClick={() => onClientSelect(client.id)} className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors duration-200"><td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</div><div className="text-sm text-gray-500 dark:text-gray-400">{client?.general?.email}</div></td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${client?.general?.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>{client?.general?.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{client?.contract?.planOperator}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(client?.contract?.effectiveDate) || 'N/A'}</td></tr>));
        }
        return <tr><td colSpan="4"><EmptyState title="Nenhum Cliente Encontrado" message="Parece que não há clientes correspondentes aos filtros atuais." actionText="Adicionar Novo Cliente" onAction={onAddClient} /></td></tr>;
    };

    return (<div className="p-4 sm:p-6 lg:p-8"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2><div className="flex gap-2"><Button variant="outline" onClick={() => setShowFilters(!showFilters)}><FilterIcon className="h-4 w-4 mr-2" /> Filtros</Button><Button onClick={onAddClient}><PlusCircleIcon className="h-5 w-5 mr-2" /> Adicionar Cliente</Button></div></div>{showFilters && (<GlassPanel className="p-4 mb-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Input placeholder="Procurar por nome, titular ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Select name="status" value={filters.status} onChange={handleFilterChange}><option value="">Todos os Status</option><option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option></Select><Select name="operator" value={filters.operator} onChange={handleFilterChange}><option value="">Todas as Operadoras</option>{operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}</Select><Input type="month" name="month" value={filters.month} onChange={handleFilterChange} /></div></GlassPanel>)}<GlassPanel><div className="overflow-x-auto"><table className="min-w-full"><thead className="border-b border-gray-200 dark:border-white/10"><tr>{['Nome', 'Status', 'Plano', 'Vigência'].map(h => <th key={h} scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-200 dark:divide-white/10">{renderTableRows()}</tbody></table></div></GlassPanel></div>);
};

const OverviewTab = ({ client }) => (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="Status" value={client?.general?.status} /><DetailItem label="Tipo de Pessoa" value={client?.general?.clientType} /><DetailItem label="Nome Empresa/Cliente" value={client?.general?.companyName} />{client?.general?.clientType === 'PME' && (<><DetailItem label="CNPJ" value={client?.general?.cnpj} /><DetailItem label="Nome do Responsável" value={client?.general?.responsibleName} /><DetailItem label="CPF do Responsável" value={client?.general?.responsibleCpf} /></>)}<DetailItem label="Nome do Titular" value={client?.general?.holderName} /><DetailItem label="CPF do Titular" value={client?.general?.holderCpf} /><DetailItem label="E-mail" value={client?.general?.email} /><DetailItem label="Telefone (Cliente)" value={client?.general?.phone} /><DetailItem label="Contato (Recados)" value={client?.general?.contactName} /><DetailItem label="Telefone (Contato)" value={client?.general?.contactPhone} /></div>);
const ClientDetails = ({ client, onBack, onEdit }) => { const { toast } = useToast(); const { deleteClient } = useData(); const confirm = useConfirm(); if (!client) return null; const handleDelete = async () => { const clientName = client?.general?.companyName || client?.general?.holderName; try { await confirm({ title: `Excluir ${clientName}?`, description: "Tem certeza que deseja excluir este cliente? Todos os dados associados serão perdidos permanentemente." }); const success = await deleteClient(client.id, clientName); if (success) { toast({ title: "Cliente Excluído", description: `${clientName} foi removido com sucesso.` }); onBack(); } else { toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" }); } } catch (e) { /* User cancelled */ } }; return (<div className="p-4 sm:p-6 lg:p-8"><div className="flex justify-between items-start mb-6 gap-4"><div><button onClick={onBack} className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar</button><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</h2></div><div className="flex gap-2"><Button variant="outline" onClick={() => onEdit(client)}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button><Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir Cliente</Button></div></div><GlassPanel className="p-6"><Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Visão Geral</TabsTrigger><TabsTrigger value="contract">Contrato</TabsTrigger><TabsTrigger value="commission">Comissões</TabsTrigger><TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger><TabsTrigger value="credentials">Credenciais</TabsTrigger><TabsTrigger value="internal">Interno</TabsTrigger><TabsTrigger value="cortex">Córtex AI</TabsTrigger></TabsList><TabsContent value="overview"><OverviewTab client={client} /></TabsContent><TabsContent value="contract"><ContractValuesTab client={client} /></TabsContent><TabsContent value="commission"><CommissionDetailsTab client={client} /></TabsContent><TabsContent value="beneficiaries"><BeneficiariesTab client={client} /></TabsContent><TabsContent value="history"><HistoryTab client={client} /></TabsContent><TabsContent value="credentials"><CredentialsTab client={client} /></TabsContent><TabsContent value="internal"><InternalTab client={client} /></TabsContent><TabsContent value="cortex"><CortexTab client={client} /></TabsContent></Tabs></GlassPanel></div>); };
const CorporatePage = ({ onNavigate }) => {
    const { users, operators, addOperator, deleteOperator, companyProfile, updateCompanyProfile } = useData();
    const { user, addUser, deleteUser } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isOperatorModalOpen, setOperatorModalOpen] = useState(false);
    const [companyData, setCompanyData] = useState({});

    useEffect(() => { setCompanyData(companyProfile || {}); }, [companyProfile]);
    const handleCompanyDataChange = (e) => setCompanyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSaveCompanyProfile = async () => { const success = await updateCompanyProfile(companyData); toast({ title: success ? "Sucesso" : "Erro", description: success ? "Dados da empresa atualizados." : "Não foi possível salvar os dados.", variant: success ? 'default' : 'destructive' }); };
    const handleDeleteOperator = async (operator) => { try { await confirm({ title: `Remover ${operator.name}?`, description: "Tem a certeza que deseja remover esta operadora?" }); const success = await deleteOperator(operator.id, operator.name); toast({ title: success ? "Operadora Removida" : "Erro", description: `${operator.name} foi ${success ? 'removida' : 'impossível de remover'}.`, variant: success ? 'default' : 'destructive' }); } catch (e) { /* User cancelled */ } };
    const handleDeleteUser = async (userToDelete) => { if (userToDelete.id === user.id) { toast({ title: "Ação Inválida", description: "Você não pode excluir sua própria conta.", variant: "destructive" }); return; } try { await confirm({ title: `Excluir ${userToDelete.name}?`, description: "Esta ação removerá o acesso do colaborador. Tem certeza?" }); const success = await deleteUser(userToDelete.id); toast({ title: success ? "Colaborador Removido" : "Erro", description: `${userToDelete.name} foi ${success ? 'removido' : 'impossível de remover'}.`, variant: success ? 'default' : 'destructive' }); } catch (e) { /* User cancelled */ } };
    const handleAddOperator = async (newOperatorData) => { const success = await addOperator(newOperatorData); toast({ title: success ? "Operadora Adicionada" : "Erro", description: `${newOperatorData.name} foi ${success ? 'adicionada' : 'impossível de adicionar'}.`, variant: success ? 'default' : 'destructive' }); if (success) setOperatorModalOpen(false); };
    const handleAddUser = async (newUserData) => { const result = await addUser(newUserData); toast({ title: result.success ? "Colaborador Adicionado" : "Erro ao Adicionar", description: result.success ? `${newUserData.name} foi adicionado ao sistema.` : `Não foi possível adicionar o colaborador. Erro: ${result.code}`, variant: result.success ? 'default' : 'destructive' }); if (result.success) setUserModalOpen(false); };

    return (<div className="p-4 sm:p-6 lg:p-8"><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestão Corporativa</h2><GlassPanel className="p-6"><Tabs defaultValue="collaborators"><TabsList><TabsTrigger value="collaborators">Colaboradores</TabsTrigger><TabsTrigger value="operators">Operadoras</TabsTrigger><TabsTrigger value="company">Minha Empresa</TabsTrigger></TabsList><TabsContent value="collaborators"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Utilizadores do Sistema</h3><Button onClick={() => setUserModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Colaborador</Button></div><div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">{users.map(u => (<div key={u.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md"><div><p className="font-medium text-gray-900 dark:text-white">{u?.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{u?.email} - <span className="font-semibold">{u?.permissionLevel}</span></p></div><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleDeleteUser(u)} disabled={u.id === user.id}><Trash2Icon className="h-4 w-4" /></Button></div>))}</div></TabsContent><TabsContent value="operators"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Operadoras de Saúde</h3><Button onClick={() => setOperatorModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Operadora</Button></div><div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">{operators.map(op => (<div key={op.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md"><p className="font-medium text-gray-900 dark:text-white">{op.name}</p><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleDeleteOperator(op)}><Trash2Icon className="h-4 w-4" /></Button></div>))}</div></TabsContent><TabsContent value="company"><FormSection title="Informações da Minha Empresa"><div><Label>Nome da Empresa</Label><Input name="companyName" value={companyData.companyName || ''} onChange={handleCompanyDataChange} /></div><div><Label>CNPJ</Label><Input name="cnpj" value={companyData.cnpj || ''} onChange={handleCompanyDataChange} /></div><div><Label>Endereço</Label><Input name="address" value={companyData.address || ''} onChange={handleCompanyDataChange} /></div></FormSection><div className="flex justify-end"><Button onClick={handleSaveCompanyProfile}>Salvar Dados da Empresa</Button></div></TabsContent></Tabs></GlassPanel><AddCollaboratorModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleAddUser} /><AddOperatorModal isOpen={isOperatorModalOpen} onClose={() => setOperatorModalOpen(false)} onSave={handleAddOperator} /></div>);
};
const CalendarPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { clients, users, tasks, leads } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filters, setFilters] = useState({ brokerId: 'all', status: 'all', eventType: 'all' });
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const filteredData = useMemo(() => { if (!user) return { filteredClients: [], filteredTasks: [], filteredLeads: [] }; const isUserAdmin = user.permissionLevel === 'Admin'; const filterByBroker = (item, ownerField) => isUserAdmin ? (filters.brokerId === 'all' || item[ownerField] === filters.brokerId) : item[ownerField] === user.uid; const filteredClients = clients.filter(c => filterByBroker(c.internal, 'brokerId') && (filters.status === 'all' || c.general?.status === filters.status)); const filteredTasks = tasks.filter(t => filterByBroker(t, 'assignedTo')); const filteredLeads = leads.filter(l => filterByBroker(l, 'ownerId')); return { filteredClients, filteredTasks, filteredLeads }; }, [clients, tasks, leads, filters, user]);
    const events = useMemo(() => { const { filteredClients, filteredTasks, filteredLeads } = filteredData; const generatedEvents = []; if (filters.eventType === 'all' || filters.eventType === 'invoice') { filteredClients.forEach(client => { const startDateStr = client.contract?.boletoSentDate; const endDateStr = client.contract?.dataFimContrato; if (startDateStr && endDateStr) { let current = new Date(startDateStr + 'T00:00:00'); const end = new Date(endDateStr + 'T00:00:00'); while (current <= end) { generatedEvents.push({ type: 'invoice', id: `invoice-${client.id}-${current.toISOString()}`, date: new Date(current), client }); current.setMonth(current.getMonth() + 1); } } }); }
        if (filters.eventType === 'all' || filters.eventType === 'renewal') { filteredClients.forEach(client => { const endDateStr = client.contract?.dataFimContrato; if(endDateStr) { const renewalDate = new Date(endDateStr + 'T00:00:00'); renewalDate.setDate(renewalDate.getDate() - 30); generatedEvents.push({ type: 'renewal', id: `renewal-${client.id}`, date: renewalDate, client }); } }); }
        if (filters.eventType === 'all' || filters.eventType === 'task') { filteredTasks.forEach(task => { if (task.dueDate) generatedEvents.push({ type: 'task', id: `task-${task.id}`, date: new Date(task.dueDate + 'T00:00:00'), task }); }); }
        if (filters.eventType === 'all' || filters.eventType === 'lead') { const now = new Date(); filteredLeads.forEach(lead => { const lastActivity = lead.lastActivityDate?.toDate(); const deadlineDays = lead.responseDeadlineDays || 3; if(lastActivity) { const deadline = new Date(lastActivity); deadline.setDate(deadline.getDate() + deadlineDays); if(deadline < now) generatedEvents.push({ type: 'lead', id: `lead-${lead.id}`, date: deadline, lead }); } }); }
        const eventsByDay = {}; generatedEvents.forEach(event => { if (event.date.getFullYear() === currentDate.getFullYear() && event.date.getMonth() === currentDate.getMonth()) { const day = event.date.getDate(); if (!eventsByDay[day]) eventsByDay[day] = []; eventsByDay[day].push(event); } }); return eventsByDay;
    }, [filteredData, currentDate, filters.eventType]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1);
    const startingDay = firstDayOfMonth.getDay();
    const changeMonth = (offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    const eventVisuals = { invoice: { icon: FileTextIcon, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200 hover:bg-cyan-200 dark:hover:bg-cyan-800' }, renewal: { icon: RefreshCwIcon, color: 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800' }, task: { icon: CheckSquareIcon, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800' }, lead: { icon: AlertTriangleIcon, color: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800' } };

    return (<div className="p-4 sm:p-6 lg:p-8"><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Calendário Inteligente</h2><GlassPanel className="p-6"><div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4"><div className="flex items-center"><Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button><h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize w-48 text-center">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3><Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button></div><div className="flex gap-4">{user?.permissionLevel === 'Admin' && (<Select name="brokerId" value={filters.brokerId} onChange={handleFilterChange} className="w-40"><option value="all">Todos Corretores</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>)}<Select name="eventType" value={filters.eventType} onChange={handleFilterChange} className="w-40"><option value="all">Todos Eventos</option><option value="invoice">Boletos</option><option value="renewal">Renovações</option><option value="task">Tarefas</option><option value="lead">Leads</option></Select></div></div><div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-1">{Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-transparent"></div>)}{daysInMonth.map(day => (<div key={day} className="border border-gray-200 dark:border-white/10 p-2 h-28 flex flex-col hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><span className="font-bold text-gray-800 dark:text-white">{day}</span>{events[day] && (<div className="mt-1 flex-grow overflow-y-auto space-y-1 pr-1">{events[day].map(event => { const Visual = eventVisuals[event.type]; const title = event.client?.general?.holderName || event.task?.title || event.lead?.name; return (<div key={event.id} className={cn("text-xs rounded px-1.5 py-1 truncate cursor-pointer flex items-center gap-1.5", Visual.color)} onClick={() => setSelectedEvent(event)}><Visual.icon className="h-3 w-3 flex-shrink-0" /><span className="flex-grow truncate">{title}</span></div>) })}</div>)}</div>))}</div></GlassPanel><Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={`Detalhes do Evento`}>{selectedEvent && <CalendarEventDetail event={selectedEvent} onNavigate={onNavigate} />}</Modal></div>);
};
const CalendarEventDetail = ({ event, onNavigate }) => { const { users } = useData(); const client = event.client; const task = event.task; const lead = event.lead; if (!client && !task && !lead) return null; const broker = users.find(u => u.id === (client?.internal?.brokerId || task?.assignedTo || lead?.ownerId)); const titular = client?.beneficiaries?.find(b => b.kinship === 'Titular') || { name: client?.general?.holderName, dob: null }; const age = calculateAge(titular?.dob); return (<GlassPanel className="p-4 bg-gray-100 dark:bg-black/20"><h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">{client?.general?.companyName || client?.general?.holderName || task?.title || lead?.name}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm"><div className="space-y-2"><DetailItem label="Data de Entrega" value={formatDate(client?.internal?.deliveryDate)} /><DetailItem label="Plano Fechado" value={client?.contract?.planOperator} /><DetailItem label="Número da Proposta" value={client?.contract?.proposalNumber} /><DetailItem label="Valor do Contrato" value={client?.contract?.contractValue ? `R$ ${client.contract.contractValue}` : 'N/A'} /><DetailItem label="Vigência" value={formatDate(client?.contract?.effectiveDate)} /><DetailItem label="Venc. Boleto Mensal" value={client?.contract?.monthlyDueDate ? `Dia ${client.contract.monthlyDueDate}` : 'N/A'} /><DetailItem label="Plataforma Entregue" value={client?.internal?.platformDelivered} /><DetailItem label="Corretor" value={broker?.name} /></div><div className="space-y-2"><DetailItem label="CNPJ" value={client?.general?.cnpj} /><DetailItem label="CPF do Titular" value={client?.general?.holderCpf} /><DetailItem label="Número do Contrato" value={client?.contract?.policyNumber} /><DetailItem label="Tipo de Plano" value={client?.contract?.planTypes?.join(', ')} /><DetailItem label="E-mail Criado" value={client?.credentials?.createdEmail} /><DetailItem label="Senha do e-mail Criado" value={client?.credentials?.emailPassword} isPassword /><DetailItem label="Login do Portal" value={client?.credentials?.portalLogin} /><DetailItem label="Senha do Portal" value={client?.credentials?.portalPassword} isPassword /></div></div>{client && (<div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4"><h5 className="font-semibold text-md text-cyan-600 dark:text-cyan-300 mb-2">Beneficiário Titular</h5><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 text-sm"><DetailItem label="Nome" value={titular?.name} /><DetailItem label="Peso" value={titular?.weight ? `${titular.weight} kg` : 'N/A'} /><DetailItem label="Altura" value={titular?.height ? `${titular.height} m` : 'N/A'} /><DetailItem label="Data de Nasc." value={formatDate(titular?.dob)} /><DetailItem label="Idade" value={age} /><DetailItem label="Número da Carteirinha" value={titular?.idCardNumber} /></div></div>)}<div className="flex justify-end mt-6">{client && <Button onClick={() => onNavigate('client-details', client.id)}> Ver Perfil Completo </Button>}</div></GlassPanel>); };
function ProfilePage() { const { user, updateUserProfile, updateUserPassword } = useAuth(); const { toast } = useToast(); const [name, setName] = useState(user?.name || ''); const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); useEffect(() => { if (user && user.name !== 'Usuário Incompleto') { setName(user.name); } }, [user]); const handleProfileUpdate = async (e) => { e.preventDefault(); const success = await updateUserProfile(user.uid, { name }); toast({ title: success ? "Sucesso" : "Erro", description: success ? "Seu nome foi atualizado." : "Não foi possível atualizar o nome.", variant: success ? 'default' : 'destructive' }); }; const handlePasswordUpdate = async (e) => { e.preventDefault(); if (!currentPassword) { toast({ title: "Erro", description: "Por favor, insira sua senha atual.", variant: 'destructive' }); return; } if (newPassword !== confirmPassword) { toast({ title: "Erro", description: "As senhas não coincidem.", variant: 'destructive' }); return; } if (newPassword.length < 6) { toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: 'destructive' }); return; } const result = await updateUserPassword(currentPassword, newPassword); if (result === true) { toast({ title: "Sucesso", description: "Sua senha foi atualizada." }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } else { let errorMessage = "Não foi possível atualizar a senha."; if (result === 'auth/wrong-password') errorMessage = "A senha atual está incorreta."; else if (result === 'auth/requires-recent-login') errorMessage = "Esta operação é sensível e requer autenticação recente. Por favor, faça logout e login novamente antes de tentar alterar a senha."; toast({ title: "Erro", description: errorMessage, variant: 'destructive' }); } }; return (<div className="p-4 sm:p-6 lg:p-8"><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h2><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><GlassPanel className="p-6"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Informações Pessoais</h3><form onSubmit={handleProfileUpdate} className="space-y-4"><div><Label>Foto de Perfil</Label><div className="mt-2 flex items-center gap-4"><div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-3xl font-bold text-violet-600 dark:text-violet-300 border-2 border-violet-300 dark:border-violet-700">{user?.name?.[0]}</div><Button type="button" variant="outline" disabled>Alterar Foto</Button></div></div><div><Label>Nome Completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label>Email</Label><Input value={user?.email || ''} disabled /></div><div className="flex justify-end"><Button type="submit">Salvar Alterações</Button></div></form></GlassPanel><GlassPanel className="p-6"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Alterar Senha</h3><form onSubmit={handlePasswordUpdate} className="space-y-4"><div><Label>Senha Atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div><div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div><div><Label>Confirmar Nova Senha</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div><div className="flex justify-end"><Button type="submit">Alterar Senha</Button></div></form></GlassPanel></div></div>); }
function LeadsPage({ onNavigate }) { const { leads, updateLead, addLead } = useData(); const { toast } = useToast(); const confirm = useConfirm(); const [isModalOpen, setModalOpen] = useState(false); const [editingLead, setEditingLead] = useState(null); const handleDragEnd = async (item, targetColumnId) => { if (targetColumnId === 'Ganhos') { onNavigate('convert-lead', item.id); } else if (targetColumnId === 'Perdidos') { try { await confirm({ title: `Marcar ${item.name} como perdido?`, description: "Deseja agendar um novo contato para o futuro?" }); onNavigate('add-task-from-lead', item.id); } catch (e) { await updateLead(item.id, { ...item, status: targetColumnId }); toast({ title: "Lead Movido", description: `${item.name} movido para "Perdidos".` }); } } else { await updateLead(item.id, { ...item, status: targetColumnId }); toast({ title: "Lead Atualizado", description: `${item.name} movido para "${targetColumnId}".` }); } }; const handleOpenModal = (lead = null) => { setEditingLead(lead); setModalOpen(true); }; const handleSaveLead = async (leadData) => { if (leadData.id) { await updateLead(leadData.id, leadData); toast({ title: "Lead Atualizado", description: `${leadData.name} foi atualizado com sucesso.` }); } else { await addLead(leadData); toast({ title: "Lead Adicionado", description: `${leadData.name} foi adicionado com sucesso.` }); } }; const columns = { 'Novo': { title: 'Novo', color: '#3B82F6', items: leads.filter(l => l.status === 'Novo') }, 'Em contato': { title: 'Em Contato', color: '#0EA5E9', items: leads.filter(l => l.status === 'Em contato') }, 'Negociação': { title: 'Negociação', color: '#F59E0B', items: leads.filter(l => l.status === 'Negociação') }, 'Ganhos': { title: 'Ganhos', color: '#10B981', items: leads.filter(l => l.status === 'Ganhos') }, 'Perdidos': { title: 'Perdidos', color: '#EF4444', items: leads.filter(l => l.status === 'Perdidos') }, }; return (<div className="p-4 sm:p-6 lg:p-8"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">Funil de Leads</h2><Button onClick={() => handleOpenModal()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2" />Adicionar Lead</Button></div><GlassPanel className="p-4"><KanbanBoard columns={columns} onDragEnd={handleDragEnd}>{(item) => <LeadCard lead={item} onEdit={handleOpenModal} />}</KanbanBoard></GlassPanel><LeadModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveLead} lead={editingLead} /></div>); }
function TasksPage() { const { tasks, updateTask, addTask, deleteTask, loading } = useData(); const { toast } = useToast(); const confirm = useConfirm(); const [isModalOpen, setModalOpen] = useState(false); const [editingTask, setEditingTask] = useState(null); const handleDragEnd = async (item, targetColumnId) => { await updateTask(item.id, { ...item, status: targetColumnId }); toast({ title: "Tarefa Atualizada", description: `Tarefa movida para "${targetColumnId}".` }); }; const handleOpenModal = (task = null) => { setEditingTask(task); setModalOpen(true); }; const handleSaveTask = async (taskData) => { if (taskData.id) { await updateTask(taskData.id, taskData); toast({ title: "Tarefa Atualizada", description: `"${taskData.title}" foi atualizada.` }); } else { await addTask(taskData); toast({ title: "Tarefa Adicionada", description: `"${taskData.title}" foi criada.` }); } setModalOpen(false); }; const handleDeleteTask = async (task) => { try { await confirm({ title: `Excluir Tarefa?`, description: `Tem certeza que deseja excluir a tarefa "${task.title}"?` }); const success = await deleteTask(task.id, task.title); toast({ title: success ? "Tarefa Excluída" : "Erro", description: success ? `"${task.title}" foi removida.` : "Não foi possível excluir a tarefa.", variant: success ? 'default' : 'destructive' }); } catch (e) { /* User cancelled */ } }; const columns = { 'Pendente': { title: 'Pendente', color: '#6B7280', items: tasks.filter(t => t.status === 'Pendente') }, 'Em andamento': { title: 'Em Andamento', color: '#3B82F6', items: tasks.filter(t => t.status === 'Em andamento') }, 'Concluída': { title: 'Concluída', color: '#10B981', items: tasks.filter(t => t.status === 'Concluída') }, }; return (<div className="p-4 sm:p-6 lg:p-8"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2><Button onClick={() => handleOpenModal()}><PlusCircleIcon className="h-5 w-5 mr-2" />Nova Tarefa</Button></div>{loading && !tasks.length ? (<p className="text-center text-gray-500 dark:text-gray-400">Carregando tarefas...</p>) : tasks.length > 0 ? (<GlassPanel className="p-4"><KanbanBoard columns={columns} onDragEnd={handleDragEnd}>{(item) => <TaskCard task={item} onEdit={handleOpenModal} onDelete={handleDeleteTask} />}</KanbanBoard></GlassPanel>) : (<EmptyState title="Nenhuma Tarefa por Aqui" message="Mantenha-se organizado criando sua primeira tarefa." actionText="Criar Nova Tarefa" onAction={() => handleOpenModal()} />)}<TaskModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveTask} task={editingTask} /></div>); }

const TimelineItem = ({ log }) => {
    const getIcon = (actionType) => {
        switch (actionType) {
            case 'CRIAÇÃO': return <PlusCircleIcon className="h-5 w-5 text-green-500" />;
            case 'EDIÇÃO': return <PencilIcon className="h-5 w-5 text-yellow-500" />;
            case 'EXCLUSÃO': return <Trash2Icon className="h-5 w-5 text-red-500" />;
            case 'CONVERSÃO': return <RefreshCwIcon className="h-5 w-5 text-blue-500" />;
            default: return <InfoIcon className="h-5 w-5 text-gray-500" />;
        }
    };
    return (
        <div className="flex items-start gap-4 p-4 border-b border-gray-200 dark:border-white/10 last:border-b-0">
            <div className="flex-shrink-0 pt-1">{getIcon(log.actionType)}</div>
            <div className="flex-grow">
                <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{log.userName || 'Sistema'}</span>
                    <span className="text-gray-600 dark:text-gray-400"> {log.description || ''}</span>
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDateTime(log.timestamp)}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {log.module && <Badge variant="outline">{log.module}</Badge>}
                    {log.actionType && <Badge>{log.actionType}</Badge>}
                    {log.entity?.name && <Badge variant="secondary">{log.entity.type}: {log.entity.name}</Badge>}
                </div>
            </div>
            <Avatar className="h-10 w-10 border-2 border-gray-300 dark:border-gray-600">
                <AvatarImage src={log.userAvatar} />
                <AvatarFallback>{log.userName?.[0] || 'S'}</AvatarFallback>
            </Avatar>
        </div>
    );
};

const TimelinePage = () => {
    const { timeline, users, loading } = useData();
    const [filters, setFilters] = useState({ userId: 'all', module: 'all', actionType: 'all', searchTerm: '' });
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const filteredTimeline = useMemo(() => {
        return timeline.filter(log => {
            if (!log) return false;
            const userMatch = filters.userId === 'all' || log.userId === filters.userId;
            const moduleMatch = filters.module === 'all' || log.module === filters.module;
            const actionMatch = filters.actionType === 'all' || log.actionType === filters.actionType;
            const searchMatch = !filters.searchTerm ||
                (log.description || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (log.userName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (log.entity?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
            return userMatch && moduleMatch && actionMatch && searchMatch;
        });
    }, [timeline, filters]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Time-Line de Atividades</h2>
            <GlassPanel className="p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input placeholder="Buscar por palavra-chave..." name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} />
                    <Select name="userId" value={filters.userId} onChange={handleFilterChange}>
                        <option value="all">Todos os Usuários</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                    <Select name="module" value={filters.module} onChange={handleFilterChange}>
                        <option value="all">Todos os Módulos</option>
                        <option>Clientes</option><option>Leads</option><option>Tarefas</option><option>Corporativo</option>
                    </Select>
                    <Select name="actionType" value={filters.actionType} onChange={handleFilterChange}>
                        <option value="all">Todas as Ações</option>
                        <option>CRIAÇÃO</option><option>EDIÇÃO</option><option>EXCLUSÃO</option><option>CONVERSÃO</option>
                    </Select>
                </div>
            </GlassPanel>
            <GlassPanel>
                <div className="max-h-[70vh] overflow-y-auto">
                    {loading && timeline.length === 0 ? (
                        <p className="text-center text-gray-500 p-8">Carregando histórico...</p>
                    ) : filteredTimeline.length > 0 ? (
                        filteredTimeline.map(log => <TimelineItem key={log.id} log={log} />)
                    ) : (
                        <EmptyState title="Nenhuma Atividade Encontrada" message="Não há registros correspondentes aos filtros selecionados." />
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

function CommandPalette({ isOpen, setIsOpen, onNavigate }) {
    const { clients, leads } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const actions = useMemo(() => [
        { id: 'nav-home', name: 'Ir para Dashboard', type: 'Ação', action: () => onNavigate('home') },
        { id: 'nav-leads', name: 'Ir para Leads', type: 'Ação', action: () => onNavigate('leads') },
        { id: 'nav-clients', name: 'Ir para Clientes', type: 'Ação', action: () => onNavigate('clients') },
        { id: 'nav-tasks', name: 'Ir para Tarefas', type: 'Ação', action: () => onNavigate('tasks') },
        { id: 'nav-calendar', name: 'Ir para Calendário', type: 'Ação', action: () => onNavigate('calendar') },
        { id: 'nav-timeline', name: 'Ir para Time-Line', type: 'Ação', action: () => onNavigate('timeline') },
        { id: 'nav-corporate', name: 'Ir para Corporativo', type: 'Ação', action: () => onNavigate('corporate') },
        { id: 'nav-profile', name: 'Ir para Meu Perfil', type: 'Ação', action: () => onNavigate('profile') },
        ...clients.map(c => ({ id: c.id, name: c.general.holderName || c.general.companyName, type: 'Cliente', action: () => onNavigate('client-details', c.id) })),
        ...leads.map(l => ({ id: l.id, name: l.name, type: 'Lead', action: () => onNavigate('leads') }))
    ], [clients, leads, onNavigate]);
    const results = useMemo(() => searchTerm ? actions.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) : actions.slice(0, 8), [searchTerm, actions]);

    useEffect(() => { if (isOpen) { inputRef.current?.focus(); setActiveIndex(0); } }, [isOpen]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev + 1) % (results.length || 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (results[activeIndex]) { results[activeIndex].action(); setIsOpen(false); setSearchTerm(''); } }
            else if (e.key === 'Escape') { setIsOpen(false); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, activeIndex, setIsOpen]);

    if (!isOpen) return null;
    return createPortal(<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 animate-fade-in pt-24" onClick={() => setIsOpen(false)}><GlassPanel className="w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}><div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-white/10"><SearchIcon className="h-5 w-5 text-gray-500 dark:text-gray-400"/><input ref={inputRef} type="text" placeholder="Buscar clientes, leads ou navegar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none"/></div><div className="p-2 max-h-[400px] overflow-y-auto">{results.length > 0 ? (results.map((item, index) => (<div key={item.id} onClick={() => { item.action(); setIsOpen(false); setSearchTerm(''); }} className={cn("flex justify-between items-center p-3 rounded-lg cursor-pointer", index === activeIndex ? "bg-violet-500/20 dark:bg-violet-500/30" : "hover:bg-gray-100 dark:hover:bg-white/10")}><span className="text-gray-900 dark:text-white">{item.name}</span><span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{item.type}</span></div>))) : (<p className="p-4 text-center text-gray-500">Nenhum resultado encontrado.</p>)}</div></GlassPanel></div>, document.body);
}

function Sidebar({ onNavigate, currentPage, isSidebarOpen, setSidebarOpen }) {
    const { logout } = useAuth();
    const navItems = [{ id: 'home', label: 'Dashboard', icon: HomeIcon }, { id: 'leads', label: 'Leads', icon: TargetIcon }, { id: 'clients', label: 'Clientes', icon: UsersIcon }, { id: 'tasks', label: 'Minhas Tarefas', icon: CheckSquareIcon }, { id: 'calendar', label: 'Calendário', icon: CalendarIcon }, { id: 'timeline', label: 'Time-Line', icon: HistoryIcon }, { id: 'corporate', label: 'Corporativo', icon: BuildingIcon }];
    return (<aside className={cn("fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}><div className="h-full flex flex-col bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10"><div className="flex items-center justify-center h-20 flex-shrink-0"><h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">OLYMPUS X</h2></div><nav className="flex-grow mt-6 px-4 space-y-2">{navItems.map(item => (<button key={item.id} onClick={() => onNavigate(item.id)} className={cn("w-full flex items-center p-3 rounded-lg transition-all duration-300 font-semibold", currentPage.startsWith(item.id) ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white")}><item.icon className="h-5 w-5 mr-3" /><span>{item.label}</span></button>))}</nav><div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto flex-shrink-0"><button onClick={() => onNavigate('profile')} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white mb-2"><UserCircleIcon className="h-5 w-5 mr-3" /><span>Meu Perfil</span></button><button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"><LogOutIcon className="h-5 w-5 mr-3" /><span>Terminar Sessão</span></button></div></div></aside>);
}

function Header({ onToggleSidebar, onOpenCommandPalette }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    return (<header className="sticky top-0 z-30 h-20"><div className="absolute inset-0 bg-gradient-to-b from-gray-50 dark:from-[#0D1117] to-transparent pointer-events-none"></div><div className="relative flex items-center justify-between h-full px-6"><button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button><div className="hidden lg:block"><Button variant="ghost" onClick={onOpenCommandPalette} className="text-gray-500 dark:text-gray-400"><SearchIcon className="h-5 w-5 mr-2" />Busca Global...<span className="ml-4 text-xs border border-gray-400 dark:border-gray-600 rounded-md px-1.5 py-0.5">Ctrl K</span></Button></div><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={toggleTheme} title="Alterar Tema">{theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}</Button><div className="relative"><Button variant="ghost" size="icon"><BellIcon className="h-6 w-6" /></Button><span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ring-white dark:ring-[#0D1117]"></span></div><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-700">{user?.name?.[0]}</div><div className="text-right hidden sm:block"><p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{user?.permissionLevel}</p></div></div></div></div></header>);
}

// RESTAURAÇÃO DOS COMPONENTES DE DASHBOARD
const MetricCard = ({ title, value, tooltip, icon }) => (
    <GlassPanel className="p-6 flex flex-col justify-between group relative">
        <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mt-4">{value}</p>
        {tooltip && (
            <div className="absolute bottom-full mb-2 w-max max-w-xs p-3 text-sm text-white bg-gray-900/90 border border-violet-500/50 rounded-lg shadow-lg z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 left-1/2 -translate-x-1/2 pointer-events-none">
                {tooltip}
            </div>
        )}
    </GlassPanel>
);

const useCommissionMetrics = () => {
    const { user } = useAuth();
    const { clients, users } = useData();

    return useMemo(() => {
        if (!user || !clients || !users) {
            return { loading: true };
        }

        const visibleClients = clients.filter(client => {
            if (user.permissionLevel === 'Admin') return true;
            if (user.permissionLevel === 'Supervisor') {
                const teamBrokerIds = users.filter(u => u.supervisorId === user.uid).map(u => u.id);
                return teamBrokerIds.includes(client.internal?.brokerId);
            }
            if (user.permissionLevel === 'Corretor') {
                return client.internal?.brokerId === user.uid;
            }
            return false;
        });

        const allCommissions = visibleClients.map(client => {
            if (!client.commission) return null;
            const broker = users.find(u => u.id === client.internal?.brokerId);
            const supervisor = users.find(u => u.id === broker?.supervisorId);
            const totalCommission = (client.commission.contractValue || 0) * (client.commission.commissionRate || 0);
            
            return {
                ...client.commission,
                clientId: client.id,
                clientName: client.general?.holderName || client.general?.companyName,
                brokerId: broker?.id,
                brokerName: broker?.name || 'N/A',
                supervisorId: supervisor?.id,
                supervisorName: supervisor?.name || 'N/A',
                totalCommission,
            };
        }).filter(Boolean);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const receivablesThisMonth = allCommissions.reduce((sum, comm) => {
            if (!comm.paymentStartDate) return sum;
            const startDate = new Date(comm.paymentStartDate + 'T00:00:00');
            
            if (comm.paymentStructure === 'à vista' || comm.paymentStructure === 'antecipado') {
                if(startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear && comm.receivedInstallments === 0) {
                    return sum + comm.totalCommission;
                }
            } else if (comm.paymentStructure === 'parcelado') {
                const monthlyValue = comm.totalCommission / comm.parcelCount;
                for (let i = 0; i < comm.parcelCount; i++) {
                    const paymentDate = new Date(startDate);
                    paymentDate.setMonth(startDate.getMonth() + i);
                    if(paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear && i >= comm.receivedInstallments) {
                        return sum + monthlyValue;
                    }
                }
            }
            return sum;
        }, 0);

        const totalPaidCommissions = allCommissions.reduce((sum, comm) => {
            if (comm.status === 'Pago') return sum + comm.totalCommission;
            if (comm.status === 'Pagamento Parcial' && comm.paymentStructure === 'parcelado') {
                const monthlyValue = comm.totalCommission / comm.parcelCount;
                return sum + (monthlyValue * comm.receivedInstallments);
            }
            return sum;
        }, 0);

        const futureReceivables = allCommissions.reduce((sum, comm) => {
            if (comm.status === 'Pago' || comm.status === 'Cancelado') return sum;
            const total = comm.totalCommission;
            const paid = (comm.status === 'Pagamento Parcial' && comm.paymentStructure === 'parcelado')
                ? (total / comm.parcelCount) * comm.receivedInstallments
                : 0;
            return sum + (total - paid);
        }, 0);
        
        const totalContracts = visibleClients.length;
        const totalGrossRevenue = visibleClients.reduce((sum, client) => sum + (parseFloat(client.contract?.contractValue) || 0), 0);
        const averageTicket = totalContracts > 0 ? totalGrossRevenue / totalContracts : 0;
        
        const brokerPerformance = users
            .filter(u => u.permissionLevel === 'Corretor' && (user.permissionLevel === 'Admin' || u.supervisorId === user.uid || u.id === user.uid))
            .map(broker => {
                const brokerCommissions = allCommissions.filter(c => c.brokerId === broker.id);
                const totalGenerated = brokerCommissions.reduce((sum, c) => sum + c.totalCommission, 0);
                return { name: broker.name, value: totalGenerated };
            })
            .filter(b => b.value > 0)
            .sort((a, b) => b.value - a.value);

        const supervisorPerformance = users
            .filter(u => u.permissionLevel === 'Supervisor')
            .map(supervisor => {
                const supervisorCommissions = allCommissions.filter(c => c.supervisorId === supervisor.id);
                const totalGenerated = supervisorCommissions.reduce((sum, c) => sum + c.totalCommission, 0);
                return { name: supervisor.name, value: totalGenerated };
             })
            .filter(s => s.value > 0)
            .sort((a, b) => b.value - a.value);

        return {
            loading: false, receivablesThisMonth, totalPaidCommissions, futureReceivables,
            totalContracts, totalGrossRevenue, averageTicket, brokerPerformance, supervisorPerformance,
        };

    }, [user, clients, users]);
};

function Dashboard360() {
    const metrics = useCommissionMetrics();
    const { user } = useAuth();
    
    if (metrics.loading) {
        return <div className="p-8 text-center">Carregando métricas...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
             <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard 360°</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Análise completa de comissões e performance.</p>
            </div>

            <Tabs defaultValue="finance">
                <TabsList>
                    <TabsTrigger value="finance">Financeiro</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="finance">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MetricCard 
                            title="Recebíveis no Mês" 
                            value={formatCurrency(metrics.receivablesThisMonth)}
                            icon={<DollarSignIcon />}
                            tooltip="Soma de todas as parcelas de comissão com pagamento previsto para o mês corrente."
                        />
                        <MetricCard 
                            title="Comissões Pagas (Total)" 
                            value={formatCurrency(metrics.totalPaidCommissions)}
                            icon={<CheckSquareIcon />}
                            tooltip="Valor total de comissões que já foram efetivamente pagas até hoje."
                        />
                        <MetricCard 
                            title="Recebíveis Futuros" 
                            value={formatCurrency(metrics.futureReceivables)}
                            icon={<TrendingUpIcon />}
                            tooltip="Projeção de todas as comissões pendentes de pagamento em contratos ativos."
                        />
                         <MetricCard 
                            title="Faturamento Bruto (Total)" 
                            value={formatCurrency(metrics.totalGrossRevenue)}
                            icon={<BriefcaseIcon />}
                            tooltip="Soma do valor de todos os contratos fechados na sua visão."
                        />
                        <MetricCard 
                            title="Ticket Médio por Contrato" 
                            value={formatCurrency(metrics.averageTicket)}
                            icon={<PieChartIcon />}
                            tooltip="Valor médio de contrato, calculado com base no faturamento bruto e número de contratos."
                        />
                        <MetricCard 
                            title="Total de Contratos" 
                            value={metrics.totalContracts}
                            icon={<FileTextIcon />}
                            tooltip="Número total de clientes/contratos na sua visão (Admin, Supervisor ou Corretor)."
                        />
                    </div>
                </TabsContent>
                <TabsContent value="performance">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* A renderização dos gráficos BarChart2Icon foi comentada para evitar erros se o componente não estiver preparado para receber os dados */}
                        {/* {(user.permissionLevel === 'Admin' || user.permissionLevel === 'Supervisor') && metrics.brokerPerformance.length > 0 && (
                            <BarChart2Icon data={metrics.brokerPerformance} title="Ranking de Corretores por Comissão Gerada" />
                        )}
                        {user.permissionLevel === 'Admin' && metrics.supervisorPerformance.length > 0 && (
                             <BarChart2Icon data={metrics.supervisorPerformance} title="Ranking de Supervisores por Comissão Gerada" />
                        )} */}
                         {user.permissionLevel === 'Corretor' && (
                            <EmptyState title="Visão de Performance" message="Rankings de equipe e supervisores estão disponíveis para os perfis de Supervisor e Admin." />
                         )}
                         {metrics.brokerPerformance.length === 0 && metrics.supervisorPerformance.length === 0 && user.permissionLevel !== 'Corretor' && (
                              <EmptyState title="Sem Dados de Performance" message="Não há dados de comissão suficientes para gerar rankings de performance." />
                         )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Dashboard() {
    const [page, setPage] = useState('home');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const { getClientById, clients, leads, deleteLead, addTask } = useData();
    const { toast } = useToast();
    const [itemDetails, setItemDetails] = useState(null);

    const handleNavigate = (targetPage, itemId = null) => {
        setPage(targetPage);
        setSelectedItemId(itemId);
        setSidebarOpen(false);
    };

    useEffect(() => {
        // Este useEffect agora funciona melhor com a correção abaixo
        if ((page === 'client-details' || page === 'edit-client' || page === 'convert-lead') && selectedItemId) {
            const client = getClientById(selectedItemId);
            if (client) {
                // Apenas atualiza se o itemDetails estiver dessincronizado
                if(itemDetails?.id !== client.id) {
                    setItemDetails(client);
                }
            } else if (page === 'convert-lead') {
                setItemDetails(leads.find(l => l.id === selectedItemId));
            }
        } else {
             setItemDetails(null);
        }
    }, [selectedItemId, page, getClientById, clients, leads, itemDetails]); // Adicionado itemDetails na dependência

    useEffect(() => {
        const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(prev => !prev); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ✅ A CORREÇÃO ESTÁ AQUI ✅
    const handleSaveClient = async (savedClient, leadIdToDelete = null) => {
        if (leadIdToDelete) {
            const lead = leads.find(l => l.id === leadIdToDelete);
            if (lead) {
                await deleteLead(leadIdToDelete, lead.name);
                toast({ title: "Lead Convertido!", description: `${lead.name} agora é um cliente.` });
            }
        }

        // PASSO 1: Atualiza o estado que será usado pela próxima tela COM o objeto
        // que acabamos de receber do salvamento. Este dado é 100% garantido e atual.
        if (savedClient) {
            setItemDetails(savedClient);
        }
        
        // PASSO 2: Navega para a próxima tela. Agora, quando a tela de detalhes for
        // renderizar, ela usará o 'itemDetails' que acabamos de atualizar,
        // em vez de depender da atualização do Firebase que poderia estar atrasada.
        handleNavigate(savedClient?.id ? 'client-details' : 'clients', savedClient?.id);
    };

    const handleSaveTaskFromLead = async (taskData) => {
        await addTask(taskData);
        toast({ title: "Follow-up Agendado", description: `Nova tarefa criada para o lead.` });
        handleNavigate('tasks');
    };

    const renderContent = () => {
        const leadForTask = leads.find(l => l.id === selectedItemId);
        switch (page) {
            case 'home': return <Dashboard360 />;
            case 'leads': return <LeadsPage onNavigate={handleNavigate} />;
            case 'clients': return <ClientsList onClientSelect={(id) => handleNavigate('client-details', id)} onAddClient={() => handleNavigate('add-client')} />;
            case 'client-details': return <ClientDetails client={itemDetails} onBack={() => handleNavigate('clients')} onEdit={() => handleNavigate('edit-client', itemDetails.id)} />;
            case 'add-client': return <ClientForm onSave={handleSaveClient} onCancel={() => handleNavigate('clients')} />;
            case 'edit-client': return <ClientForm client={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('client-details', itemDetails.id)} />;
            case 'convert-lead': return <ClientForm isConversion={true} leadData={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('leads')} />;
            case 'add-task-from-lead': return <TaskModal isOpen={true} onClose={() => handleNavigate('leads')} onSave={handleSaveTaskFromLead} task={{ title: `Follow-up: ${leadForTask?.name}`, linkedToId: leadForTask?.id, linkedToType: 'lead' }} />;
            case 'tasks': return <TasksPage />;
            case 'calendar': return <CalendarPage onNavigate={handleNavigate} />;
            case 'timeline': return <TimelinePage />;
            case 'corporate': return <CorporatePage />;
            case 'profile': return <ProfilePage />;
            default: return <Dashboard360 />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); body { font-family: 'Inter', sans-serif; } .prose { color: #374151; } .prose-invert { color: #d1d5db; } .dark .prose ul { list-style-type: disc; padding-left: 1.5rem; } .dark .prose li { margin-top: 0.25em; margin-bottom: 0.25em; } .cortex-active { border: 1px solid rgba(192, 38, 211, 0.5); box-shadow: 0 0 15px rgba(192, 38, 211, 0.3); animation: pulse-violet 2.5s infinite; } @keyframes pulse-violet { 0% { box-shadow: 0 0 10px rgba(192, 38, 211, 0.2); } 50% { box-shadow: 0 0 25px rgba(192, 38, 211, 0.5); } 100% { box-shadow: 0 0 10px rgba(192, 38, 211, 0.2); } } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #f1f5f9; } .dark ::-webkit-scrollbar-track { background: #0D1117; } ::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 4px; } .dark ::-webkit-scrollbar-thumb { background: #C026D3; } ::-webkit-scrollbar-thumb:hover { background: #9333ea; } .dark ::-webkit-scrollbar-thumb:hover { background: #a31db1; } select option { background: white !important; color: #1f2937 !important; } .dark select option { background: #161b22 !important; color: #e5e7eb !important; }`}</style>
            <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={handleNavigate} />
            <Sidebar onNavigate={handleNavigate} currentPage={page} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="lg:pl-64 transition-all duration-300">
                <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
                <main className="relative">{renderContent()}</main>
            </div>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
        </div>
    );
}

function Main() {
    const { user, loading } = useAuth();
    if (loading) { return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0D1117] text-cyan-500 dark:text-cyan-400"><h1 className="text-4xl font-bold mb-4 animate-pulse">OLYMPUS X</h1><p>Inicializando o Ecossistema de Negócios Inteligente...</p></div>); }
    if (!auth || !db) { return (<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0D1117] p-4"><GlassPanel className="w-full max-w-sm p-8 text-center"><h1 className="text-2xl font-bold text-center text-red-600 dark:text-red-400 mb-4">Erro de Configuração</h1><p className="text-center text-gray-600 dark:text-gray-300">A configuração do Firebase não foi encontrada. Por favor, verifique o arquivo `firebase.js` e reinicie a aplicação.</p></GlassPanel></div>) }
    return user ? <Dashboard /> : <LoginPage />;
}

function App() {
    return (
        <ThemeProvider>
            <NotificationProvider>
                <AuthProvider>
                    <DataProvider>
                        <ConfirmProvider>
                            <Main />
                        </ConfirmProvider>
                    </DataProvider>
                </AuthProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}

export default App;