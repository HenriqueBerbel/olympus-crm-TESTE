import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// Providers e Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useToast } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import ConfirmDialog from './components/ConfirmDialog';

// Page Components
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

// Componente "Wrapper" para buscar o cliente correto com base na URL
// e passar para as páginas de Detalhes e Edição.
function ClientWrapper({ mode }) {
    const { clientId } = useParams(); // Pega o ID da URL (ex: /clients/XYZ)
    const { clients } = useData();
    const navigate = useNavigate();
    
    // Encontra o cliente na lista de dados globais
    const client = clients?.find(c => c.id === clientId);

    // Lida com casos onde os dados ainda não carregaram ou o cliente não foi encontrado
    if (clients === undefined) return <div className="p-8 text-center">Carregando dados do cliente...</div>;
    if (!client) return <div className="p-8 text-center">Cliente não encontrado.</div>;

    // Renderiza a página correta (Detalhes ou Edição) com os dados do cliente
    if (mode === 'details') {
        return <ClientDetailsPage 
            client={client} 
            onEdit={() => navigate(`/clients/${clientId}/edit`)} 
            onBack={() => navigate('/clients')} 
        />;
    }
    if (mode === 'edit') {
        return <ClientFormPage 
            client={client} 
            onSave={() => navigate(`/clients/${clientId}`)} 
            onCancel={() => navigate(`/clients/${clientId}`)} 
        />;
    }
    return null;
}

// Wrapper para lidar com a conversão de Lead para Cliente
function LeadConversionWrapper() {
    const { leadId } = useParams();
    const { leads, deleteLead } = useData();
    const navigate = useNavigate();
    const { toast } = useToast();
    const lead = leads?.find(l => l.id === leadId);

    // Função que é chamada após o formulário ser salvo
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
        onSave={handleSaveConversion} 
        onCancel={() => navigate('/leads')} 
    />;
}


function MainApp() {
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
                        {/* Rota Padrão: redireciona para o dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* Definição de cada página */}
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

                        {/* Rotas Especiais para Clientes e Leads */}
                        <Route path="/clients/new" element={<ClientFormPage />} />
                        <Route path="/clients/import" element={<ImportClientsPage />} />
                        <Route path="/clients/:clientId" element={<ClientWrapper mode="details" />} />
                        <Route path="/clients/:clientId/edit" element={<ClientWrapper mode="edit" />} />
                        <Route path="/leads/:leadId/convert" element={<LeadConversionWrapper />} />
                        
                        {/* Rota para quando o link não existe */}
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
