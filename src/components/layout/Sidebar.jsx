import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../utils';

// Ícones
import {
    HomeIcon, TargetIcon, UsersIcon, PercentIcon, TrendingUpIcon,
    CheckSquareIcon, CalendarIcon, HistoryIcon, BuildingIcon,
    UserCircleIcon, LogOutIcon
} from '../Icons';

// Lista de itens de navegação com seus links (rotas)
const navItems = [
    { to: '/dashboard', label: 'Painel de Controle', icon: HomeIcon },
    { to: '/leads', label: 'Leads', icon: TargetIcon },
    { to: '/clients', label: 'Clientes', icon: UsersIcon },
    { to: '/commissions', label: 'Comissões', icon: PercentIcon },
    { to: '/production', label: 'Produção', icon: TrendingUpIcon },
    { to: '/tasks', label: 'Minhas Tarefas', icon: CheckSquareIcon },
    { to: '/calendar', label: 'Calendário', icon: CalendarIcon },
    { to: '/timeline', label: 'Time-Line', icon: HistoryIcon },
    { to: '/corporate', label: 'Corporativo', icon: BuildingIcon }
];

// Função que define as classes CSS para o link ativo e inativo
const getLinkClass = ({ isActive }) => cn(
    "w-full flex items-center p-3 rounded-lg transition-all duration-300 font-semibold",
    isActive
        ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
);

export const Sidebar = ({ isSidebarOpen }) => {
    const { logout } = useAuth();
    const { companyProfile } = useData();

    return (
        <aside className={cn("fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="h-full flex flex-col bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-center h-20 flex-shrink-0 px-4">
                    {companyProfile?.logoUrl && (
                        <img 
                            src={companyProfile.logoUrl} 
                            alt="Logo da Empresa" 
                            className="h-8 w-auto mr-3 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">OLYMPUS X</h2>
                </div>
                <nav className="flex-grow mt-6 px-4 space-y-2">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={getLinkClass}
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto flex-shrink-0">
                    <NavLink to="/profile" className={getLinkClass}>
                        <UserCircleIcon className="h-5 w-5 mr-3" />
                        <span>Meu Perfil</span>
                    </NavLink>
                    <button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 mt-2">
                        <LogOutIcon className="h-5 w-5 mr-3" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
