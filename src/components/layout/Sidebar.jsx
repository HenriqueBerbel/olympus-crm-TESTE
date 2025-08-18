// src/components/layout/Sidebar.jsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';

// Ícones
import {
    HomeIcon, TargetIcon, UsersIcon, PercentIcon, TrendingUpIcon,
    CheckSquareIcon, CalendarIcon, HistoryIcon, BuildingIcon,
    UserCircleIcon, LogOutIcon
} from '../Icons';

export const Sidebar = ({ onNavigate, currentPage, isSidebarOpen }) => {
    const { logout } = useAuth();
    const navItems = [
        { id: 'dashboard', label: 'Painel de Controle', icon: HomeIcon },
        { id: 'leads', label: 'Leads', icon: TargetIcon },
        { id: 'clients', label: 'Clientes', icon: UsersIcon },
        { id: 'commissions', label: 'Comissões', icon: PercentIcon },
        { id: 'production', label: 'Produção', icon: TrendingUpIcon },
        { id: 'tasks', label: 'Minhas Tarefas', icon: CheckSquareIcon },
        { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
        { id: 'timeline', label: 'Time-Line', icon: HistoryIcon },
        { id: 'corporate', label: 'Corporativo', icon: BuildingIcon }
    ];

    return (
        <aside className={cn("fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="h-full flex flex-col bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center h-20 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">OLYMPUS X</h2>
                </div>
                <nav className="flex-grow mt-6 px-4 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                                "w-full flex items-center p-3 rounded-lg transition-all duration-300 font-semibold",
                                currentPage.startsWith(item.id)
                                    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto flex-shrink-0">
                    <button onClick={() => onNavigate('profile')} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white mb-2">
                        <UserCircleIcon className="h-5 w-5 mr-3" />
                        <span>Meu Perfil</span>
                    </button>
                    <button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400">
                        <LogOutIcon className="h-5 w-5 mr-3" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}