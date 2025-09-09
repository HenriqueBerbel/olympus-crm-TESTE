import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, onSnapshot, query, where, orderBy, writeBatch, doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Contexts
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Componentes
import Button from '../Button';
import { Avatar } from '../Avatar';
import { SparklesIcon, SunIcon, MoonIcon, BellIcon } from '../Icons';
import NotificationPopover from '../NotificationPopover';

// --- Utilitário (interno para robustez) ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Header = ({ onToggleSidebar, onOpenCommandPalette }) => { 
    const { user } = useAuth(); 
    const { theme, toggleTheme } = useTheme(); 
    const db = getFirestore();

    // Lógica de notificações mantida aqui, como solicitado
    const [notifications, setNotifications] = useState([]);
    const [isPopoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        if (!user?.uid || !db) return;

        const notifQuery = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
            const userNotifications = snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
            setNotifications(userNotifications);
        });

        return () => unsubscribe();
    }, [user, db]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const handleNotificationClick = (notification) => {
        // A lógica de navegação pode ser adicionada aqui
        setPopoverOpen(false);
        if (!notification.isRead) {
            const notifRef = doc(db, 'notifications', notification.id);
            updateDoc(notifRef, { isRead: true });
        }
    };

    const handleMarkAllAsRead = () => {
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            if (!notif.isRead) {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.update(notifRef, { isRead: true });
            }
        });
        batch.commit().catch(err => console.error("Erro ao marcar notificações como lidas", err));
    };

    return (
        <>
            <header className="sticky top-0 z-30 h-20">
                {/* [UI] Gradiente de fundo unificado com o tema */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 dark:from-slate-950/80 to-transparent pointer-events-none"></div>
                
                <div className="relative flex items-center justify-between h-full px-6">
                    <button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    
                    <div className="hidden lg:block">
                        <Button variant="ghost" onClick={onOpenCommandPalette} className="text-slate-500 dark:text-slate-400">
                            <SparklesIcon className="h-5 w-5 mr-2 text-violet-500"/> Assistente Córtex...
                            <span className="ml-4 text-xs border border-slate-400 dark:border-slate-600 rounded-md px-1.5 py-0.5">Ctrl K</span>
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <motion.button 
                            onClick={toggleTheme} 
                            title="Alterar Tema" 
                            className="h-10 w-10 flex items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {/* [MOTION] Animação de troca de ícone de tema */}
                            <AnimatePresence mode="wait">
                                {theme === 'dark' ? (
                                    <motion.div key="sun" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <SunIcon className="h-6 w-6 text-yellow-400" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="moon" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <MoonIcon className="h-6 w-6 text-slate-600" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        
                        <div className="relative">
                            <Button variant="ghost" size="icon" onClick={() => setPopoverOpen(prev => !prev)}>
                                <BellIcon className="h-6 w-6" />
                            </Button>
                            {/* [MOTION & UX] Animação no contador de notificações */}
                            <AnimatePresence>
                                {unreadCount > 0 && (
                                    <motion.span 
                                        key={unreadCount}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-[10px] ring-2 ring-white dark:ring-slate-900"
                                    >
                                        {unreadCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Avatar src={user?.photoURL} fallbackText={user?.displayName?.[0] || '?'} alt={user?.displayName} />
                            <div className="text-right hidden sm:block">
                                {/* [UI] Cores de texto unificadas com o tema */}
                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{user?.displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role?.name || 'Corretor'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            <NotificationPopover 
                isOpen={isPopoverOpen}
                onClose={() => setPopoverOpen(false)}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        </>
    ); 
}
