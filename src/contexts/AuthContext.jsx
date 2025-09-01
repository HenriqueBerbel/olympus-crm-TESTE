import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth, functions } from '../firebase/firebase.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // [MELHORIA] Gerenciamento mais robusto dos listeners para evitar memory leaks.
        let unsubscribeUserSnapshot = () => {};
        let unsubscribeRoleSnapshot = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Limpa listeners antigos sempre que o estado de autenticação muda
            unsubscribeUserSnapshot();
            unsubscribeRoleSnapshot();

            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                unsubscribeUserSnapshot = onSnapshot(userDocRef, (userDoc) => {
                    // Limpa o listener de 'role' antigo antes de criar um novo
                    unsubscribeRoleSnapshot();

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Garante que existe um roleId antes de tentar buscar
                        if (userData.roleId) {
                            const roleDocRef = doc(db, 'roles', userData.roleId);
                            unsubscribeRoleSnapshot = onSnapshot(roleDocRef, (roleDoc) => {
                                const roleData = roleDoc.exists() ? { id: roleDoc.id, ...roleDoc.data() } : { name: 'Sem Cargo', permissions: {} };
                                setUser({
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    ...userData,
                                    role: roleData,
                                });
                                setLoading(false);
                            });
                        } else {
                             // Caso o usuário não tenha um roleId definido
                             setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                ...userData,
                                role: { name: 'Sem Cargo', permissions: {} },
                            });
                            setLoading(false);
                        }
                    } else {
                        // Caso o documento do usuário não exista no Firestore
                        setUser({ 
                            uid: firebaseUser.uid, 
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || 'Usuário Incompleto',
                            role: { name: 'Desconhecido', permissions: {} }
                        });
                        setLoading(false);
                    }
                }, (error) => {
                    console.error("Erro no listener do documento do usuário:", error);
                    setUser(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Função de limpeza final que é chamada quando o componente é desmontado
        return () => {
            unsubscribeAuth();
            unsubscribeUserSnapshot();
            unsubscribeRoleSnapshot();
        };
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, code: error.code };
        }
    };

    const logout = async () => await signOut(auth);
    
    const updateUserProfile = async (uid, data) => {
        try {
            const userDocRef = doc(db, "users", uid);
            await updateDoc(userDocRef, data);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar perfil do usuário:", error);
            return false;
        }
    };

    const createUser = async (userData) => {
        try {
            const createUserFunc = httpsCallable(functions, 'createUser');
            const result = await createUserFunc(userData);
            return { success: true, data: result.data };
        } catch (error) {
            return { success: false, code: error.code, message: error.message };
        }
    };

    const deleteUser = async (userId) => {
        try {
            const deleteUserFunc = httpsCallable(functions, 'deleteUser');
            await deleteUserFunc({ uid: userId });
            return true;
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            return false;
        }
    };

    const value = { 
        user, 
        loading, 
        login, 
        logout, 
        createUser,
        deleteUser,
        updateUserProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);