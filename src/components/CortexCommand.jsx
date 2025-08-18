import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import Cortex from '../services/Cortex';
import { cn } from '../utils';
import GlassPanel from './GlassPanel';
import Button from './Button'; // Corrigido para import default
import Input from './Input';   // Corrigido para import default
import Label from './Label';   // Corrigido para import default
import Select from './Select'; // Corrigido para import default
import DateField from './DateField'; // Corrigido para import default
import { SparklesIcon, ZapIcon, CheckSquareIcon } from './Icons';

const PARSE_COMMAND_PROMPT_TEMPLATE = `
Você é a IA Córtex, um co-piloto de CRM proativo. Sua função é converter linguagem natural em um plano de ação JSON. Você deve ser extremamente bom em extrair entidades (datas, nomes, valores) do texto.
Ações possíveis: 'show_briefing', 'create_task', 'update_lead_status', 'add_note', 'search', 'clarify_task_details'.
Data de hoje para referência: {today}.
Contexto de Entidades:
- Usuários: {users}
- Clientes: {clients}
- Leads: {leads}
REGRAS CRÍTICAS DE EXTRAÇÃO:
1.  **Extração de Tarefas:** Ao receber um comando para criar uma tarefa, extraia SEMPRE: 'title', 'dueDate' (converta 'amanhã', 'sexta-feira', 'daqui a 4 dias' etc. para o formato AAAA-MM-DD), 'description', e 'assignedToName' (encontre o NOME do usuário no contexto {users}). Se o nome do responsável for ambíguo, use a ação 'clarify_task_details'.
2.  **Ambiguidade:** Se um nome de usuário como "Daniela" for mencionado e houver mais de uma "Daniela" no contexto de usuários, sua ação DEVE ser 'clarify_task_details'. O payload deve conter todos os outros detalhes que você extraiu (título, prazo) e um array 'options' com os usuários ambíguos (ex: [{id: '123', name: 'Daniela Silva'}, {id: '456', name: 'Daniela Souza'}]).
3.  **Briefing:** Se o comando for "meu briefing", "prepare meu dia" ou similar, a ação é 'show_briefing'. O payload NÃO PRECISA DE DADOS.
4.  **Plano de Ação:** SEMPRE retorne um objeto JSON.
CRÍTICO: Sua resposta DEVE ser APENAS o objeto JSON, sem nenhuma palavra, explicação, desculpas ou formatação markdown como \`\`\`json antes ou depois.
Analise o seguinte comando e retorne APENAS o objeto JSON:
Comando: "{command}"
`;

