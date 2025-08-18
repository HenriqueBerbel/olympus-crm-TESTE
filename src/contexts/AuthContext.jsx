import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from "firebase/auth";
import { doc, onSnapshot, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase/firebase.js';

// Cria o contexto de autenticação
const AuthContext = createContext();

/**
 * Provider que gerencia todo o estado de autenticação, dados do usuário e permissões.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listener principal que reage a logins e logouts do Firebase
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Se o usuário está logado, busca seus dados detalhados no Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                // onSnapshot ouve em tempo real. Se o cargo do usuário mudar, a app reflete na hora.
                const unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        let roleData = { name: 'Sem Cargo', permissions: {} }; // Cargo padrão

                        // **MELHORIA:** Busca os detalhes do cargo (role) associado ao usuário
                        if (userData.roleId) {
                            const roleDocRef = doc(db, 'roles', userData.roleId);
                            const roleDocSnap = await getDoc(roleDocRef);
                            if (roleDocSnap.exists()) {
                                roleData = roleDocSnap.data();
                            }
                        }
                        
                        // Monta o objeto de usuário final, combinando tudo
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...userData,      // name, avatar, etc.
                            role: roleData,   // Objeto completo do cargo com as permissões
                        });

                    } else {
                        // Caso raro: usuário existe na autenticação mas não no banco.
                        // Pode acontecer se a criação do documento falhar.
                        setUser({ 
                            uid: firebaseUser.uid, 
                            email: firebaseUser.email,
                            name: 'Usuário Incompleto',
                            role: { name: 'Desconhecido', permissions: {} }
                        });
                    }
                    setLoading(false);
                });

                return () => unsubscribeSnapshot(); // Limpa o listener do documento do usuário
            } else {
                // Usuário deslogado
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth(); // Limpa o listener de autenticação
    }, []);

    // --- Funções de Autenticação ---

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, code: error.code };
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const updateUserPassword = async (currentPassword, newPassword) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return 'auth/no-user';

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            return true;
        } catch (error) {
            return error.code;
        }
    };
    
    // --- Funções de Gerenciamento de Usuários (Firestore) ---

    const addUser = async (userData) => {
        try {
            // 1. Cria o usuário no serviço de Autenticação
            const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            
            // 2. Salva os dados adicionais no Firestore
            const { password, ...dataToSave } = userData; // Remove a senha antes de salvar no DB
            await setDoc(doc(db, "users", cred.user.uid), dataToSave);
            
            return { success: true };
        } catch (error) {
            return { success: false, code: error.code };
        }
    };

    const updateUserProfile = async (uid, data) => {
        try {
            const userDocRef = doc(db, "users", uid);
            await updateDoc(userDocRef, data);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            return false;
        }
    };

    const deleteUser = async (userId) => {
        // ATENÇÃO: A exclusão do usuário do Firebase Authentication por segurança
        // deve ser feita por uma Cloud Function no backend.
        // Este método deleta apenas os dados do Firestore.
        try {
            await deleteDoc(doc(db, "users", userId));
            return true;
        } catch (error) {
            console.error("Erro ao deletar documento do usuário:", error);
            return false;
        }
    };

    // Objeto de valor exposto pelo Contexto
    const value = { 
        user, 
        loading, 
        login, 
        logout, 
        addUser, 
        deleteUser, 
        updateUserProfile, 
        updateUserPassword 
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

/**
 * Hook customizado para acessar facilmente o contexto de autenticação.
 */
export const useAuth = () => useContext(AuthContext);