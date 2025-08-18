import React, { useState, useEffect, useMemo } from 'react';

// Providers de Contexto
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useToast } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';

// Páginas Principais
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

// Componentes de Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header'; // Importação Nomeada

// Utilitários
import { cn } from './utils';

// Componente de Carregamento Inicial
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

// Componente Principal da Aplicação
function MainApp() {
    const [page, setPage] = useState('dashboard');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [pageOptions, setPageOptions] = useState({});
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const data = useData();
    const { toast } = useToast();
    const { preferences } = usePreferences();
    const [itemDetails, setItemDetails] = useState(null);

    const handleNavigate = (targetPage, itemId = null, options = {}) => {
        setPage(targetPage);
        setSelectedItemId(itemId);
        setPageOptions(options);
        setSidebarOpen(false);
    };

    useEffect(() => {
        if (selectedItemId) {
            let item = null;
            if (page === 'client-details' || page === 'edit-client') {
                item = (data.clients || []).find(c => c.id === selectedItemId);
            } else if (page === 'convert-lead') {
                item = (data.leads || []).find(l => l.id === selectedItemId);
            }
            setItemDetails(item);
        } else {
            setItemDetails(null);
        }
    }, [selectedItemId, page, data.clients, data.leads]);
    
    const handleSaveClient = async (savedClient, sourceLeadId = null) => {
        if (sourceLeadId) {
            const lead = (data.leads || []).find(l => l.id === sourceLeadId);
            if (lead) {
                await data.deleteLead(sourceLeadId, lead.name);
                toast({ title: "Lead Convertido!", description: `${lead.name} agora é um cliente.` });
            }
        }
        handleNavigate('client-details', savedClient.id);
        toast({ title: "Sucesso", description: `Cliente ${savedClient.general.holderName || savedClient.general.companyName} salvo.` });
    };

    const renderContent = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage onNavigate={handleNavigate} />;
            case 'leads': return <LeadsPage onNavigate={handleNavigate} />;
            case 'clients': return <ClientsListPage onClientSelect={(id) => handleNavigate('client-details', id)} onAddClient={() => handleNavigate('add-client')} onNavigate={handleNavigate} />;
            case 'client-details': return <ClientDetailsPage client={itemDetails} onBack={() => handleNavigate('clients')} onEdit={(client, options) => handleNavigate('edit-client', client.id, options)} />;
            case 'add-client': return <ClientFormPage onSave={handleSaveClient} onCancel={() => handleNavigate('clients')} />;
            case 'edit-client': return <ClientFormPage client={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('client-details', itemDetails.id)} initialTab={pageOptions.initialTab} />;
            case 'convert-lead': return <ClientFormPage isConversion={true} leadData={itemDetails} onSave={(client, leadId) => handleSaveClient(client, leadId)} onCancel={() => handleNavigate('leads')} />;
            case 'import-clients': return <ImportClientsPage onBack={() => handleNavigate('clients')} />;
            case 'commissions': return <CommissionsPage />;
            case 'production': return <ProductionPage onNavigate={handleNavigate}/>;
            case 'tasks': return <TasksPage />;
            case 'calendar': return <CalendarPage onNavigate={handleNavigate} />;
            case 'timeline': return <TimelinePage />;
            case 'corporate': return <GestaoCorporativaPage />;
            case 'profile': return <ProfilePage />;
            default: return <DashboardPage onNavigate={handleNavigate} />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans">
            <Sidebar onNavigate={handleNavigate} currentPage={page} isSidebarOpen={isSidebarOpen} />
            <div className="lg:pl-64 transition-all duration-300">
                <Header 
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
                    onOpenCommandPalette={() => { /* Lógica do Cortex aqui */ }}
                    onNavigate={handleNavigate}
                />
                <main className={cn("relative", preferences.uppercaseMode && "uppercase")}>{renderContent()}</main>
            </div>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
        </div>
    );
}

// Componente Raiz que envolve a aplicação com todos os providers
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
