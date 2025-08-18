// src/components/layout/Header.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, onSnapshot, query, where, orderBy, writeBatch, doc, updateDoc } from "firebase/firestore";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Button from '../Button';
import { Avatar } from '../Avatar';
import { SparklesIcon, SunIcon, MoonIcon, BellIcon } from '../Icons';
import NotificationPopover from '../NotificationPopover';

export const Header = ({ onToggleSidebar, onOpenCommandPalette, onNavigate }) => { 
    const { user } = useAuth(); 
    const { theme, toggleTheme } = useTheme(); 
    const { clients } = useData(); 
    const db = getFirestore();

    const [notifications, setNotifications] = useState([]);
    const [isPopoverOpen, setPopoverOpen] = useState(false);

    // Efeito para "ouvir" novas notificações em tempo real
    useEffect(() => {
        if (!user?.uid || !db) return;

        const notifQuery = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
            const userNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(userNotifications);
        });

        return () => unsubscribe(); // Limpa o "ouvinte" quando o componente desmonta
    }, [user, db]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const handleNotificationClick = (notification) => {
        if (notification.page) {
            onNavigate(notification.page, notification.itemId);
        }
        setPopoverOpen(false);

        // Marca a notificação específica como lida no banco de dados
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

    const expiringContracts = useMemo(() => { /* ... (lógica original) ... */ }, [clients]); 

    return (
        <>
            <header className="sticky top-0 z-30 h-20">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 dark:from-[#0D1117]/80 to-transparent pointer-events-none"></div>
                <div className="relative flex items-center justify-between h-full px-6">
                    <button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="hidden lg:block">
                        <Button variant="ghost" onClick={onOpenCommandPalette} className="text-gray-500 dark:text-gray-400">
                            <SparklesIcon className="h-5 w-5 mr-2 text-violet-500"/> Assistente Córtex...
                            <span className="ml-4 text-xs border border-gray-400 dark:border-gray-600 rounded-md px-1.5 py-0.5">Ctrl K</span>
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alterar Tema">
                            {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}
                        </Button>
                        <div className="relative">
                            <Button variant="ghost" size="icon" onClick={() => setPopoverOpen(prev => !prev)}>
                                <BellIcon className="h-6 w-6" />
                            </Button>
                            {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-[10px] ring-2 ring-white dark:ring-[#0D1117]">{unreadCount}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            <Avatar src={user?.avatar} fallbackText={user?.name?.[0] || '?'} alt={user?.name} />
                            <div className="text-right hidden sm:block">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role?.name || user?.role || 'Corretor'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <NotificationPopover 
                isOpen={isPopoverOpen}
                onClose={() => setPopoverOpen(false)}
                notifications={notifications}
                onNavigate={handleNotificationClick}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        </>
    ); 
}