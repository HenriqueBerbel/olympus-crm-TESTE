// src/components/NotificationPopover.jsx

import React from 'react';
import GlassPanel from './GlassPanel';
import Button from './Button';
import { BellIcon, CheckCheckIcon } from './Icons';
import { formatDateTime } from '../utils';
import { cn } from '../utils';

const NotificationPopover = ({ isOpen, onClose, notifications = [], onNavigate, onMarkAllAsRead }) => {
    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        // Div invisível para capturar o clique fora e fechar o popover
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <GlassPanel className="absolute top-20 right-6 w-full max-w-md shadow-2xl z-50" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                            <CheckCheckIcon className="h-4 w-4 mr-2" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div 
                                key={notif.id} 
                                className={cn(
                                    "p-4 border-b border-gray-200/50 dark:border-white/5 cursor-pointer hover:bg-cyan-500/10",
                                    !notif.isRead && 'bg-blue-50 dark:bg-blue-900/20'
                                )}
                                onClick={() => onNavigate(notif)}
                            >
                                <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDateTime(notif.createdAt)}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            <BellIcon className="h-10 w-10 mx-auto mb-2" />
                            <p>Nenhuma notificação por aqui.</p>
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

export default NotificationPopover;