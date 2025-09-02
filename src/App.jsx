import React, { useState } from 'react';
// [NOVO] Importe 'useLocation' para ler os dados passados na navegação
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';

// Providers e Contexts (Tudo igual)
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useToast } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';

// ... (Resto dos seus imports de Layout e Páginas permanecem iguais)
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import ConfirmDialog from './components/ConfirmDialog';
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
import { cn } from './utils';


function ClientWrapper({ mode }) {
    const { clientId } = useParams();
    const { clients } = useData();
    const navigate = useNavigate();
    
    // [NOVO] Hook para ler o estado da navegação
    const location = useLocation();
    
    const client = clients?.find(c => c.id === clientId);

    if (clients === undefined) return <div className="p-8 text-center">Carregando dados do cliente...</div>;
    if (!client && mode !== 'new') return <div className="p-8 text-center">Cliente não encontrado.</div>;

    if (mode === 'details') {
        return <ClientDetailsPage 
            client={client} 
            // [CORREÇÃO 1] Agora onEdit passa a initialTab para a próxima rota usando 'state'
            onEdit={(_client, options) => navigate(`/clients/${clientId}/edit`, { state: { initialTab: options?.initialTab } })} 
            onBack={() => navigate('/clients')} 
        />;
    }
    if (mode === 'edit') {
        return <ClientFormPage 
            client={client} 
            // [CORREÇÃO 2] O formulário agora controla o sucesso do salvamento. O Pai só oferece a opção de cancelar.
            onCancel={() => navigate(`/clients/${clientId}`)}
            // [CORREÇÃO 1] O formulário recebe a initialTab que veio pelo 'state' da navegação
            initialTab={location.state?.initialTab}
        />;
    }
    return null;
}

function LeadConversionWrapper() {
    // ... (Este componente permanece o mesmo)
    const { leadId } = useParams();
    const { leads, deleteLead } = useData();
    const navigate = useNavigate();
    const { toast } = useToast();
    const lead = leads?.find(l => l.id === leadId);

    const handleSaveConversion = async (savedClient, sourceLeadId) => {
        if (lead) {
            await deleteLead(sourceLeadId, lead.name);
            toast({ title: "Lead Convertido!", description: `${lead.name} agora é um cliente.` });
        }
        navigate(`/clients/${savedClient.id}`);
    };

    if (leads === undefined) return <div className="p-8 text-center">Carregando dados do lead...</div>;
    if (!lead) return <div className="p-8 text-center">Lead não encontrado.</div>;

    return <ClientFormPage 
        isConversion={true} 
        leadData={lead} 
        onSaveSuccess={handleSaveConversion} // Renomeado para clareza
        onCancel={() => navigate('/leads')} 
    />;
}


function MainApp() {
    // ... (Este componente permanece o mesmo)
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { preferences } = usePreferences();

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
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/clients" element={<ClientsListPage />} />
                        <Route path="/commissions" element={<CommissionsPage />} />
                        <Route path="/production" element={<ProductionPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/timeline" element={<TimelinePage />} />
                        <Route path="/corporate" element={<GestaoCorporativaPage />} />
                        <Route path="/profile" element={<ProfilePage />} />

                        {/* [NOVO] Adicionado onCancel para a página de importação */}
                        <Route path="/clients/import" element={<ImportClientsPage onBack={() => navigate('/clients')} />} />

                        {/* [ALTERAÇÃO] A rota /new agora também usa o ClientWrapper */}
                        <Route path="/clients/new" element={<ClientFormPage onCancel={() => navigate('/clients')} />} />
                        <Route path="/clients/:clientId" element={<ClientWrapper mode="details" />} />
                        <Route path="/clients/:clientId/edit" element={<ClientWrapper mode="edit" />} />
                        <Route path="/leads/:leadId/convert" element={<LeadConversionWrapper />} />
                        
                        <Route path="*" element={<div className="p-8 text-center"><h1>404</h1><p>Página não encontrada</p></div>} />
                    </Routes>
                </main>
            </div>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
            <ConfirmDialog />
        </div>
    );
}

// ... (MainLoader e App permanecem os mesmos)
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