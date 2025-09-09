import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../utils';

// Ícones (verifique se os caminhos estão corretos)
import {
    HomeIcon, TargetIcon, UsersIcon, PercentIcon, TrendingUpIcon,
    CheckSquareIcon, CalendarIcon, HistoryIcon, BuildingIcon,
    UserCircleIcon, LogOutIcon
} from '../Icons';

// [CORRIGIDO] Rotas atualizadas para português
const navItems = [
    { to: '/painel-de-controle', label: 'Painel de Controle', icon: HomeIcon },
    { to: '/leads', label: 'Leads', icon: TargetIcon },
    { to: '/clientes', label: 'Clientes', icon: UsersIcon },
    { to: '/comissoes', label: 'Comissões', icon: PercentIcon },
    { to: '/producao', label: 'Produção', icon: TrendingUpIcon },
    { to: '/tarefas', label: 'Minhas Tarefas', icon: CheckSquareIcon },
    { to: '/calendario', label: 'Calendário', icon: CalendarIcon },
    { to: '/linha-do-tempo', label: 'Time-Line', icon: HistoryIcon },
    { to: '/corporativo', label: 'Corporativo', icon: BuildingIcon }
];

// --- Subcomponente para cada Item de Navegação ---
const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to}>
        {({ isActive }) => (
            <motion.div
                className="relative w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200"
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
                {/* [MOTION] O indicador violeta que desliza */}
                {isActive && (
                    <motion.div
                        layoutId="active-sidebar-indicator"
                        className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                )}
                
                <div className={cn(
                    "relative flex items-center",
                    isActive 
                        ? "text-violet-600 dark:text-violet-300"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                )}>
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{label}</span>
                </div>
            </motion.div>
        )}
    </NavLink>
);

// --- Componente Principal da Sidebar ---
export const Sidebar = ({ isSidebarOpen }) => {
    const { logout } = useAuth();
    const { companyProfile } = useData();

    return (
        <aside className={cn(
            "fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", 
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="h-full flex flex-col bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center h-20 flex-shrink-0 px-4">
                    {companyProfile?.logoUrl && (
                        <img    
                            src={companyProfile.logoUrl}    
                            alt="Logo da Empresa"    
                            className="h-8 w-auto mr-3 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    )}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wider">OLYMPUS X</h2>
                </div>
                
                <nav className="flex-grow mt-6 px-4 space-y-1">
                    {navItems.map(item => <NavItem key={item.to} {...item} />)}
                </nav>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto flex-shrink-0">
                    <NavItem to="/perfil" icon={UserCircleIcon} label="Meu Perfil" />
                    
                    <motion.button 
                        onClick={logout} 
                        className="w-full flex items-center p-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 mt-1 font-semibold"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        <LogOutIcon className="h-5 w-5 mr-3" />
                        <span>Sair</span>
                    </motion.button>
                </div>
            </div>
        </aside>
    );
}

