import React, { useState, createContext, useContext, useEffect, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';

// Importações do Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from './firebase.js';

// --- ÍCONES SVG ---
const IconWrapper = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
const HomeIcon = (props) => <IconWrapper {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></IconWrapper>;
const UsersIcon = (props) => <IconWrapper {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconWrapper>;
const BuildingIcon = (props) => <IconWrapper {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="9" y2="9.01"></line><line x1="15" y1="9" x2="15" y2="9.01"></line><line x1="9" y1="15" x2="9" y2="15.01"></line><line x1="15" y1="15" x2="15" y2="15.01"></line></IconWrapper>;
const CalendarIcon = (props) => <IconWrapper {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></IconWrapper>;
const BellIcon = (props) => <IconWrapper {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></IconWrapper>;
const PlusCircleIcon = (props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></IconWrapper>;
const SearchIcon = (props) => <IconWrapper {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></IconWrapper>;
const FilterIcon = (props) => <IconWrapper {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></IconWrapper>;
const UserCircleIcon = (props) => <IconWrapper {...props}><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></IconWrapper>;
const ChevronLeftIcon = (props) => <IconWrapper {...props}><polyline points="15 18 9 12 15 6" /></IconWrapper>;
const ChevronRightIcon = (props) => <IconWrapper {...props}><polyline points="9 18 15 12 9 6" /></IconWrapper>;
const CopyIcon = (props) => <IconWrapper {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></IconWrapper>;
const EyeIcon = (props) => <IconWrapper {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></IconWrapper>;
const EyeOffIcon = (props) => <IconWrapper {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></IconWrapper>;
const Trash2Icon = (props) => <IconWrapper {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></IconWrapper>;
const PencilIcon = (props) => <IconWrapper {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></IconWrapper>;
const UploadCloudIcon = (props) => <IconWrapper {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></IconWrapper>;
const XIcon = (props) => <IconWrapper {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper>;
const SparklesIcon = (props) => <IconWrapper {...props} className="text-cyan-400"><path d="m12 3-1.9 4.2-4.2 1.9 4.2 1.9L12 15l1.9-4.2 4.2-1.9-4.2-1.9L12 3Z" /><path d="M5 21 3 17l-4-2 4-2 2-4 2 4 4 2-4 2-2 4Z" /><path d="m21 21-2-4-4-2 4-2 2-4 2 4 4 2-4 2-2 4Z" /></IconWrapper>;
const LogOutIcon = (props) => <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></IconWrapper>;
const SunIcon = (props) => <IconWrapper {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconWrapper>;
const MoonIcon = (props) => <IconWrapper {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></IconWrapper>;

// --- UTILS & HELPERS ---
function cn(...inputs) { return inputs.flat().filter(Boolean).join(' '); }
function calculateAge(dob) { if (!dob) return null; const birthDate = new Date(dob); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age; }

// --- CONTEXTOS E PROVIDERS ---
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => { const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark'); useEffect(() => { const root = window.document.documentElement; root.classList.remove('light', 'dark'); root.classList.add(theme); localStorage.setItem('theme', theme); }, [theme]); const toggleTheme = () => setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark'); return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>; };
const useTheme = () => useContext(ThemeContext);

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUser({ uid: firebaseUser.uid, ...doc.data() });
                    } else {
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'Usuário sem dados', permissionLevel: 'Corretor' });
                    }
                    setLoading(false);
                });
                return () => unsubscribeDoc();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Erro no login:", error.code, error.message);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro no logout:", error);
        }
    };
    
    const addUser = async (userData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const newUser = userCredential.user;
            await setDoc(doc(db, "users", newUser.uid), {
                name: userData.name,
                email: userData.email,
                permissionLevel: userData.permissionLevel
            });
            return true;
        } catch (error) {
            console.error("Erro ao adicionar usuário:", error);
            return error.code;
        }
    };
    
    const updateUserProfile = async (uid, data) => {
        const userDoc = doc(db, "users", uid);
        try {
            await updateDoc(userDoc, data);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            return false;
        }
    };

    const updateUserPassword = async (currentPassword, newPassword) => {
        const user = auth.currentUser;
        if (user) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                return true;
            } catch (error) {
                console.error("Erro ao atualizar senha:", error);
                return error.code;
            }
        }
        return 'no-user';
    };

    const value = { user, loading, login, logout, addUser, updateUserProfile, updateUserPassword };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

const DataContext = createContext();
const DataProvider = ({ children }) => {
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [operators, setOperators] = useState([ { id: 'op_1', name: 'Amil' }, { id: 'op_2', name: 'Bradesco Saúde' }, { id: 'op_3', name: 'SulAmérica' }, { id: 'op_4', name: 'Unimed' }, { id: 'op_5', name: 'NotreDame Intermédica' }, ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let clientUnsubscribe, userUnsubscribe;
        
        const fetchData = () => {
            setLoading(true);
            clientUnsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
                const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsData);
                setLoading(false);
            }, (error) => {
                console.error("Erro ao buscar clientes: ", error);
                setLoading(false);
            });
            
            userUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersData);
            }, (error) => {
                console.error("Erro ao buscar usuários: ", error);
            });
        };

        fetchData();

        return () => {
            if (clientUnsubscribe) clientUnsubscribe();
            if (userUnsubscribe) userUnsubscribe();
        };
    }, []);

    const addClient = async (clientData) => { try { const docRef = await addDoc(collection(db, "clients"), clientData); return { id: docRef.id, ...clientData }; } catch (e) { console.error("Erro ao adicionar cliente: ", e); return null; } };
    const updateClient = async (clientId, updatedData) => { const clientDoc = doc(db, "clients", clientId); try { await updateDoc(clientDoc, updatedData); return { id: clientId, ...updatedData }; } catch (e) { console.error("Erro ao atualizar cliente: ", e); return null; } };
    const deleteClient = async (clientId) => { const clientDoc = doc(db, "clients", clientId); try { await deleteDoc(clientDoc); return true; } catch (e) { console.error("Erro ao apagar cliente: ", e); return false; } };
    const addOperator = (operatorData) => { const newOperator = { ...operatorData, id: `op_${Date.now()}`}; setOperators(prev => [...prev, newOperator]); return newOperator; };
    const deleteOperator = (operatorId) => { setOperators(prev => prev.filter(op => op.id !== operatorId)); };
    
    const value = { clients, users, activityFeed, operators, loading, addClient, updateClient, deleteClient, getClientById: (id) => clients.find(c => c.id === id), addOperator, deleteOperator };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
const useData = () => useContext(DataContext);

const NotificationContext = createContext();
const NotificationProvider = ({ children }) => { const [toasts, setToasts] = useState([]); const toast = ({ title, description, variant = 'default' }) => { const id = Date.now(); setToasts(prev => [...prev, { id, title, description, variant }]); setTimeout(() => setToasts(t => t.filter(currentToast => currentToast.id !== id)), 4000); }; return <NotificationContext.Provider value={{ toast, toasts }}>{children}<Toaster /></NotificationContext.Provider>; };
const useToast = () => useContext(NotificationContext);

// --- COMPONENTES DE UI ---
const GlassPanel = forwardRef(({ className, children, ...props }, ref) => ( <div ref={ref} className={cn("bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-lg", className)} {...props}>{children}</div> ));
const Button = forwardRef(({ className, variant = 'default', size, ...props }, ref) => { const variants = { default: "bg-cyan-500 text-white hover:bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]", destructive: "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]", outline: "border border-cyan-500/50 bg-transparent text-cyan-400 hover:bg-cyan-500/10", ghost: "hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300", }; const sizes = { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" }; return <button className={cn("inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} ref={ref} {...props} />; });
const Input = forwardRef(({ className, ...props }, ref) => ( <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500", className)} {...props} /> ));
const Label = forwardRef(({ className, ...props }, ref) => ( <label ref={ref} className={cn("text-sm font-medium text-gray-600 dark:text-gray-400", className)} {...props} /> ));
const Textarea = forwardRef(({ className, ...props }, ref) => ( <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500", className)} {...props} /> ));
const Select = forwardRef(({ className, children, ...props }, ref) => ( <select ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500", className)} {...props}> {children} </select> ));
const Checkbox = forwardRef(({ className, ...props }, ref) => ( <input type="checkbox" ref={ref} className={cn("h-4 w-4 shrink-0 rounded-sm border-2 border-cyan-500/50 text-cyan-500 bg-gray-200 dark:bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-900", className)} {...props} /> ));
const TabsContext = createContext();
const Tabs = ({ defaultValue, children, className }) => { const [activeTab, setActiveTab] = useState(defaultValue); return <TabsContext.Provider value={{ activeTab, setActiveTab }}><div className={className}>{children}</div></TabsContext.Provider>; };
const TabsList = ({ children, className }) => <div className={cn("flex items-center border-b border-gray-200 dark:border-white/10 overflow-x-auto", className)}>{children}</div>;
const TabsTrigger = ({ value, children, className }) => { const { activeTab, setActiveTab } = useContext(TabsContext); const isActive = activeTab === value; return <button type="button" onClick={() => setActiveTab(value)} className={cn("relative inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 disabled:pointer-events-none", isActive ? "text-cyan-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white", className)}>{children}{isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}</button>; };
const TabsContent = ({ value, children, className }) => { const { activeTab } = useContext(TabsContext); return activeTab === value ? <div className={cn("mt-6", className)}>{children}</div> : null; };

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 animate-fade-in p-4 pt-16 sm:pt-24 overflow-y-auto" onClick={onClose}>
            <GlassPanel 
                className="relative w-full max-w-2xl animate-slide-up flex flex-col" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><XIcon className="h-5 w-5" /></Button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {children}
                </div>
            </GlassPanel>
        </div>,
        document.body
    );
};

const DonutChart = ({ data, title }) => { const colors = ["#06B6D4", "#6366F1", "#EC4899", "#F59E0B"]; const total = data.reduce((acc, item) => acc + item.value, 0); let cumulative = 0; return ( <GlassPanel className="p-6 h-full"> <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3> <div className="flex items-center justify-center gap-6"> <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90"> <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="3" /> {data.map((item, index) => { const percentage = total > 0 ? (item.value / total) * 100 : 0; const offset = cumulative; cumulative += percentage; return (<circle key={item.name} cx="18" cy="18" r="15.915" fill="transparent" stroke={colors[index % colors.length]} strokeWidth="3" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-offset} className="transition-all duration-500" />); })} </svg> <div className="text-sm space-y-2"> {data.map((item, index) => ( <div key={item.name} className="flex items-center gap-2"> <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div> <span className="text-gray-600 dark:text-gray-300">{item.name}</span> <span className="font-bold text-gray-900 dark:text-white">{total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%</span> </div> ))} </div> </div> </GlassPanel> ); };
const BarChart = ({ data, title }) => { const maxValue = Math.max(...data.map(item => item.value), 0) || 1; return ( <GlassPanel className="p-6 h-full"> <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3> <div className="flex justify-around items-end h-48 gap-4"> {data.map(item => ( <div key={item.name} className="flex flex-col items-center justify-end h-full w-full"> <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p> <div className="w-1/2 bg-cyan-500/50 hover:bg-cyan-500 rounded-t-md transition-all duration-300 mt-1" style={{ height: `${(item.value / maxValue) * 80}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }} title={`${item.name}: ${item.value} clientes`}> </div> <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.name}</p> </div> ))} </div> </GlassPanel> ); };

// --- COMPONENTES DE FORMULÁRIO COMPLETOS ---
const FormSection = ({ title, children }) => ( <div className="mb-8"><h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">{title}</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div></div> );
const GeneralInfoForm = ({ formData, handleChange }) => ( <FormSection title="Visão Geral"> <div><Label>Status do Cliente</Label><Select name="general.status" value={formData?.general?.status || ''} onChange={handleChange}><option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option></Select></div> <div><Label>Tipo de Pessoa</Label><Select name="general.clientType" value={formData?.general?.clientType || ''} onChange={handleChange}><option>PME</option><option>Pessoa Física</option><option>Adesão</option></Select></div> <div className="lg:col-span-1"><Label>Nome da Empresa / Cliente</Label><Input name="general.companyName" value={formData?.general?.companyName || ''} onChange={handleChange} /></div> {formData?.general?.clientType === 'PME' && (<> <div><Label>CNPJ</Label><Input name="general.cnpj" value={formData?.general?.cnpj || ''} onChange={handleChange} /></div> <div><Label>Nome do Responsável</Label><Input name="general.responsibleName" value={formData?.general?.responsibleName || ''} onChange={handleChange} /></div> <div><Label>CPF do Responsável</Label><Input name="general.responsibleCpf" value={formData?.general?.responsibleCpf || ''} onChange={handleChange} /></div> </>)} <div><Label>Nome do Titular</Label><Input name="general.holderName" value={formData?.general?.holderName || ''} onChange={handleChange} /></div> <div><Label>CPF do Titular</Label><Input name="general.holderCpf" value={formData?.general?.holderCpf || ''} onChange={handleChange} /></div> <div><Label>E-mail do Cliente</Label><Input type="email" name="general.email" value={formData?.general?.email || ''} onChange={handleChange} /></div> <div><Label>Celular / Telefone (Cliente)</Label><Input type="tel" name="general.phone" value={formData?.general?.phone || ''} onChange={handleChange} /></div> <div><Label>Nome do Contato (recados)</Label><Input name="general.contactName" value={formData?.general?.contactName || ''} onChange={handleChange} /></div> <div><Label>Celular / Telefone (Contato)</Label><Input type="tel" name="general.contactPhone" value={formData?.general?.contactPhone || ''} onChange={handleChange} /></div> </FormSection> );
const ContractValuesForm = ({ formData, handleChange, handleCheckboxChange }) => { const { operators } = useData(); return ( <FormSection title="Contrato e Valores"> <div><Label>Número da Proposta</Label><Input name="contract.proposalNumber" value={formData?.contract?.proposalNumber || ''} onChange={handleChange} /></div> <div><Label>Número da Apólice / Contrato</Label><Input name="contract.policyNumber" value={formData?.contract?.policyNumber || ''} onChange={handleChange} /></div> <div> <Label>Plano Fechado (Operadora)</Label> <Select name="contract.planOperator" value={formData?.contract?.planOperator || ''} onChange={handleChange}> <option value="">Selecione a Operadora</option> {operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)} </Select> </div> <div><Label>Plano Anterior</Label><Input name="contract.previousPlan" value={formData?.contract?.previousPlan || ''} onChange={handleChange} /></div> <div className="lg:col-span-3"><Label>Tipo de Plano</Label><div className="flex gap-4 mt-2 text-gray-700 dark:text-gray-300"><label className="flex items-center gap-2"><Checkbox name="contract.planTypes" value="Saúde" checked={formData?.contract?.planTypes?.includes('Saúde')} onChange={handleCheckboxChange} /> Saúde</label><label className="flex items-center gap-2"><Checkbox name="contract.planTypes" value="Dental" checked={formData?.contract?.planTypes?.includes('Dental')} onChange={handleCheckboxChange} /> Dental</label></div></div> <div><Label>Categoria do Plano</Label><Input name="contract.planCategory" value={formData?.contract?.planCategory || ''} onChange={handleChange} /></div> <div><Label>Acomodação</Label><Select name="contract.accommodation" value={formData?.contract?.accommodation || ''} onChange={handleChange}><option>Enfermaria</option><option>Apartamento</option></Select></div> <div><Label>Valor do Contrato</Label><Input type="number" step="0.01" name="contract.contractValue" value={formData?.contract?.contractValue || ''} onChange={handleChange} /></div> <div><Label>Valor da Taxa</Label><Input type="number" step="0.01" name="contract.feeValue" value={formData?.contract?.feeValue || ''} onChange={handleChange} /></div> <div><Label>Forma de Pagamento</Label><Select name="contract.paymentMethod" value={formData?.contract?.paymentMethod || ''} onChange={handleChange}><option>Boleto</option><option>Cartão de Crédito</option><option>Débito Automático</option><option>Pix</option></Select></div> <div><Label>Data da Vigência</Label><Input type="date" name="contract.effectiveDate" value={formData?.contract?.effectiveDate || ''} onChange={handleChange} /></div> <div><Label>Vencimento Mensal (Dia)</Label><Input type="number" min="1" max="31" name="contract.monthlyDueDate" value={formData?.contract?.monthlyDueDate || ''} onChange={handleChange} /></div> <div><Label>Data Envio do Boleto</Label><Input type="date" name="contract.boletoSentDate" value={formData?.contract?.boletoSentDate || ''} onChange={handleChange} /></div> </FormSection> ); };
const CredentialsAccessForm = ({ formData, handleChange }) => ( <FormSection title="Credenciais e Acessos"> <div><Label>E-mail Criado</Label><Input type="email" name="credentials.createdEmail" value={formData?.credentials?.createdEmail || ''} onChange={handleChange} /></div> <div><Label>Senha do E-mail Criado</Label><Input type="password" name="credentials.emailPassword" value={formData?.credentials?.emailPassword || ''} onChange={handleChange} /></div> <div><Label>Site do Portal</Label><Input type="url" name="credentials.portalSite" value={formData?.credentials?.portalSite || ''} onChange={handleChange} /></div> <div><Label>Login do Portal</Label><Input name="credentials.portalLogin" value={formData?.credentials?.portalLogin || ''} onChange={handleChange} /></div> <div><Label>Senha do Portal</Label><Input type="password" name="credentials.portalPassword" value={formData?.credentials?.portalPassword || ''} onChange={handleChange} /></div> <div><Label>Login do App</Label><Input name="credentials.appLogin" value={formData?.credentials?.appLogin || ''} onChange={handleChange} /></div> <div><Label>Senha do App</Label><Input type="password" name="credentials.appPassword" value={formData?.credentials?.appPassword || ''} onChange={handleChange} /></div> </FormSection> );
const InternalDataForm = ({ formData, handleChange }) => { const { users } = useData(); return ( <FormSection title="Dados Internos e Gestão"> <div><Label>Corretor</Label><Select name="internal.brokerId" value={formData?.internal?.brokerId || ''} onChange={handleChange}><option value="">Selecione...</option>{users.map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}</Select></div> <div><Label>Plataforma Entregue</Label><Input name="internal.platformDelivered" value={formData?.internal?.platformDelivered || ''} onChange={handleChange} /></div> <div><Label>Data da Entrega</Label><Input type="date" name="internal.deliveryDate" value={formData?.internal?.deliveryDate || ''} onChange={handleChange} /></div> </FormSection> ); };
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries }) => { const [isModalOpen, setModalOpen] = useState(false); const [currentBeneficiary, setCurrentBeneficiary] = useState(null); const handleSave = (beneficiary) => { if (currentBeneficiary && currentBeneficiary.id) { setBeneficiaries(beneficiaries.map(b => b.id === currentBeneficiary.id ? beneficiary : b)); } else { setBeneficiaries([...beneficiaries, { ...beneficiary, id: `new_${Date.now()}` }]); } setCurrentBeneficiary(null); setModalOpen(false); }; const handleEdit = (beneficiary) => { setCurrentBeneficiary(beneficiary); setModalOpen(true); }; const handleRemove = (id) => { setBeneficiaries(beneficiaries.filter(b => b.id !== id)); }; return ( <div className="mb-8"> <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400/80">Beneficiários</h3><Button type="button" onClick={() => { setCurrentBeneficiary(null); setModalOpen(true); }}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar</Button></div> <div className="bg-gray-200/50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3"> {(beneficiaries || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhum beneficiário adicionado.</p> : (beneficiaries || []).map(ben => ( <div key={ben?.id} className="flex justify-between items-center bg-white dark:bg-gray-800/70 p-3 rounded-md"> <div> <p className="font-medium text-gray-900 dark:text-white">{ben?.name}</p> <p className="text-sm text-gray-600 dark:text-gray-400">{ben?.kinship} - {ben?.dob}</p> </div> <div className="flex gap-2"> <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ben)}><PencilIcon className="h-4 w-4" /></Button> <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => handleRemove(ben.id)}><Trash2Icon className="h-4 w-4" /></Button> </div> </div> ))} </div> <BeneficiaryModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} beneficiary={currentBeneficiary} /> </div> ); };
const BeneficiaryModal = ({ isOpen, onClose, onSave, beneficiary }) => { const [formState, setFormState] = useState({ credentials: {} }); useEffect(() => { setFormState(beneficiary || { credentials: {} }); }, [beneficiary]); const handleChange = (e) => { const { name, value } = e.target; if (name.startsWith('credentials.')) { const field = name.split('.')[1]; setFormState(prev => ({ ...prev, credentials: { ...prev.credentials, [field]: value } })); } else { setFormState({ ...formState, [name]: value }); } }; const handleSubmit = (e) => { e.preventDefault(); onSave(formState); }; return ( <Modal isOpen={isOpen} onClose={onClose} title={beneficiary ? "Editar Beneficiário" : "Adicionar Beneficiário"}> <form onSubmit={handleSubmit} className="space-y-4"> <Tabs defaultValue="info" className="w-full"> <TabsList> <TabsTrigger value="info">Informações Pessoais</TabsTrigger> <TabsTrigger value="credentials">Credenciais de Acesso</TabsTrigger> </TabsList> <TabsContent value="info"> <div className="space-y-4 pt-4"> <div><Label>Nome Completo</Label><Input name="name" value={formState?.name || ''} onChange={handleChange} required /></div> <div><Label>Data de Nascimento</Label><Input type="date" name="dob" value={formState?.dob || ''} onChange={handleChange} required /></div> <div><Label>Parentesco</Label><Select name="kinship" value={formState?.kinship || ''} onChange={handleChange} required><option>Titular</option><option>Cônjuge</option><option>Filho(a)</option><option>Outro</option></Select></div> <div><Label>Peso (kg)</Label><Input type="number" name="weight" value={formState?.weight || ''} onChange={handleChange} /></div> <div><Label>Altura (m)</Label><Input type="number" step="0.01" name="height" value={formState?.height || ''} onChange={handleChange} /></div> <div><Label>Número da Carteirinha</Label><Input name="idCardNumber" value={formState?.idCardNumber || ''} onChange={handleChange} /></div> </div> </TabsContent> <TabsContent value="credentials"> <div className="space-y-4 pt-4"> <div><Label>Login do Portal</Label><Input name="credentials.portalLogin" value={formState?.credentials?.portalLogin || ''} onChange={handleChange} /></div> <div><Label>Senha do Portal</Label><Input type="password" name="credentials.portalPassword" value={formState?.credentials?.portalPassword || ''} onChange={handleChange} /></div> </div> </TabsContent> </Tabs> <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar</Button></div> </form> </Modal> ); };
const DocumentsObservationsForm = ({ formData, handleChange }) => ( <div className="mb-8"> <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">Documentos e Observações</h3> <div className="grid grid-cols-1 gap-6"> <div> <Label>Anexos</Label> <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-white/20 px-6 py-10"> <div className="text-center"> <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500" /> <div className="mt-4 flex text-sm text-gray-500 dark:text-gray-400"> <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-cyan-600 dark:text-cyan-400 focus-within:outline-none hover:text-cyan-500"> <span>Carregar um ficheiro</span> <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple /> </label> <p className="pl-1">ou arraste e solte</p> </div> <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, PDF até 10MB</p> </div> </div> </div> <div><Label>Observações</Label><Textarea name="observations" value={formData?.observations || ''} onChange={handleChange} rows={5} /></div> </div> </div> );
const DetailItem = ({ label, value, isPassword = false, isLink = false }) => { const { toast } = useToast(); const [showPassword, setShowPassword] = useState(false); const handleCopy = () => { try { const tempInput = document.createElement('textarea'); tempInput.value = value; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); toast({ title: 'Copiado!', description: `${label} copiado.` }); } catch (err) { console.error('Falha ao copiar:', err); toast({ title: 'Erro', description: `Não foi possível copiar.`, variant: 'destructive' }); } }; const displayValue = value || 'N/A'; return ( <div className="py-3"><Label>{label}</Label> <div className="flex items-center justify-between mt-1 group"> <p className="text-md text-gray-800 dark:text-gray-100 break-words">{isLink && value ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:underline">{displayValue}</a> : (isPassword && !showPassword ? '••••••••' : displayValue)}</p> <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"> {isPassword && value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</Button>)} {value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}><CopyIcon className="h-4 w-4" /></Button>)} </div> </div> </div> ); };
const OverviewTab = ({ client }) => ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="Status" value={client?.general?.status} /> <DetailItem label="Tipo de Pessoa" value={client?.general?.clientType} /> <DetailItem label="Nome Empresa/Cliente" value={client?.general?.companyName} /> {client?.general?.clientType === 'PME' && (<> <DetailItem label="CNPJ" value={client?.general?.cnpj} /> <DetailItem label="Nome do Responsável" value={client?.general?.responsibleName} /> <DetailItem label="CPF do Responsável" value={client?.general?.responsibleCpf} /> </>)} <DetailItem label="Nome do Titular" value={client?.general?.holderName} /> <DetailItem label="CPF do Titular" value={client?.general?.holderCpf} /> <DetailItem label="E-mail" value={client?.general?.email} /> <DetailItem label="Telefone (Cliente)" value={client?.general?.phone} /> <DetailItem label="Contato (Recados)" value={client?.general?.contactName} /> <DetailItem label="Telefone (Contato)" value={client?.general?.contactPhone} /> </div> );
const ContractValuesTab = ({ client }) => ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="Nº da Proposta" value={client?.contract?.proposalNumber} /> <DetailItem label="Nº da Apólice/Contrato" value={client?.contract?.policyNumber} /> <DetailItem label="Operadora" value={client?.contract?.planOperator} /> <DetailItem label="Plano Anterior" value={client?.contract?.previousPlan} /> <DetailItem label="Tipo de Plano" value={client?.contract?.planTypes?.join(', ')} /> <DetailItem label="Categoria" value={client?.contract?.planCategory} /> <DetailItem label="Acomodação" value={client?.contract?.accommodation} /> <DetailItem label="Valor do Contrato" value={client?.contract?.contractValue ? `R$ ${client.contract.contractValue}` : 'N/A'} /> <DetailItem label="Valor da Taxa" value={client?.contract?.feeValue ? `R$ ${client.contract.feeValue}` : 'N/A'} /> <DetailItem label="Forma de Pagamento" value={client?.contract?.paymentMethod} /> <DetailItem label="Data da Vigência" value={client?.contract?.effectiveDate} /> <DetailItem label="Vencimento Mensal" value={client?.contract?.monthlyDueDate ? `Dia ${client.contract.monthlyDueDate}`: 'N/A'} /> <DetailItem label="Data Envio do Boleto" value={client?.contract?.boletoSentDate} /> </div> );
const CredentialsTab = ({ client }) => ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="E-mail Criado" value={client?.credentials?.createdEmail} /> <DetailItem label="Senha do E-mail" value={client?.credentials?.emailPassword} isPassword /> <DetailItem label="Site do Portal" value={client?.credentials?.portalSite} isLink /> <DetailItem label="Login do Portal" value={client?.credentials?.portalLogin} /> <DetailItem label="Senha do Portal" value={client?.credentials?.portalPassword} isPassword /> <DetailItem label="Login do App" value={client?.credentials?.appLogin} /> <DetailItem label="Senha do App" value={client?.credentials?.appPassword} isPassword /> </div> );
const InternalTab = ({ client }) => { const { users } = useData(); const broker = users.find(u => u.id === client?.internal?.brokerId); return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="Corretor" value={broker?.name} /> <DetailItem label="Plataforma Entregue" value={client?.internal?.platformDelivered} /> <DetailItem label="Data da Entrega" value={client?.internal?.deliveryDate} /> </div> ); };
const BeneficiariesTab = ({ client }) => ( <div> {(client?.beneficiaries || []).length > 0 ? ( <div className="space-y-4"> {(client?.beneficiaries || []).map(ben => ( <GlassPanel key={ben?.id} className="p-4 bg-gray-100 dark:bg-gray-900/50"> <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{ben?.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">- {ben?.kinship}</span></h4> <Tabs defaultValue="info"> <TabsList> <TabsTrigger value="info">Informações</TabsTrigger> <TabsTrigger value="credentials">Credenciais</TabsTrigger> </TabsList> <TabsContent value="info"> <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm"> <p><span className="font-medium text-gray-600 dark:text-gray-400">Nascimento:</span> {ben?.dob || 'N/A'}</p> <p><span className="font-medium text-gray-600 dark:text-gray-400">Peso:</span> {ben?.weight ? `${ben.weight} kg` : 'N/A'}</p> <p><span className="font-medium text-gray-600 dark:text-gray-400">Altura:</span> {ben?.height ? `${ben.height} m` : 'N/A'}</p> <p><span className="font-medium text-gray-600 dark:text-gray-400">Carteirinha:</span> {ben?.idCardNumber || 'N/A'}</p> </div> </TabsContent> <TabsContent value="credentials"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="Login do Portal" value={ben?.credentials?.portalLogin} /> <DetailItem label="Senha do Portal" value={ben?.credentials?.portalPassword} isPassword /> </div> </TabsContent> </Tabs> </GlassPanel> ))} </div> ) : (<p className="text-gray-500">Nenhum beneficiário cadastrado.</p>)} </div> );
const DocumentsTab = ({ client }) => ( <div><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client?.observations || 'Nenhuma observação.'}</p></div> );

// --- COMPONENTES DE PÁGINA ---
function LoginPage() { const { login } = useAuth(); const { toast } = useToast(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const success = await login(email, password); if (!success) { toast({ title: "Falha na Autenticação", description: "Credenciais inválidas ou erro de rede.", variant: "destructive" }); } setLoading(false); }; return ( <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4"> <GlassPanel className="w-full max-w-sm p-8"> <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">OLYMPUS CRM</h1> <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Acesso ao Centro de Comando</p> <form onSubmit={handleSubmit} className="space-y-6"> <div><Label htmlFor="email">Email do Utilizador</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" /></div> <div><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" /></div> <Button type="submit" variant="default" className="w-full !h-12 !text-base" disabled={loading}>{loading ? 'A Autenticar...' : 'Entrar'}</Button> </form> </GlassPanel> </div> ); }
function DashboardHome() { const { clients } = useData(); const salesFunnelData = ['Prospect', 'Pendente', 'Ativo', 'Inativo'].map(status => ({ name: status, value: clients.filter(c => c?.general?.status === status).length })); const totalMRR = clients.reduce((acc, client) => (client?.general?.status === 'Ativo' ? acc + parseFloat(client?.contract?.contractValue || 0) : acc), 0); const activeClientsCount = clients.filter(c => c?.general?.status === 'Ativo').length; const topPlansData = clients.reduce((acc, client) => { const plan = client?.contract?.planOperator || 'N/A'; const existing = acc.find(p => p.name === plan); if (existing) { existing.value += 1; } else { acc.push({ name: plan, value: 1 }); } return acc; }, []); return ( <div className="p-4 sm:p-6 lg:p-8 space-y-8"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> <GlassPanel className="p-6"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Ticket Médio Mensal</h3><p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">R$ {(totalMRR / (activeClientsCount || 1)).toFixed(2)}</p></GlassPanel> <GlassPanel className="p-6"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Novos Clientes (Mês)</h3><p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">0</p></GlassPanel> <GlassPanel className="p-6"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Contratos Ativos (MRR)</h3><p className="text-3xl font-bold text-cyan-500 dark:text-cyan-400 mt-2">R$ {totalMRR.toFixed(2)}</p></GlassPanel> <GlassPanel className="p-6"><h3 className="text-gray-500 dark:text-gray-400 font-medium">Funil de Vendas</h3><div className="flex flex-wrap justify-center gap-4 mt-2">{salesFunnelData.map(item => <div key={item.name} className="text-center"><p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p><p className="text-xs text-gray-500">{item.name}</p></div>)}</div></GlassPanel> </div> <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> <div className="lg:col-span-2"><BarChart data={[]} title="Performance da Equipe (Clientes)" /></div> <div><DonutChart data={topPlansData} title="Planos Mais Vendidos" /></div> </div> <GlassPanel className="p-6"> <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Feed de Atividade Recente</h3> <div className="space-y-4 max-h-48 overflow-y-auto"></div> </GlassPanel> </div> ); }
function ClientForm({ client, onSave, onCancel }) { const [formData, setFormData] = useState({}); const { addClient, updateClient, loading } = useData(); const { toast } = useToast(); useEffect(() => { const defaultData = { general: { status: 'Prospect', clientType: 'Pessoa Física' }, contract: { planTypes: [] }, credentials: {}, internal: {}, beneficiaries: [], observations: '' }; setFormData(client ? JSON.parse(JSON.stringify(client)) : defaultData); }, [client]); const handleChange = (e) => { const { name, value } = e.target; const [section, field] = name.split('.'); if (field) setFormData(p => ({ ...p, [section]: { ...p[section], [field]: value } })); else setFormData(p => ({ ...p, [section]: value })); }; const handleCheckboxChange = (e) => { const { name, value, checked } = e.target; const [section, field] = name.split('.'); const current = formData[section]?.[field] || []; const newValues = checked ? [...current, value] : current.filter(v => v !== value); setFormData(p => ({ ...p, [section]: { ...p[section], [field]: newValues } })); }; const setBeneficiaries = (beneficiaries) => setFormData(p => ({ ...p, beneficiaries })); const handleSubmit = async (e) => { e.preventDefault(); const { id, ...dataToSave } = formData; const result = client?.id ? await updateClient(client.id, dataToSave) : await addClient(dataToSave); if (result) { toast({ title: "Operação Concluída", description: `Cliente ${client?.id ? 'atualizado' : 'criado'} com sucesso.` }); onSave(result); } else { toast({ title: "Erro", description: `Não foi possível guardar o cliente.`, variant: 'destructive' }); } }; return ( <div className="p-4 sm:p-6 lg:p-8"> <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{client?.id ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2> <form onSubmit={handleSubmit}> <GlassPanel className="p-6"> <Tabs defaultValue="general"> <TabsList> <TabsTrigger value="general">Visão Geral</TabsTrigger> <TabsTrigger value="contract">Contrato e Valores</TabsTrigger> <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger> <TabsTrigger value="credentials">Credenciais</TabsTrigger> <TabsTrigger value="internal">Dados Internos</TabsTrigger> <TabsTrigger value="docs">Documentos e Obs.</TabsTrigger> </TabsList> <TabsContent value="general"><GeneralInfoForm formData={formData} handleChange={handleChange} /></TabsContent> <TabsContent value="contract"><ContractValuesForm formData={formData} handleChange={handleChange} handleCheckboxChange={handleCheckboxChange} /></TabsContent> <TabsContent value="beneficiaries"><BeneficiariesForm beneficiaries={formData.beneficiaries || []} setBeneficiaries={setBeneficiaries} /></TabsContent> <TabsContent value="credentials"><CredentialsAccessForm formData={formData} handleChange={handleChange} /></TabsContent> <TabsContent value="internal"><InternalDataForm formData={formData} handleChange={handleChange} /></TabsContent> <TabsContent value="docs"><DocumentsObservationsForm formData={formData} handleChange={handleChange} /></TabsContent> </Tabs> </GlassPanel> <div className="flex justify-end gap-4 mt-8"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? 'A Guardar...' : 'Guardar Cliente'}</Button></div> </form> </div> ); }
const ClientsList = ({ onClientSelect, onAddClient }) => {
    const { clients, loading, operators } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', operator: '', month: '' });
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredClients = clients.filter(client => {
        // Lógica de busca aprimorada
        const searchableString = (`${client?.general?.companyName || ''} ${client?.general?.holderName || ''} ${client?.general?.email || ''}`).toLowerCase();
        const searchMatch = searchableString.includes(searchTerm.toLowerCase());
        
        const statusMatch = filters.status ? client?.general?.status === filters.status : true;
        const operatorMatch = filters.operator ? client?.contract?.planOperator === filters.operator : true;
        const monthMatch = filters.month ? client?.contract?.effectiveDate?.startsWith(filters.month) : true;
        
        return searchMatch && statusMatch && operatorMatch && monthMatch;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><FilterIcon className="h-4 w-4 mr-2" /> Filtros</Button>
                    <Button onClick={onAddClient}><PlusCircleIcon className="h-5 w-5 mr-2" /> Adicionar Cliente</Button>
                </div>
            </div>

            {showFilters && (
                <GlassPanel className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input placeholder="Procurar por nome, titular ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">Todos os Status</option>
                            <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                        </Select>
                        <Select name="operator" value={filters.operator} onChange={handleFilterChange}>
                            <option value="">Todas as Operadoras</option>
                            {operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                        </Select>
                        <Input type="month" name="month" value={filters.month} onChange={handleFilterChange} />
                    </div>
                </GlassPanel>
            )}

            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full"><thead className="border-b border-gray-200 dark:border-white/10"><tr>{['Nome', 'Status', 'Plano', 'Vigência'].map(h => <th key={h} scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-200 dark:divide-white/10">{loading ? (<tr><td colSpan="4" className="text-center p-8 text-gray-500">A carregar dados do Firestore...</td></tr>) : (filteredClients.map((client) => (<tr key={client.id} onClick={() => onClientSelect(client.id)} className="hover:bg-gray-100 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                            {/* Lógica de exibição corrigida */}
                            <div className="font-medium text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{client?.general?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${client?.general?.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>{client?.general?.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{client?.contract?.planOperator}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client?.contract?.effectiveDate || 'N/A'}</td>
                    </tr>)))}</tbody></table>
                </div>
            </GlassPanel>
        </div>
    );
};
const ClientDetails = ({ client, onBack, onEdit }) => { const { toast } = useToast(); const { deleteClient } = useData(); if (!client) return null; const handleDelete = () => { if (window.confirm(`Tem a certeza que deseja excluir o cliente ${client?.general?.companyName || client?.general?.holderName}?`)) { deleteClient(client.id); toast({ title: "Cliente Excluído", description: `${client?.general?.companyName || client?.general?.holderName} foi removido com sucesso.` }); onBack(); } }; return ( <div className="p-4 sm:p-6 lg:p-8"> <div className="flex justify-between items-start mb-6 gap-4"> <div><button onClick={onBack} className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar</button><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</h2></div> <div className="flex gap-2"> <Button variant="outline" onClick={() => onEdit(client)}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button> <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir Cliente</Button> </div> </div> <GlassPanel className="p-6"> <Tabs defaultValue="overview"> <TabsList> <TabsTrigger value="overview">Visão Geral</TabsTrigger> <TabsTrigger value="contract">Contrato</TabsTrigger> <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger> <TabsTrigger value="credentials">Credenciais</TabsTrigger> <TabsTrigger value="internal">Interno</TabsTrigger> <TabsTrigger value="docs">Documentos e Obs.</TabsTrigger> </TabsList> <TabsContent value="overview"><OverviewTab client={client} /></TabsContent> <TabsContent value="contract"><ContractValuesTab client={client} /></TabsContent> <TabsContent value="beneficiaries"><BeneficiariesTab client={client} /></TabsContent> <TabsContent value="credentials"><CredentialsTab client={client} /></TabsContent> <TabsContent value="internal"><InternalTab client={client} /></TabsContent> <TabsContent value="docs"><DocumentsTab client={client} /></TabsContent> </Tabs> </GlassPanel> </div> ); };
const CorporatePage = ({ onUserSelect }) => { const { users } = useData(); const { addUser } = useAuth(); const { operators, addOperator, deleteOperator } = useData(); const { toast } = useToast(); const [isUserModalOpen, setUserModalOpen] = useState(false); const [isOperatorModalOpen, setOperatorModalOpen] = useState(false); const [itemToDelete, setItemToDelete] = useState(null); const confirmDelete = () => { if (!itemToDelete) return; deleteOperator(itemToDelete.id); toast({ title: "Operadora Removida", description: `${itemToDelete.name} foi removida.` }); setItemToDelete(null); }; const handleAddOperator = (newOperatorData) => { addOperator(newOperatorData); toast({ title: "Operadora Adicionada", description: `${newOperatorData.name} foi adicionada.` }); setOperatorModalOpen(false); }; const handleAddUser = async (newUserData) => { const result = await addUser(newUserData); if (result === true) { toast({ title: "Colaborador Adicionado", description: `${newUserData.name} foi adicionado ao sistema.` }); setUserModalOpen(false); } else { toast({ title: "Erro ao Adicionar", description: `Não foi possível adicionar o colaborador. Erro: ${result}`, variant: 'destructive' }); } }; return ( <div className="p-4 sm:p-6 lg:p-8"> <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestão Corporativa</h2> <GlassPanel className="p-6"> <Tabs defaultValue="collaborators"> <TabsList> <TabsTrigger value="collaborators">Colaboradores</TabsTrigger> <TabsTrigger value="operators">Operadoras</TabsTrigger> <TabsTrigger value="company">Minha Empresa</TabsTrigger> </TabsList> <TabsContent value="collaborators"> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Utilizadores do Sistema</h3> <Button onClick={() => setUserModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Colaborador</Button> </div> <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 space-y-3"> {users.map(user => ( <div key={user.id} className="flex justify-between items-center bg-white dark:bg-gray-800/70 p-3 rounded-md"> <div> <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p> <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email} - <span className="font-semibold">{user?.permissionLevel}</span></p> </div> <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" disabled><Trash2Icon className="h-4 w-4" /></Button> </div> ))} </div> </TabsContent> <TabsContent value="operators"> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Operadoras de Saúde</h3> <Button onClick={() => setOperatorModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Operadora</Button> </div> <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 space-y-3"> {operators.map(op => ( <div key={op.id} className="flex justify-between items-center bg-white dark:bg-gray-800/70 p-3 rounded-md"> <p className="font-medium text-gray-900 dark:text-white">{op.name}</p> <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => setItemToDelete(op)}><Trash2Icon className="h-4 w-4" /></Button> </div> ))} </div> </TabsContent> <TabsContent value="company"> <FormSection title="Informações da Minha Empresa"> <div><Label>Nome da Empresa</Label><Input defaultValue="Horizons Corretora" /></div> <div><Label>CNPJ</Label><Input defaultValue="00.111.222/0001-33" /></div> <div><Label>Endereço</Label><Input defaultValue="Rua das Inovações, 123, São Paulo" /></div> </FormSection> </TabsContent> </Tabs> </GlassPanel> <AddCollaboratorModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleAddUser} /> <AddOperatorModal isOpen={isOperatorModalOpen} onClose={() => setOperatorModalOpen(false)} onSave={handleAddOperator} /> <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão"> <p className="text-gray-700 dark:text-gray-300">Tem a certeza que deseja remover <span className="font-bold text-gray-900 dark:text-white">{itemToDelete?.name}</span>? Esta ação não pode ser desfeita.</p> <div className="flex justify-end gap-4 mt-6"> <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button> <Button variant="destructive" onClick={confirmDelete}>Excluir</Button> </div> </Modal> </div> ); };
const AddCollaboratorModal = ({ isOpen, onClose, onSave }) => { const [formData, setFormData] = useState({ name: '', email: '', password: '', permissionLevel: 'Corretor' }); const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value })); const handleSubmit = (e) => { e.preventDefault(); onSave(formData); setFormData({ name: '', email: '', password: '', permissionLevel: 'Corretor' }); }; return ( <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Colaborador"> <form onSubmit={handleSubmit} className="space-y-4"> <div><Label>Nome Completo</Label><Input name="name" onChange={handleChange} required /></div> <div><Label>Email</Label><Input type="email" name="email" onChange={handleChange} required /></div> <div><Label>Senha</Label><Input type="password" name="password" onChange={handleChange} required /></div> <div><Label>Nível de Permissão</Label><Select name="permissionLevel" value={formData.permissionLevel} onChange={handleChange}><option>Corretor</option><option>Admin</option></Select></div> <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Adicionar</Button></div> </form> </Modal> ); };
const AddOperatorModal = ({ isOpen, onClose, onSave }) => { const [name, setName] = useState(''); const handleSubmit = (e) => { e.preventDefault(); onSave({ name }); setName(''); }; return ( <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Operadora"> <form onSubmit={handleSubmit} className="space-y-4"> <div><Label>Nome da Operadora</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div> <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Adicionar</Button></div> </form> </Modal> ); };
const CalendarPage = () => { const [currentDate, setCurrentDate] = useState(new Date()); const [selectedDay, setSelectedDay] = useState(null); const { clients, updateClient } = useData(); const { toast } = useToast(); const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1); const startingDay = firstDayOfMonth.getDay(); const events = clients.reduce((acc, client) => { if (client?.contract?.boletoSentDate) { const eventDate = new Date(client.contract.boletoSentDate + 'T00:00:00'); if (eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === currentDate.getMonth()) { const day = eventDate.getDate(); if (!acc[day]) acc[day] = []; acc[day].push(client); } } return acc; }, {}); const changeMonth = (offset) => { setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)); }; const handleUpdateClientFromCalendar = (clientId, updatedContractData) => { const client = clients.find(c => c.id === clientId); if (client) { const updatedClient = { ...client, contract: { ...client.contract, ...updatedContractData } }; updateClient(clientId, updatedClient); toast({ title: "Data Atualizada", description: `Dados do evento para ${client?.general?.companyName} atualizados.` }); } }; return ( <div className="p-4 sm:p-6 lg:p-8"> <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Calendário de Envio de Boletos</h2> <GlassPanel className="p-6"> <div className="flex justify-between items-center mb-4"> <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button> <h3 className="text-xl font-semibold text-gray-900 dark:text-white"> {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })} </h3> <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button> </div> <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400"> {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-2">{day}</div>)} </div> <div className="grid grid-cols-7 gap-1"> {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-transparent"></div>)} {daysInMonth.map(day => ( <div key={day} className="border border-gray-200 dark:border-white/10 p-2 h-24 flex flex-col cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => events[day] && setSelectedDay(day)}> <span className="font-bold">{day}</span> {events[day] && ( <div className="mt-1 flex-grow overflow-y-auto"> {events[day].slice(0, 2).map(event => ( <div key={event.id} className="text-xs bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 rounded px-1 truncate">{event?.general?.companyName}</div> ))} {events[day].length > 2 && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{events[day].length - 2} mais</div>} </div> )} </div> ))} </div> </GlassPanel> <Modal isOpen={selectedDay !== null} onClose={() => setSelectedDay(null)} title={`Envios para o dia ${selectedDay}`}> <div className="space-y-4 max-h-[60vh] overflow-y-auto"> {selectedDay && events[selectedDay]?.map(client => ( <CalendarEventDetail key={client.id} client={client} onUpdate={handleUpdateClientFromCalendar} /> ))} </div> </Modal> </div> ); };
const CalendarEventDetail = ({ client, onUpdate }) => { const { user } = useAuth(); const [isEditing, setIsEditing] = useState(false); const [editedData, setEditedData] = useState({ boletoSentDate: client?.contract?.boletoSentDate || '', calendarNotes: client?.contract?.calendarNotes || '' }); useEffect(() => { setEditedData({ boletoSentDate: client?.contract?.boletoSentDate || '', calendarNotes: client?.contract?.calendarNotes || '' }); }, [client]); const handleChange = (e) => { setEditedData(prev => ({...prev, [e.target.name]: e.target.value})); }; const handleSave = () => { onUpdate(client.id, editedData); setIsEditing(false); }; const broker = user; const titular = client?.beneficiaries?.find(b => b.kinship === 'Titular') || { name: client?.general?.holderName, dob: null }; const age = calculateAge(titular?.dob); return ( <GlassPanel className="p-4"> <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{client?.general?.companyName}</h4> <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm"> {isEditing ? ( <> <div><Label>Envio do Boleto</Label><Input type="date" name="boletoSentDate" value={editedData.boletoSentDate} onChange={handleChange} /></div> <DetailItem label="Venc. Boleto" value={`Dia ${client?.contract?.monthlyDueDate}`} /> <div className="col-span-2"><Label>Anotações</Label><Textarea name="calendarNotes" value={editedData.calendarNotes} onChange={handleChange} rows={3} /></div> </> ) : ( <> <DetailItem label="Envio do Boleto" value={client?.contract?.boletoSentDate} /> <DetailItem label="Venc. Boleto" value={`Dia ${client?.contract?.monthlyDueDate}`} /> <div className="col-span-2"><DetailItem label="Anotações" value={client?.contract?.calendarNotes} /></div> </> )} </div> <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4 grid grid-cols-2 gap-x-4 text-sm"> <DetailItem label="Corretor" value={broker?.name} /> <DetailItem label="Valor do Contrato" value={client?.contract?.contractValue ? `R$ ${client.contract.contractValue}` : 'N/A'} /> <DetailItem label="Plano Fechado" value={client?.contract?.planOperator} /> <DetailItem label="Vigência" value={client?.contract?.effectiveDate} /> <DetailItem label="Nº Contrato" value={client?.contract?.policyNumber} /> <DetailItem label="CPF Titular" value={client?.general?.holderCpf} /> <DetailItem label="Beneficiário Titular" value={titular?.name} /> <DetailItem label="Idade" value={age} /> </div> <div className="flex justify-end mt-4"> {isEditing ? ( <div className="flex gap-2"> <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button> <Button onClick={handleSave}>Guardar Alterações</Button> </div> ) : ( <Button variant="outline" onClick={() => setIsEditing(true)}><PencilIcon className="h-4 w-4 mr-2" /> Editar</Button> )} </div> </GlassPanel> ); };
function Dashboard() { const [page, setPage] = useState('home'); const [selectedItemId, setSelectedItemId] = useState(null); const [isSidebarOpen, setSidebarOpen] = useState(false); const { getClientById, clients, users } = useData(); const [itemDetails, setItemDetails] = useState(null); useEffect(() => { if(page === 'client-details' && selectedItemId) { setItemDetails(clients.find(c => c.id === selectedItemId)); } else if (page === 'user-details' && selectedItemId) { setItemDetails(users.find(u => u.id === selectedItemId)); } else { setItemDetails(null); } }, [selectedItemId, page, clients, users]); const handleNavigate = (targetPage) => { setPage(targetPage); setSelectedItemId(null); setSidebarOpen(false); }; const handleClientSelect = (clientId) => { setSelectedItemId(clientId); setPage('client-details'); }; const handleUserSelect = (userId) => { setSelectedItemId(userId); setPage('user-details'); }; const handleSaveClient = (savedClient) => { if (savedClient) { setItemDetails(savedClient); setSelectedItemId(savedClient.id); setPage('client-details'); } else { setPage('clients'); } }; const renderContent = () => { switch (page) { case 'clients': return <ClientsList onClientSelect={handleClientSelect} onAddClient={() => handleNavigate('add-client')} />; case 'client-details': return <ClientDetails client={itemDetails} onBack={() => handleNavigate('clients')} onEdit={() => setPage('edit-client')} />; case 'add-client': return <ClientForm onSave={handleSaveClient} onCancel={() => handleNavigate('clients')} />; case 'edit-client': return <ClientForm client={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('client-details')} />; case 'corporate': return <CorporatePage onUserSelect={handleUserSelect} />; case 'profile': return <ProfilePage />; case 'calendar': return <CalendarPage />; default: return <DashboardHome />; } }; return ( <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 font-sans"> <style>{` input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px #e5e7eb inset !important; -webkit-text-fill-color: #111827 !important; } .dark input:-webkit-autofill, .dark input:-webkit-autofill:hover, .dark input:-webkit-autofill:focus, .dark input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px #1f2937 inset !important; -webkit-text-fill-color: #e5e7eb !important; } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #e5e7eb; } .dark ::-webkit-scrollbar-track { background: #1f2937; } ::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; } .dark ::-webkit-scrollbar-thumb { background: #06B6D4; } ::-webkit-scrollbar-thumb:hover { background: #6b7280; } .dark ::-webkit-scrollbar-thumb:hover { background: #0891b2; } `}</style> <Sidebar onNavigate={handleNavigate} currentPage={page} isSidebarOpen={isSidebarOpen} /> <div className="lg:pl-64 transition-all duration-300"> <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} /> <main className="relative">{renderContent()}</main> </div> {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>} </div> ); }
function Sidebar({ onNavigate, currentPage, isSidebarOpen }) { const { logout } = useAuth(); const navItems = [ { id: 'home', label: 'Dashboard', icon: HomeIcon }, { id: 'clients', label: 'Clientes', icon: UsersIcon }, { id: 'calendar', label: 'Calendário', icon: CalendarIcon }, { id: 'corporate', label: 'Corporativo', icon: BuildingIcon }, { id: 'profile', label: 'Meu Perfil', icon: UserCircleIcon }, ]; return ( <aside className={cn("fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}> <GlassPanel className="h-full flex flex-col"> <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-white/10"><h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">OLYMPUS</h2></div> <nav className="flex-grow mt-6 px-4 space-y-2">{navItems.map(item => (<button key={item.id} onClick={() => onNavigate(item.id)} className={cn("w-full flex items-center p-3 rounded-lg transition-all duration-300", currentPage.startsWith(item.id) ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white")}><item.icon className="h-5 w-5 mr-3" /><span>{item.label}</span></button>))}</nav> <div className="p-4 border-t border-gray-200 dark:border-white/10"><button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"><LogOutIcon className="h-5 w-5 mr-3" /><span>Terminar Sessão</span></button></div> </GlassPanel> </aside> ); }
function Header({ onToggleSidebar }) { const { user } = useAuth(); const { theme, toggleTheme } = useTheme(); return ( <header className="sticky top-0 z-30 h-20"> <GlassPanel className="flex items-center justify-between h-full px-6"> <button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button> <div className="hidden lg:block"></div> <div className="flex items-center gap-2"> <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alterar Tema"> {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />} </Button> <Button variant="ghost" size="icon"><BellIcon className="h-6 w-6" /></Button> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-full bg-cyan-500/80 dark:bg-cyan-500/50 flex items-center justify-center font-bold text-white dark:text-cyan-300 border border-cyan-500/50">{user?.name?.[0]}</div> <div className="text-right hidden sm:block"><p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{user?.permissionLevel}</p></div> </div> </div> </GlassPanel> </header> ); }
const Toaster = () => { const { toasts } = useToast(); return createPortal( <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3"> {toasts.map(({ id, title, description, variant }) => ( <GlassPanel key={id} className={cn("p-4 border-l-4", variant === 'destructive' ? 'border-red-500' : 'border-cyan-500')}> <p className="font-semibold text-gray-900 dark:text-white">{title}</p> <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p> </GlassPanel> ))} </div>, document.body ); };

function ProfilePage() {
    const { user, updateUserProfile, updateUserPassword } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user && user.name !== 'Usuário sem dados') {
            setName(user.name);
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const success = await updateUserProfile(user.uid, { name });
        if (success) {
            toast({ title: "Sucesso", description: "Seu nome foi atualizado." });
        } else {
            toast({ title: "Erro", description: "Não foi possível atualizar o nome.", variant: 'destructive' });
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!currentPassword) {
            toast({ title: "Erro", description: "Por favor, insira sua senha atual.", variant: 'destructive' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Erro", description: "As senhas não coincidem.", variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: 'destructive' });
            return;
        }
        const result = await updateUserPassword(currentPassword, newPassword);
        if (result === true) {
            toast({ title: "Sucesso", description: "Sua senha foi atualizada." });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            let errorMessage = "Não foi possível atualizar a senha.";
            if (result === 'auth/wrong-password') {
                errorMessage = "A senha atual está incorreta.";
            } else if (result === 'auth/requires-recent-login') {
                errorMessage = "Esta operação é sensível e requer autenticação recente. Por favor, faça logout e login novamente antes de tentar alterar a senha.";
            }
            toast({ title: "Erro", description: errorMessage, variant: 'destructive' });
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassPanel className="p-6">
                    <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400/80 mb-6">Informações Pessoais</h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <Label>Foto de Perfil</Label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                                    {user?.name?.[0]}
                                </div>
                                <Button type="button" variant="outline">Alterar Foto</Button>
                            </div>
                        </div>
                        <div><Label>Nome Completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
                        <div className="flex justify-end"><Button type="submit">Salvar Alterações</Button></div>
                    </form>
                </GlassPanel>
                <GlassPanel className="p-6">
                     <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400/80 mb-6">Alterar Senha</h3>
                     <form onSubmit={handlePasswordUpdate} className="space-y-4">
                         <div><Label>Senha Atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                         <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                         <div><Label>Confirmar Nova Senha</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                         <div className="flex justify-end"><Button type="submit">Alterar Senha</Button></div>
                     </form>
                </GlassPanel>
            </div>
        </div>
    );
}

function Main() { const { user, loading } = useAuth(); if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-cyan-500 dark:text-cyan-400">A iniciar sistema Olympus...</div>; return user ? <Dashboard /> : <LoginPage />; }
function App() { return ( <ThemeProvider> <NotificationProvider> <AuthProvider> <DataProvider> <Main /> </DataProvider> </AuthProvider> </NotificationProvider> </ThemeProvider> ); }

export default App;