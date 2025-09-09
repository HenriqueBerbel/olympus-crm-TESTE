import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// Providers e Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useToast } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';

// Layout e Componentes
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import ConfirmDialog from './components/ConfirmDialog';
import { cn } from './utils';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import ClientsListPage from './pages/ClientsListPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import ClientFormPage from './pages/ClientFormPage';
import CommissionsPage from './pages/CommissionsPage';
import ProductionPage from './pages/ProductionPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import TimelinePage from './pages/TimelinePage';
import GestaoCorporativaPage from './pages/GestaoCorporativaPage';
import ProfilePage from './pages/ProfilePage';
import ImportClientsPage from './pages/ImportClientsPage';


function ClientWrapper() {
    const { clienteId } = useParams();
    const { clients } = useData();
    const navigate = useNavigate();
    
    const client = clients?.find(c => c.id === clienteId);

    if (clients === undefined) return <div className="p-8 text-center">Carregando dados do cliente...</div>;
    if (!client) return <div className="p-8 text-center">Cliente não encontrado.</div>;

    return <ClientDetailsPage 
        client={client} 
        onBack={() => navigate('/clientes')}
    />;
}

function LeadConversionWrapper() {
    const { leadId } = useParams();
    const { leads, deleteLead } = useData();
    const navigate = useNavigate();
    const { toast } = useToast();
    const lead = leads?.find(l => l.id === leadId);

    const handleSaveConversion = async (savedClient, sourceLeadId) => {
        if (lead) {
            await deleteLead(sourceLeadId, lead.name);
            toast({ title: "Lead Convertido!", description: `${lead.name} agora é um cliente.`, variant: 'success' });
        }
        navigate(`/clientes/${savedClient.id}`);
    };

    if (leads === undefined) return <div className="p-8 text-center">Carregando dados do lead...</div>;
    if (!lead) return <div className="p-8 text-center">Lead não encontrado.</div>;

    return <ClientFormPage 
        isConversion={true} 
        leadData={lead} 
        onSaveSuccess={handleSaveConversion}
        onCancel={() => navigate('/leads')} 
    />;
}

function MainApp() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { preferences } = usePreferences();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans">
            <Sidebar isSidebarOpen={isSidebarOpen} />
            <div className="lg:pl-64 transition-all duration-300">
                <Header 
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
                    onOpenCommandPalette={() => {}}
                />
                <main className={cn("relative", preferences.uppercaseMode && "uppercase")}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/painel-de-controle" replace />} />
                        <Route path="/painel-de-controle" element={<DashboardPage />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/clientes" element={<ClientsListPage />} />
                        <Route path="/comissoes" element={<CommissionsPage />} />
                        <Route path="/producao" element={<ProductionPage />} />
                        <Route path="/tarefas" element={<TasksPage />} />
                        <Route path="/calendario" element={<CalendarPage />} />
                        <Route path="/linha-do-tempo" element={<TimelinePage />} />
                        <Route path="/corporativo" element={<GestaoCorporativaPage />} />
                        <Route path="/perfil" element={<ProfilePage />} />
                        <Route path="/clientes/importar" element={<ImportClientsPage onBack={() => navigate('/clientes')} />} />
                        <Route path="/clientes/novo" element={<ClientFormPage onCancel={() => navigate('/clientes')} />} />
                        <Route path="/clientes/:clienteId" element={<ClientWrapper />} />
                        <Route path="/leads/:leadId/converter" element={<LeadConversionWrapper />} />
                        <Route path="*" element={<div className="p-8 text-center"><h1>404</h1><p>Página não encontrada</p></div>} />
                    </Routes>
                </main>
            </div>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
            <ConfirmDialog />
        </div>
    );
}

function MainLoader() {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0D1117] text-cyan-500 dark:text-cyan-400">
                <h1 className="text-4xl font-bold mb-4 animate-pulse">OLYMPUS X</h1>
                <p>Inicializando Ecossistema...</p>
            </div>
        );
    }
    return user ? <MainApp /> : <LoginPage />;
}

function App() {
    return (
        <ThemeProvider>
            <NotificationProvider>
                <AuthProvider>
                    <DataProvider>
                        <ConfirmProvider>
                            <PreferencesProvider>
                                <MainLoader />
                            </PreferencesProvider>
                        </ConfirmProvider>
                    </DataProvider>
                </AuthProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}

export default App;