// CORREÇÃO: Alterado de "export const" para uma constante
const CortexCommand = ({ isOpen, setIsOpen, onNavigate, onExecutePlan }) => {
    const { user } = useAuth();
    const { clients, leads, tasks, users, updateTask } = useData();
    const { toast } = useToast();
    const [view, setView] = useState('home');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [planToConfirm, setPlanToConfirm] = useState(null);
    const [clarification, setClarification] = useState(null);
    const inputRef = useRef(null);

    const dailyGoals = useMemo(() => {
        if (!tasks) return { total: 0, completed: 0, progress: 0 };
        const todayKey = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => t.dueDate === todayKey);
        const completedToday = todayTasks.filter(t => t.status === 'Concluída').length;
        return {
            total: todayTasks.length,
            completed: completedToday,
            progress: todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0,
        };
    }, [tasks]);

    const briefingData = useMemo(() => {
        if (!tasks || !leads) return { tasks: [], leads: [] };
        const todayKey = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(new Date().getDate() - 7);
        return {
            tasks: tasks.filter(t => t.dueDate === todayKey && t.status !== 'Concluída').slice(0, 3),
            leads: leads.filter(l => l.status !== 'Ganhos' && l.status !== 'Perdidos' && l.lastActivityDate?.toDate() < sevenDaysAgo).slice(0, 2),
        };
    }, [tasks, leads]);

    const handleReset = useCallback(() => {
        setView('home');
        setSearchTerm('');
        setConversation([]);
        setPlanToConfirm(null);
        setClarification(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const handleCommandSubmit = async (commandText) => {
        if (!commandText.trim()) return;
        if (commandText.toLowerCase().includes('briefing')) {
            setView('briefing');
            setSearchTerm('');
            return;
        }
        setIsLoading(true);
        setConversation([{ type: 'user', text: commandText }]);
        setView('conversation');
        setSearchTerm('');
        const today = new Date();
        const clientNames = clients ? clients.map(c => ({ id: c.id, name: c.general.companyName || c.general.holderName })) : [];
        const leadNames = leads ? leads.map(l => ({ id: l.id, name: l.name })) : [];
        const userNames = users ? users.map(u => ({ id: u.id, name: u.name })) : [];
        
        let finalPrompt = PARSE_COMMAND_PROMPT_TEMPLATE
            .replace('{today}', today.toISOString().split('T')[0])
            .replace('{users}', JSON.stringify(userNames))
            .replace('{clients}', JSON.stringify(clientNames))
            .replace('{leads}', JSON.stringify(leadNames))
            .replace('{command}', commandText);
        
        const response = await Cortex.parseCommand(finalPrompt);
        
        if (response.plan) {
            const planAction = response.plan[0];
            if (!planAction) {
                setConversation(prev => [...prev, { type: 'ai', error: true, text: "A IA retornou um plano de ação vazio." }]);
            } else if (planAction.action === 'clarify_task_details') {
                setClarification(planAction.payload);
            } else {
                setPlanToConfirm(response.plan);
            }
        } else {
            setConversation(prev => [...prev, { type: 'ai', error: true, text: response.error || "Não entendi o comando. Tente de outra forma." }]);
        }
        setIsLoading(false);
    };

    const handleClarificationChoice = (chosenOption) => {
        const originalPayload = clarification;
        const newCommand = `criar tarefa ${originalPayload.title}, prazo ${originalPayload.dueDate}, responsável ${chosenOption.name}`;
        setClarification(null);
        handleCommandSubmit(newCommand);
    };

    const confirmExecution = () => {
        const plan = planToConfirm.map(step => {
            if (step.action === 'create_task' && step.payload.assignedToName) {
                const responsibleUser = users.find(u => u.name === step.payload.assignedToName);
                return { ...step, payload: { ...step.payload, assignedTo: responsibleUser?.id || '' } };
            }
            return step;
        });
        onExecutePlan(plan);
        setIsOpen(false);
    };

    useEffect(() => { if (isOpen) handleReset(); }, [isOpen, handleReset]);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, setIsOpen]);

    const GamificationHeader = () => (
        <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso Diário</p>
            <div className="flex items-center gap-3 mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${dailyGoals.progress}%` }}></div>
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-white">{dailyGoals.completed}/{dailyGoals.total}</span>
            </div>
        </div>
    );

    const BriefingView = () => (
        <div className="animate-fade-in space-y-4">
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Tarefas para Hoje</h4>
                {briefingData.tasks.length > 0 ? briefingData.tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-sm">{task.title}</span>
                        <Button size="sm" onClick={() => { updateTask(task.id, { ...task, status: 'Concluída' }); toast({ title: "Tarefa Concluída!" }); }}>Concluir</Button>
                    </div>
                )) : <p className="text-sm text-gray-500 p-2">Nenhuma tarefa pendente para hoje. 🎉</p>}
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Leads Precisando de Atenção</h4>
                {briefingData.leads.length > 0 ? briefingData.leads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-sm">{lead.name}</span>
                        <Button size="sm" onClick={() => onExecutePlan([{ action: 'create_task', payload: { title: `Follow-up com ${lead.name}`, linkedToName: lead.name, linkedToType: 'lead' } }])}>Criar Tarefa</Button>
                    </div>
                )) : <p className="text-sm text-gray-500 p-2">Todos os seus leads estão em dia!</p>}
            </div>
        </div>
    );

    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 animate-fade-in pt-24" onClick={() => setIsOpen(false)}>
            <GlassPanel className="w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-white/10">
                    <SparklesIcon className="h-6 w-6 text-violet-500 flex-shrink-0" />
                    <form onSubmit={(e) => { e.preventDefault(); handleCommandSubmit(searchTerm); }} className="w-full">
                        <input ref={inputRef} type="text" placeholder="Peça algo ou digite 'meu briefing'..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none" disabled={isLoading} />
                    </form>
                    {view !== 'home' && <Button variant="ghost" size="sm" onClick={handleReset}>Voltar</Button>}
                </div>

                <div className="p-4 max-h-[450px] overflow-y-auto">
                    {view === 'home' && (<div className="animate-fade-in"><GamificationHeader /><Button variant="outline" className="w-full" onClick={() => { setView('briefing'); }}><ZapIcon className="h-5 w-5 mr-2" />Ver meu Briefing Diário</Button></div>)}
                    {view === 'briefing' && <BriefingView />}
                    {view === 'conversation' && (
                        <div className="space-y-4">
                            {/* ... Lógica de conversação, confirmação e clarificação ... */}
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>,
        document.body
    );
};

export default CortexCommand;