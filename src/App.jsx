import React, { useState, createContext, useContext, useEffect, useRef, forwardRef, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser as deleteFirebaseAuthUser } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, orderBy, where, getDocs, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from './firebase.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


// --- ÍCONES E UTILITÁRIOS ---


const DownloadIcon = memo((props) => <IconWrapper {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></IconWrapper>);
const PaletteIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 1 0 10 10"></path><path d="M12 12a5 5 0 1 0 5 5"></path><path d="M12 12a5 5 0 1 1 5-5"></path></IconWrapper>);
const GripVerticalIcon = memo((props) => <IconWrapper {...props}><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></IconWrapper>);
const PercentIcon = memo((props) => <IconWrapper {...props}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></IconWrapper>);
const IconWrapper = memo((props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />);
const HomeIcon = memo((props) => <IconWrapper {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></IconWrapper>);
const UsersIcon = memo((props) => <IconWrapper {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconWrapper>);
const BuildingIcon = memo((props) => <IconWrapper {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="9" y2="9.01"></line><line x1="15" y1="9" x2="15" y2="9.01"></line><line x1="9" y1="15" x2="9" y2="15.01"></line><line x1="15" y1="15" x2="15" y2="15.01"></line></IconWrapper>);
const CalendarIcon = memo((props) => <IconWrapper {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></IconWrapper>);
const BellIcon = memo((props) => <IconWrapper {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></IconWrapper>);
const PlusCircleIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></IconWrapper>);
const SearchIcon = memo((props) => <IconWrapper {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></IconWrapper>);
const FilterIcon = memo((props) => <IconWrapper {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></IconWrapper>);
const UserCircleIcon = memo((props) => <IconWrapper {...props}><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></IconWrapper>);
const ChevronLeftIcon = memo((props) => <IconWrapper {...props}><polyline points="15 18 9 12 15 6" /></IconWrapper>);
const ChevronRightIcon = memo((props) => <IconWrapper {...props}><polyline points="9 18 15 12 9 6" /></IconWrapper>);
const ChevronDownIcon = memo((props) => <IconWrapper {...props}><polyline points="6 9 12 15 18 9" /></IconWrapper>);
const CopyIcon = memo((props) => <IconWrapper {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></IconWrapper>);
const EyeIcon = memo((props) => <IconWrapper {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></IconWrapper>);
const EyeOffIcon = memo((props) => <IconWrapper {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></IconWrapper>);
const Trash2Icon = memo((props) => <IconWrapper {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></IconWrapper>);
const PencilIcon = memo((props) => <IconWrapper {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></IconWrapper>);
const XIcon = memo((props) => <IconWrapper {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper>);
const LogOutIcon = memo((props) => <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></IconWrapper>);
const SunIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconWrapper>);
const MoonIcon = memo((props) => <IconWrapper {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></IconWrapper>);
const InfoIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></IconWrapper>);
const TargetIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></IconWrapper>);
const CheckSquareIcon = memo((props) => <IconWrapper {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></IconWrapper>);
const ZapIcon = memo((props) => <IconWrapper {...props} className="text-violet-500 dark:text-violet-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconWrapper>);
const HistoryIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></IconWrapper>);
const CommandIcon = memo((props) => <IconWrapper {...props}><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></IconWrapper>);
const SparklesIcon = memo((props) => <IconWrapper {...props}><path d="M9.96 5.04a2.5 2.5 0 1 0-3.52 3.52" /><path d="M2.5 2.5 5 5" /><path d="M12 3a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1Z" /><path d="M21 12h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M3 12H1a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M12 21a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Z" /><path d="m18.54 5.46-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m6.87 17.13-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m18.54 18.54-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /><path d="m6.87 6.87-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /></IconWrapper>);
const FileTextIcon = memo((props) => <IconWrapper {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></IconWrapper>);
const ArchiveIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></IconWrapper>);
const AlertTriangleIcon = memo((props) => <IconWrapper {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></IconWrapper>);
const RefreshCwIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M3 12a9 9 0 0 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></IconWrapper>);
const TrendingUpIcon = memo((props) => <IconWrapper {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></IconWrapper>);
const DollarSignIcon = memo((props) => <IconWrapper {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></IconWrapper>);
const BarChart2Icon = memo((props) => <IconWrapper {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IconWrapper>);
const PieChartIcon = memo((props) => <IconWrapper {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></IconWrapper>);
const BriefcaseIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></IconWrapper>);
const AwardIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></IconWrapper>);
const ShieldCheckIcon = memo((props) => <IconWrapper {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></IconWrapper>);
const HeartPulseIcon = memo((props) => <IconWrapper {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12.91 1.05 15.09"/><path d="M7.5 12.5 9 14l1.5-1.5"/><path d="M12 11h.01"/><path d="M16.5 12.5 15 14l-1.5-1.5"/><path d="M20.78 12.91 22.95 15.09"/></IconWrapper>);
const ActivityIcon = memo((props) => <IconWrapper {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></IconWrapper>);

const cn = (...inputs) => inputs.flat().filter(Boolean).join(' ');
const calculateAge = (dob) => { // A data 'dob' deve estar no formato 'YYYY-MM-DD'
    if (!dob) return null;

    // 1. ANÁLISE ROBUSTA DA DATA
    // Dividimos a string 'YYYY-MM-DD' em partes para criar a data.
    // Isso evita que o navegador tente "adivinhar" o formato e erre.
    // O JS lida com meses de 0 (Jan) a 11 (Dez), por isso subtraímos 1 do mês.
    const parts = dob.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const day = parseInt(parts[2], 10);
    const birthDate = new Date(year, month, day);

    // 2. VERIFICAÇÃO DE VALIDADE
    // Se, por algum motivo, a data for inválida, retornamos nulo.
    if (isNaN(birthDate.getTime())) {
        return null;
    }

    // 3. CÁLCULO DA IDADE (LÓGICA ORIGINAL MANTIDA)
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const formatDate = (dateString) => dateString ? new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
const formatDateTime = (timestamp) => timestamp?.toDate ? timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
const formatCurrency = (value) => `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)}`;

// --- MÁSCARAS E VALIDAÇÕES ---
const mask = (value, pattern) => {
    let i = 0;
    const v = value.toString().replace(/\D/g, '');
    return pattern.replace(/#/g, () => v[i++] || '');
};
const maskCPF = (value) => mask(value, '###.###.###-##');
const maskCNPJ = (value) => mask(value, '##.###.###/####-##');
const maskCEP = (value) => mask(value, '#####-###');

const validateCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
};

const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

// --- SISTEMA DE LOGS DETALHADOS ---
const fieldNameMap = {
    status: 'Status',
    clientType: 'Tipo de Contrato',
    companyName: 'Nome da Empresa',
    cnpj: 'CNPJ',
    responsibleName: 'Nome do Responsável',
    responsibleCpf: 'CPF do Responsável',
    responsibleStatus: 'Responsável',
    holderCpf: 'Telefone Responsável',
    email: 'Email Responsável',
    phone: 'Nome do Contato',
    contactRole: 'Cargo do Contato',
    contactPhone: 'Telefone do Contato',
    name: 'Nome',
    company: 'Empresa',
    notes: 'Observações',
    title: 'Título da Tarefa',
    description: 'Descrição da Tarefa',
    dueDate: 'Prazo',
    priority: 'Prioridade',
};

const generateChangeDescription = (oldData, newData, nameMap) => {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach(key => {
        const oldValue = oldData[key];
        const newValue = newData[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
                const nestedChanges = generateChangeDescription(oldValue || {}, newValue, nameMap);
                changes.push(...nestedChanges);
            } else {
                const fieldName = nameMap[key] || key;
                changes.push(`alterou ${fieldName} de "${oldValue || 'vazio'}" para "${newValue || 'vazio'}"`);
            }
        }
    });
    return changes;
};

// --- CORTEX AI (GEMINI) ---
const GEMINI_API_KEY = "AIzaSyBblrqaeYhLpze4QqNlACEFJpC4ek-7z3Y";
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

Exemplos:
- "criar uma tarefa para o dia 28/07/2025 para ligar para o lead TechCorp, responsável sou eu mesmo"
  -> {"plan": [{"action": "create_task", "payload": {"title": "Ligar para o lead TechCorp", "dueDate": "2025-07-28", "assignedToName": "Henrique M. F. Berbel"}}]}
- "criar uma tarefa, prazo de 4 dias, gerenciar colaboradores, responsável pela tarefa Daniela"
  -> {"plan": [{"action": "create_task", "payload": {"title": "Gerenciar colaboradores", "dueDate": "{today_plus_4_days}", "assignedToName": "Daniela"}}]}
- "meu briefing diário"
  -> {"plan": [{"action": "show_briefing", "payload": {}}]}

Analise o seguinte comando e retorne APENAS o objeto JSON:
Comando: "{command}"
`;

// 🧠 CÉREBRO 2: BASE DE CONHECIMENTO DO SISTEMA
const SYSTEM_KNOWLEDGE_BASE = `
## Persona e Missão
        Você é Córtex, o co-piloto de IA do sistema Olympus X CRM, uma plataforma para corretores de seguros de saúde.
        Sua missão é ser o assistente mais inteligente e proativo do mercado, eliminando a necessidade de navegação manual, respondendo dúvidas e executando ações complexas através de comandos simples.
        Seu tom é amigável, especialista, convidativo e um pouco futurista. Você sempre busca reduzir o trabalho do usuário.

        ## Visão Geral do Ecossistema Olympus X
        O Olympus X não é um simples CRM, é uma plataforma de inteligência de negócios e automação para o ciclo de vida completo do cliente de seguros: Prospecção, Venda, Onboarding, Gestão e Retenção. O core do sistema é usar dados para automatizar tarefas e gerar insights proativos.

        ## Dicionário de Termos-Chave
        - **Lead:** Um potencial cliente, ainda não comprou. Fica no Funil de Leads.
        - **Cliente:** Um lead que comprou. Possui contratos e beneficiários. Fica na Carteira de Clientes.
        - **Contrato:** O produto que o cliente comprou (plano de saúde/odonto). Um cliente pode ter múltiplos contratos, mas apenas um "ativo".
        - **Beneficiário:** As pessoas cobertas pelo contrato (titular, dependentes).
        - **Operadora:** A empresa que fornece o plano (ex: Unimed, SulAmérica, GNDI).
        - **Córtex Command:** É a interface de comando (Ctrl+K) que você, a IA, utiliza para interagir com o usuário.

        ## Detalhamento Extremo dos Módulos e Funções

        ### Córtex Command (Sua Interface)
        - **Ativação:** Ctrl+K ou clicando no botão "Assistente Córtex".
        - **Tela Inicial:** Apresenta uma saudação personalizada e sugestões proativas (contratos a vencer, leads esquecidos).
        - **Modos de Operação:**
          1. **Buscar:** Encontra qualquer entidade (cliente, lead, contrato) por qualquer dado (nome, CPF, telefone, apólice).
          2. **Perguntar:** Responde a dúvidas sobre como usar o sistema (sua função principal com esta base de conhecimento).
          3. **Executar:** (Funcionalidade futura a ser implementada) Executa ações através de linguagem natural (ex: "criar tarefa para ligar para cliente X").

        ### Dashboard (Painel de Controle)
        - **Aba "Painel de Controle":** Visão geral da saúde do negócio.
          - **KPIs:** Faturamento Ativo, Novos Clientes (Mês), Leads Ativos, Taxa de Conversão.
          - **Funil de Vendas:** Gráfico visual das etapas dos leads.
          - **Avisos Importantes:** Alertas automáticos sobre contratos a vencer ou dados incompletos de beneficiários.
          - **Insights da IA:** Onde você, Córtex, oferece sugestões estratégicas (ex: oportunidades de upsell).
        - **Outras Abas:** "Saúde Financeira" (MRR, Churn), "Performance da Equipe" (rankings), "Análise de Carteira" (distribuição por operadora).

        ### Leads (Funil de Vendas - Kanban)
        - **Interface:** Quadro Kanban visual e interativo. Colunas são 100% customizáveis (nome, cor).
        - **Fluxo de Conversão CRÍTICO:** Ao arrastar um lead para a coluna cujo nome é "Ganhos", o sistema AUTOMATICAMENTE inicia o fluxo de conversão, abrindo o formulário de novo cliente com os dados do lead já preenchidos. Este é um fluxo de alta produtividade.
        - **Card do Lead:** Exibe dados rápidos e o botão "Analisar com IA" que gera um score de potencial de venda.

        ### Clientes
        - **Lista de Clientes:** Tabela principal com busca e filtros avançados por status, operadora e mês de vigência.
        - **Detalhes do Cliente (Visão 360º):** Tela acessada ao clicar em um cliente.
          - **Aba "Visão Geral":** Dados cadastrais da empresa e contatos.
          - **Aba "Contratos":** Exibe o contrato ATIVO em destaque e um histórico de contratos antigos (inativos).
          - **Aba "Beneficiários":** Lista TODOS os beneficiários. Cada card é clicável e abre um modal de VISUALIZAÇÃO com todos os detalhes (CPF, idade, IMC, carteirinha, credenciais de app). A edição é feita no formulário principal do cliente.
          - **Aba "Histórico":** Log de todas as observações e, futuramente, comentários e menções (@).
          - **Aba "Córtex AI":** Onde o usuário pode solicitar um resumo inteligente do histórico do cliente.

        ### Minhas Tarefas (Kanban)
        - **Propósito:** Gerenciamento de atividades do dia a dia do corretor.
        - **Automação Chave:** O sistema cria tarefas AUTOMATICAMENTE aqui. A principal é "Enviar Boleto - [Nome Cliente] - [Mês/Ano]", gerada com base na "Data de Envio do Boleto" cadastrada no contrato do cliente. A descrição da tarefa já vem com os dados do portal e o link do WhatsApp do cliente.

        ### Calendário Inteligente
        - **Inteligência:** 99% dos eventos são gerados AUTOMATICAMENTE pelo sistema, não por inserção manual.
        - **Eventos Gerados:**
          - **Envio de Boleto:** Com base na data no contrato. Permite adiar o envio no mês corrente.
          - **Vencimento de Boleto:** Com base no dia de vencimento no contrato.
          - **Renovação de Contrato:** Com base na data de renovação.
          - **Tarefas de Alta Prioridade:** Tarefas com prazo e prioridade alta aparecem aqui.

        ### Gestão Corporativa (Área do Admin)
        - **Equipe Interna:** Gerencia usuários COM acesso ao sistema. Os cards mostram métricas de performance (clientes, leads, tarefas) para cada usuário.
        - **Parceiros Externos:** Cadastra contatos comerciais (outras corretoras, freelancers) SEM acesso ao sistema, mas que precisam ser associados a vendas. Eles aparecem nos dropdowns de "Corretor Responsável".
        - **Operadoras:** Um guia de referência. O usuário pode cadastrar apenas o nome (para uso rápido) ou detalhar com dados do gerente de contas, portal, etc. A lista é expansível.
        - **Minha Empresa:** Configuração da própria corretora (logo, dados, metas de faturamento que se conectam ao Dashboard).

        ## Fluxos de Trabalho e Processos-Chave
        
        ### Fluxo de Venda Completo:
        1. Lead chega (manualmente ou via site).
        2. Corretor usa o Córtex para analisar o potencial do lead (score).
        3. Lead é movido no funil Kanban.
        4. Ao chegar em "Ganhos", o sistema o converte para a tela de "Novo Cliente".
        5. Corretor preenche dados do Contrato e Beneficiários.
        6. Ao salvar, o Cliente é criado, o Lead é excluído.
        7. Uma nova Comissão pode ser lançada usando o "Wizard de Lançamento".
        8. O sistema passa a monitorar o novo contrato para gerar tarefas e eventos no calendário (pós-venda).

        ### Fluxo de Pós-Venda Automatizado:
        1. Mensalmente, o BoletoTaskManager verifica os contratos.
        2. Tarefas de "Enviar Boleto" são criadas para os responsáveis.
        3. O Calendário exibe os dias de envio e vencimento.
        4. Ao se aproximar da data de renovação, o Calendário alerta e o Dashboard mostra um "Aviso Importante".
        5. (Visão Futura) Jornadas Automatizadas irão disparar e-mails e tarefas de contato em momentos-chave do ciclo de vida do cliente.

        ### Fluxo de Suporte e Retenção (Visão Futura):
        1. O "Córtex Sentinel" monitora a "Saúde da Conta" de todos os clientes.
        2. Se um cliente tem muitos problemas (ex: reembolsos negados) ou está sem contato, sua nota de saúde cai.
        3. Ao atingir um nível crítico, o sistema cria uma tarefa proativa para o corretor agir ANTES do cliente pensar em cancelar.

        ## Diretrizes de Resposta
        - Seja sempre conciso e use listas (bullet points) quando possível.
        - Ao explicar um "como fazer", use um formato passo a passo (1, 2, 3...).
        - Sempre que possível, termine sua resposta oferecendo uma ação: "Quer que eu te leve para a tela de Clientes?", "Posso criar esta tarefa para você?".
        - Mantenha a persona de um co-piloto inteligente e prestativo.
        `;


// 🔌 CONECTOR CENTRAL DA API: LIDA COM TODAS AS CHAMADAS E ERROS
const apiClient = async (prompt) => {
    // 🚨 ATENÇÃO: Mova sua chave para um arquivo .env na raiz do projeto:
    // REACT_APP_GEMINI_API_KEY="SUA_CHAVE_AQUI"
    // E substitua a linha abaixo por: const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    const GEMINI_API_KEY = "AIzaSyBblrqaeYhLpze4QqNlACEFJpC4ek-7z3Y"; 
    
    if (!GEMINI_API_KEY) {
        console.error("Chave de API do Gemini não encontrada.");
        return { success: false, data: "Erro: Chave de API não configurada." };
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Erro na API Gemini:", errorBody);
            return { 
                success: false, 
                status: response.status, 
                data: `Erro na API: ${errorBody.error?.message || response.statusText}` 
            };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
             return { success: false, data: "A IA não retornou um texto válido." };
        }
        
        return { success: true, data: text };

    } catch (error) {
        console.error("Erro de conexão com a IA:", error);
        return { success: false, data: "Erro de conexão com a IA." };
    }
};

// ✨ OBJETO CORTEX COMPLETO E FINALIZADO
const Cortex = {
    /**
     * Interpreta um comando em linguagem natural e o transforma em um plano de ação JSON.
     */
    parseCommand: async (prompt) => {
        const response = await apiClient(prompt);
        if (!response.success) {
            return { error: response.data };
        }
        try {
            const jsonString = response.data.substring(response.data.indexOf('{'), response.data.lastIndexOf('}') + 1);
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Erro ao parsear JSON da IA:", e, "Resposta recebida:", response.data);
            return { error: "A IA retornou uma resposta em um formato inválido." };
        }
    },

    /**
     * Analisa as notas de um lead e retorna um score de potencial.
     */
    analyzeLead: async (lead) => {
        const prompt = `Analise as seguintes notas sobre um lead de vendas e retorne um score de 1 a 100 e uma breve justificativa. O formato da resposta deve ser um JSON com as chaves "score" (number) e "justification" (string). Notas do Lead: "${lead.notes || 'Nenhuma nota fornecida.'}"`;
        
        const response = await apiClient(prompt);
        
        if (!response.success) {
            const justification = response.status === 429 
                ? "Análise indisponível (limite de quota atingido)." 
                : "Não foi possível analisar as notas (erro de API).";
            return { score: 0, justification };
        }

        try {
            const jsonString = response.data.substring(response.data.indexOf('{'), response.data.lastIndexOf('}') + 1);
            return JSON.parse(jsonString);
        } catch (e) {
            return { score: 50, justification: "Não foi possível interpretar a análise da IA." };
        }
    },

    /**
     * Cria um resumo conciso do histórico de observações de um cliente.
     */
    summarizeHistory: async (client) => {
        const observationsText = (client.observations || [])
            .map(obs => `Em ${formatDateTime(obs.timestamp)} por ${obs.authorName}: ${obs.text}`)
            .join('\n');
        const prompt = `Resuma o seguinte histórico de observações de um cliente em 3 a 4 bullet points concisos. Foque nos pontos mais importantes para um rápido entendimento do relacionamento. Histórico: "${observationsText || 'Nenhum histórico de observações.'}"`;
        
        const response = await apiClient(prompt);
        return response.data; // Retorna o resumo ou a mensagem de erro do apiClient
    },

    /**
     * Responde a perguntas gerais sobre o funcionamento do sistema.
     */
    getHelp: async (question) => {
        const prompt = `${SYSTEM_KNOWLEDGE_BASE}\n\nO usuário perguntou: "${question}".\n\nResponda a pergunta dele com base no seu conhecimento profundo do sistema.`;
        const response = await apiClient(prompt);
        return response.data;
    }
};

// --- CONTEXTOS (STATE MANAGEMENT) ---
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => { const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark'); useEffect(() => { document.documentElement.classList.remove('light', 'dark'); document.documentElement.classList.add(theme); localStorage.setItem('theme', theme); }, [theme]); const value = { theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }; return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>; };
const useTheme = () => useContext(ThemeContext);

const AuthContext = createContext();
const AuthProvider = ({ children }) => { const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { if (!auth) { setLoading(false); return; } const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => { if (firebaseUser) { if (!db) { setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'Usuário', permissionLevel: 'Corretor' }); setLoading(false); return; } const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => { setUser(doc.exists() ? { uid: firebaseUser.uid, email: firebaseUser.email, ...doc.data() } : { uid: firebaseUser.uid, email: firebaseUser.email, name: 'Usuário Incompleto', permissionLevel: 'Corretor' }); setLoading(false); }); return () => unsubDoc(); } else { setUser(null); setLoading(false); } }); return () => { if (typeof unsubscribe === 'function') unsubscribe(); }; }, []); const login = async (email, password) => { if (!auth) return { success: false, code: 'auth/no-firebase' }; try { await signInWithEmailAndPassword(auth, email, password); return { success: true }; } catch (error) { return { success: false, code: error.code }; } }; const logout = async () => { if (auth) await signOut(auth).catch(e => console.error("Logout error", e)); }; const addUser = async (userData) => { if (!auth || !db) return { success: false, code: 'auth/no-firebase' }; try { const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password); const { password, ...dataToSave } = userData; await setDoc(doc(db, "users", cred.user.uid), dataToSave); return { success: true }; } catch (error) { return { success: false, code: error.code }; } }; const deleteUser = async (userId) => { if (!db) return false; try { await deleteDoc(doc(db, "users", userId)); return true; } catch (error) { return false; } }; const updateUserProfile = async (uid, data) => { if (!db) return false; try { await updateDoc(doc(db, "users", uid), data); return true; } catch (error) { return false; } }; const updateUserPassword = async (currentPassword, newPassword) => { const user = auth?.currentUser; if (!user) return 'no-user'; try { await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword)); await updatePassword(user, newPassword); return true; } catch (error) { return error.code; } }; const value = { user, loading, login, logout, addUser, deleteUser, updateUserProfile, updateUserPassword }; return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; };
const useAuth = () => useContext(AuthContext);

const DataContext = createContext();
const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [data, setData] = useState({ clients: [], leads: [], tasks: [], users: [], timeline: [], operators: [], commissions: [], companyProfile: {}, leadColumns: [], taskColumns: [], completedEvents: [], partners: [], loading: true });

    const logAction = async (logData) => {
        if (!db || !user) return;
        try {
            await addDoc(collection(db, 'timeline'), { ...logData, userId: user.uid, userName: user.name, userAvatar: user.avatar || null, timestamp: serverTimestamp() });
        } catch (error) { console.error("Erro ao registrar log:", error); }
    };

    useEffect(() => {
        if (!db) { setData(d => ({ ...d, loading: false })); return; }
        const collectionsToFetch = { clients: 'clients', leads: 'leads', tasks: 'tasks', users: 'users', operators: 'operators', timeline: 'timeline', commissions: 'commissions', completedEvents: 'completed_events', partners: 'partners' };
        
        const unsubscribes = Object.entries(collectionsToFetch).map(([stateKey, collectionName]) => {
            const q = collectionName === 'timeline' ? query(collection(db, collectionName), orderBy('timestamp', 'desc')) : collection(db, collectionName);
            return onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(prev => ({ ...prev, [stateKey]: items }));
            }, (error) => {
                console.error(`Erro ao buscar ${collectionName}, definindo como array vazio:`, error);
                setData(prev => ({...prev, [stateKey]: []}));
            });
        });

        const unsubLeadCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'leads'), orderBy('order')), (snapshot) => setData(prev => ({...prev, leadColumns: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))})));
        const unsubTaskCols = onSnapshot(query(collection(db, 'kanban_columns'), where('boardId', '==', 'tasks'), orderBy('order')), (snapshot) => setData(prev => ({...prev, taskColumns: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))})));

        unsubscribes.push(unsubLeadCols, unsubTaskCols);

        const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (doc) => setData(prev => ({ ...prev, companyProfile: doc.exists() ? doc.data() : {} })));
        unsubscribes.push(unsubProfile);
        
        const timer = setTimeout(() => setData(d => ({ ...d, loading: false })), 2000);
        
        return () => { unsubscribes.forEach(unsub => unsub?.()); clearTimeout(timer); };
    }, []);

    const actionableEvents = useMemo(() => {
        const { clients, tasks, commissions } = data;
        if (!clients || !tasks || !commissions) return [];

        const generatedEvents = [];
        const addEvent = (event) => { if (event.date && !isNaN(event.date.getTime())) { generatedEvents.push(event); } };

        clients.forEach(client => {
            (client.contracts || []).forEach(contract => {
                if (contract.status !== 'ativo') return;
                
                // O nome original da propriedade é `renewalDate`, mas no JSON de exemplo é `dataRenovacaoContrato`.
                // Usaremos `renewalDate` como está no código, mas certifique-se que o nome no seu Firestore é o mesmo.
                const renewalDate = contract.renewalDate ? new Date(contract.renewalDate + 'T23:59:59') : new Date(new Date().getFullYear() + 5, 0, 1);

                // --- LÓGICA DE ENVIO DE BOLETO (REATORADA) ---
                if (contract.boletoSentDate) {
                    // 1. DEFINIR O PONTO DE PARTIDA
                    // Nunca começaremos a gerar eventos antes do início do mês atual.
                    // Isso resolve o problema de clientes antigos.
                    const hoje = new Date();
                    const inicioDoMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    
                    const dataBaseEnvio = new Date(contract.boletoSentDate + 'T00:00:00');
                    
                    // O loop começa na data de envio do boleto OU no início do mês atual, o que for MAIS RECENTE.
                    let dataCorrente = new Date(Math.max(dataBaseEnvio, inicioDoMesAtual));

                    // 2. LOOP OTIMIZADO
                    // O loop agora começa no presente e vai até a data de renovação.
                    while (dataCorrente <= renewalDate) {
                        const ano = dataCorrente.getFullYear();
                        const mes = dataCorrente.getMonth(); // 0-11
                        const diaOriginalEnvio = dataBaseEnvio.getDate(); // Pega o dia original (ex: 25)

                        // Identificador único para este ciclo de faturamento
                        const cicloOriginal = `${ano}-${String(mes + 1).padStart(2, '0')}`; // Ex: "2025-07"
                        
                        // 3. LÓGICA DE EXCEÇÃO (ADIAR)
                        // Verifica se existe uma exceção manual para este ciclo.
                        const excecao = (client.boletoExceptions || []).find(ex => ex.originalDate === cicloOriginal);
                        
                        const dataDoEvento = excecao
                            ? new Date(excecao.modifiedDate + 'T00:00:00') // Usa a data adiada
                            : new Date(ano, mes, diaOriginalEnvio);      // Usa a data recorrente padrão

                        // Só adiciona o evento se a data final for válida
                        if (!isNaN(dataDoEvento.getTime())) {
                            const eventId = `boleto-${client.id}-${contract.id}-${cicloOriginal}`;
                            addEvent({ 
                                type: 'boletoSend', 
                                id: eventId, 
                                date: dataDoEvento, 
                                data: { client, contract, originalDate: cicloOriginal }, 
                                title: `Enviar Boleto: ${client.general.holderName || client.general.companyName}`, 
                                color: 'bg-cyan-500', 
                                icon: FileTextIcon 
                            });
                        }
                        
                        // 4. INCREMENTO SEGURO DO MÊS
                        // Avança para o próximo mês.
                        dataCorrente.setMonth(dataCorrente.getMonth() + 1);
                    }
                }

                // Lógica de Vencimento de Boleto (Otimizada similarmente)
                // O nome original da propriedade é `effectiveDate`, mas no JSON de exemplo é `dataVigencia`.
                // Usaremos `effectiveDate` como está no código.
                if (contract.monthlyDueDate && contract.effectiveDate) {
                     const hoje = new Date();
                     const inicioDoMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                     const dataBaseVigencia = new Date(contract.effectiveDate + 'T00:00:00');

                     let dataCorrente = new Date(Math.max(dataBaseVigencia, inicioDoMesAtual));

                     while(dataCorrente <= renewalDate) {
                         const diaVencimento = parseInt(contract.monthlyDueDate, 10);
                         const dataDoEvento = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth(), diaVencimento);
                        
                         if (!isNaN(dataDoEvento.getTime())) {
                             addEvent({ 
                                 type: 'boletoDue', 
                                 id: `due-${client.id}-${contract.id}-${dataDoEvento.toISOString()}`, 
                                 date: dataDoEvento, 
                                 data: { client, contract }, 
                                 title: `Vencimento: ${client.general.holderName || client.general.companyName}`, 
                                 color: 'bg-yellow-500', 
                                 icon: AlertTriangleIcon 
                             });
                         }
                         dataCorrente.setMonth(dataCorrente.getMonth() + 1);
                     }
                }
                
                // Lógica de Renovação de Contrato (permanece a mesma)
                if (contract.renewalDate) {
                     addEvent({ type: 'renewal', id: `renewal-${client.id}-${contract.id}`, date: new Date(contract.renewalDate + 'T00:00:00'), data: { client, contract }, title: `Renovação: ${client.general.holderName || client.general.companyName}`, color: 'bg-violet-500', icon: AwardIcon });
                }
            });
        });

        // Lógica de Tarefas de Alta Prioridade
        tasks.forEach(task => {
            if (task.priority === 'Alta' && task.dueDate) {
                addEvent({ type: 'task', id: `task-${task.id}`, date: new Date(task.dueDate + 'T00:00:00'), data: { task }, title: `Tarefa: ${task.title}`, color: 'bg-red-500', icon: CheckSquareIcon });
            }
        });

        return generatedEvents;
    }, [data.clients, data.tasks, data.commissions]);
    
    const addClient = async (clientData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "clients"), { ...clientData, createdAt: serverTimestamp() }); logAction({ actionType: 'CRIAÇÃO', module: 'Clientes', description: `criou o cliente ${clientData.general.holderName}.`, entity: { type: 'Cliente', id: docRef.id, name: clientData.general.holderName }, linkTo: `/clients/${docRef.id}` }); return { id: docRef.id, ...clientData }; } catch (e) { return null; } };
    const updateClient = async (clientId, updatedData) => { if (!db) return null; try { const oldClient = data.clients.find(c => c.id === clientId); const changes = generateChangeDescription(oldClient, updatedData, fieldNameMap); const description = changes.length > 0 ? `atualizou o cliente ${updatedData.general?.holderName || 'sem nome'}: ${changes.join(', ')}.` : `visualizou/salvou o cliente ${updatedData.general?.holderName || 'sem nome'} sem alterações.`; const clientRef = doc(db, "clients", clientId); await updateDoc(clientRef, updatedData); logAction({ actionType: 'EDIÇÃO', module: 'Clientes', description: description, entity: { type: 'Cliente', id: clientId, name: updatedData.general?.holderName }, linkTo: `/clients/${clientId}`}); return { id: clientId, ...updatedData }; } catch (e) { return null; } };
    const deleteClient = async (clientId, clientName) => { if(!db) return false; try { await deleteDoc(doc(db, "clients", clientId)); logAction({ actionType: 'EXCLUSÃO', module: 'Clientes', description: `excluiu o cliente ${clientName}.`, entity: { type: 'Cliente', id: clientId, name: clientName } }); return true; } catch (e) { return false; } };
    const addLead = async (leadData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "leads"), {...leadData, createdAt: serverTimestamp(), lastActivityDate: serverTimestamp()}); logAction({ actionType: 'CRIAÇÃO', module: 'Leads', description: `criou o lead ${leadData.name}.`, entity: { type: 'Lead', id: docRef.id, name: leadData.name } }); return { id: docRef.id, ...leadData }; } catch (e) { return null; } };
    const updateLead = async (leadId, updatedData) => { if (!db) return false; try { const oldLead = data.leads.find(l => l.id === leadId); const changes = generateChangeDescription(oldLead, updatedData, fieldNameMap); const description = changes.length > 0 ? `atualizou o lead ${updatedData.name}: ${changes.join(', ')}.` : `atualizou o lead ${updatedData.name}.`; await updateDoc(doc(db, "leads", leadId), { ...updatedData, lastActivityDate: serverTimestamp() }); logAction({ actionType: 'EDIÇÃO', module: 'Leads', description: description, entity: { type: 'Lead', id: leadId, name: updatedData.name } }); return true; } catch (e) { return false; } };
    const deleteLead = async (leadId, leadName) => { if(!db) return false; try { await deleteDoc(doc(db, "leads", leadId)); logAction({ actionType: 'EXCLUSÃO', module: 'Leads', description: `excluiu o lead ${leadName}.`}); return true; } catch (e) { return false; } };
    const convertLeadToClient = async (lead) => { return true; };
    const addTask = async (taskData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "tasks"), {...taskData, createdAt: serverTimestamp()}); logAction({ actionType: 'CRIAÇÃO', module: 'Tarefas', description: `criou a tarefa "${taskData.title}".`, entity: { type: 'Tarefa', id: docRef.id, name: taskData.title } }); return { id: docRef.id, ...taskData }; } catch (e) { return null; } };
    const updateTask = async (taskId, updatedData) => { if(!db) return false; try { const oldTask = data.tasks.find(t => t.id === taskId); const changes = generateChangeDescription(oldTask, updatedData, fieldNameMap); const description = changes.length > 0 ? `atualizou a tarefa "${updatedData.title}": ${changes.join(', ')}.` : `atualizou a tarefa "${updatedData.title}".`; const dataToUpdate = { ...updatedData }; if (updatedData.status === 'Concluída' && oldTask.status !== 'Concluída') { dataToUpdate.completedAt = serverTimestamp(); } await updateDoc(doc(db, "tasks", taskId), dataToUpdate); logAction({ actionType: 'EDIÇÃO', module: 'Tarefas', description: description }); return true; } catch (e) { return false; } };
    const deleteTask = async (taskId, taskTitle) => { if(!db) return false; try { await deleteDoc(doc(db, "tasks", taskId)); logAction({ actionType: 'EXCLUSÃO', module: 'Tarefas', description: `excluiu a tarefa "${taskTitle}".`}); return true; } catch (e) { return false; } };
    const addOperator = async (operatorData) => { if(!db) return false; try { await addDoc(collection(db, "operators"), operatorData); logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou a operadora ${operatorData.name}.` }); return true; } catch (e) { return false; } };
    const deleteOperator = async (operatorId, operatorName) => { if(!db) return false; try { await deleteDoc(doc(db, "operators", operatorId)); logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu a operadora ${operatorName}.` }); return true; } catch (e) { return false; } };
    const updateOperator = async (operatorId, dataToUpdate) => { if(!db) return false; try { await updateDoc(doc(db, "operators", operatorId), dataToUpdate); logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: `atualizou a operadora ${dataToUpdate.name}.` }); return true; } catch (e) { return false; } };
    const updateCompanyProfile = async (data) => { if(!db) return false; try { await setDoc(doc(db, 'company_profile', 'main'), data, { merge: true }); logAction({ actionType: 'EDIÇÃO', module: 'Corporativo', description: 'atualizou os dados da empresa.' }); return true; } catch (e) { return false; }};
    const addCommission = async (commissionData) => { if(!db) return null; try { const docRef = await addDoc(collection(db, "commissions"), { ...commissionData, createdAt: serverTimestamp() }); logAction({ actionType: 'CRIAÇÃO', module: 'Comissões', description: `lançou comissão para ${commissionData.clientName}.` }); return { id: docRef.id, ...commissionData }; } catch (e) { return null; } };
    const updateCommission = async (commissionId, dataToUpdate) => { if(!db) return false; try { await updateDoc(doc(db, "commissions", commissionId), dataToUpdate); logAction({ actionType: 'EDIÇÃO', module: 'Comissões', description: `atualizou comissão.` }); return true; } catch (e) { return false; } };
    const deleteCommission = async (commissionId) => { if(!db) return false; try { await deleteDoc(doc(db, "commissions", commissionId)); logAction({ actionType: 'EXCLUSÃO', module: 'Comissões', description: `excluiu comissão.` }); return true; } catch (e) { return false; } };
    const addKanbanColumn = async (columnData) => { if (!db) return false; try { await addDoc(collection(db, 'kanban_columns'), columnData); return true; } catch (e) { return false; } };
    const deleteKanbanColumn = async (columnId) => { if (!db) return false; try { await deleteDoc(doc(db, 'kanban_columns', columnId)); return true; } catch (e) { return false; } };
    const updateKanbanColumnOrder = async (orderedColumns) => { if (!db) return false; try { const batch = writeBatch(db); orderedColumns.forEach((col, index) => { const docRef = doc(db, 'kanban_columns', col.id); batch.update(docRef, { order: index }); }); await batch.commit(); return true; } catch (e) { return false; } };
    const toggleEventCompletion = async (event, isCompleted) => {
    if (!db || !user) return false;
    const eventDocRef = doc(db, 'completed_events', event.id);

    try {
        if (isCompleted) {
            await setDoc(eventDocRef, { eventId: event.id, completedAt: serverTimestamp(), userId: user.uid, title: event.title });
            logAction({ actionType: 'CONCLUSÃO', module: 'Calendário', description: `concluiu o evento: "${event.title}"`});

            // [LÓGICA DE VÍNCULO COM TAREFAS]
            if (event.type === 'boletoSend' || event.type === 'task') {
                const { client, originalDate } = event.data;
                
                // Procura a tarefa correspondente no banco de dados
                let taskToUpdate = null;
                if (event.type === 'boletoSend') {
                    taskToUpdate = data.tasks.find(t => 
                        t.isBoletoTask && 
                        t.linkedToId === client.id && 
                        t.boletoCycle === originalDate
                    );
                } else if (event.type === 'task') {
                    taskToUpdate = data.tasks.find(t => t.id === event.data.task.id);
                }

                if (taskToUpdate) {
                    const conclusionColumn = data.taskColumns.find(c => c.isConclusion);
                    const newStatus = conclusionColumn ? conclusionColumn.title : 'Concluída'; // Fallback
                    
                    await updateTask(taskToUpdate.id, { 
                        status: newStatus,
                        completedAt: serverTimestamp() 
                    });
                    toast({ title: "Tarefa Atualizada!", description: `A tarefa "${taskToUpdate.title}" foi marcada como concluída.` });
                }
            }
        } else {
            // Lógica para reabrir (pode ser implementada no futuro se necessário)
            await deleteDoc(eventDocRef);
            logAction({ actionType: 'REABERTURA', module: 'Calendário', description: `reabriu o evento: "${event.title}"`});
        }
        return true;
    } catch (e) {
        console.error("Erro ao concluir evento:", e);
        return false;
    }
};


    
    const addPartner = async (partnerData) => { if(!db) return false; try { await addDoc(collection(db, "partners"), partnerData); logAction({ actionType: 'CRIAÇÃO', module: 'Corporativo', description: `adicionou o parceiro externo ${partnerData.name}.` }); return true; } catch (e) { return false; } };
    const deletePartner = async (partnerId, partnerName) => { if(!db) return false; try { await deleteDoc(doc(db, "partners", partnerId)); logAction({ actionType: 'EXCLUSÃO', module: 'Corporativo', description: `removeu o parceiro externo ${partnerName}.` }); return true; } catch (e) { return false; } };


    const value = { ...data, actionableEvents, getClientById: (id) => data.clients.find(c => c.id === id), addClient, updateClient, deleteClient, addLead, updateLead, deleteLead, convertLeadToClient, addTask, updateTask, deleteTask, addOperator, deleteOperator, updateCompanyProfile, addCommission, updateCommission, deleteCommission, addKanbanColumn, deleteKanbanColumn, updateKanbanColumnOrder, toggleEventCompletion, logAction, addPartner, deletePartner };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
const useData = () => useContext(DataContext);

const NotificationContext = createContext();
const NotificationProvider = ({ children }) => { const [toasts, setToasts] = useState([]); const toast = ({ title, description, variant = 'default' }) => { const id = Date.now(); setToasts(prev => [...prev, { id, title, description, variant }]); setTimeout(() => setToasts(t => t.filter(currentToast => currentToast.id !== id)), 5000); }; return <NotificationContext.Provider value={{ toast, toasts }}>{children}<Toaster /></NotificationContext.Provider>; };
const useToast = () => useContext(NotificationContext);

const ConfirmContext = createContext();
const ConfirmProvider = ({ children }) => { const [confirmState, setConfirmState] = useState(null); const awaitingPromiseRef = useRef(); const openConfirmation = (options) => { setConfirmState(options); return new Promise((resolve, reject) => { awaitingPromiseRef.current = { resolve, reject }; }); }; const handleClose = () => { if (awaitingPromiseRef.current) awaitingPromiseRef.current.reject(); setConfirmState(null); }; const handleConfirm = () => { if (awaitingPromiseRef.current) awaitingPromiseRef.current.resolve(); setConfirmState(null); }; return (<ConfirmContext.Provider value={openConfirmation}>{children}<ConfirmModal isOpen={!!confirmState} onClose={handleClose} onConfirm={handleConfirm} {...confirmState} /></ConfirmContext.Provider>); };

// COLE ESTE NOVO CONTEXTO DE PREFERÊNCIAS
const PreferencesContext = createContext();
const PreferencesProvider = ({ children }) => {
    const { user, updateUserProfile } = useAuth();
    const defaultPreferences = { contourMode: false, uppercaseMode: false };
    const [preferences, setPreferences] = useState(user?.preferences || defaultPreferences);

    useEffect(() => {
        setPreferences(user?.preferences || defaultPreferences);
    }, [user]);

    const updatePreferences = async (newPrefs) => {
        if (user) {
            const updatedPrefs = { ...preferences, ...newPrefs };
            const success = await updateUserProfile(user.uid, { preferences: updatedPrefs });
            if (success) {
                setPreferences(updatedPrefs);
                return true;
            }
        }
        return false;
    };

    const value = { preferences, updatePreferences };

    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};
const usePreferences = () => useContext(PreferencesContext);

const useConfirm = () => useContext(ConfirmContext);

// --- COMPONENTES DE UI REUTILIZÁVEIS ---

const Switch = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:ring-offset-gray-900',
                checked ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-700'
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );
};

const GlassPanel = memo(forwardRef(({ className, children, cortex = false, ...props }, ref) => <div ref={ref} className={cn("bg-white/70 dark:bg-[#161b22]/50 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20", cortex && "cortex-active", className)} {...props}>{children}</div>));
const Button = memo(forwardRef(({ className, variant = 'default', size, children, ...props }, ref) => { const variants = { default: "bg-cyan-500 text-white hover:bg-cyan-600 dark:shadow-[0_0_20px_rgba(6,182,212,0.5)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]", destructive: "bg-red-600 text-white hover:bg-red-700 dark:shadow-[0_0_15px_rgba(220,38,38,0.5)]", outline: "border border-cyan-500/50 bg-transparent text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 hover:border-cyan-500 dark:hover:border-cyan-400", ghost: "hover:bg-gray-900/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white", violet: "bg-violet-600 text-white hover:bg-violet-700 dark:shadow-[0_0_20px_rgba(192,38,211,0.5)]" }; const sizes = { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" }; return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} {...props}>{children}</button>; }));
const Input = memo(forwardRef(({ className, error, mask, isCurrency = false, ...props }, ref) => {
    const { preferences } = usePreferences();
    
    const handleChange = (e) => {
        const { value } = e.target;
        if (mask) {
            e.target.value = mask(value);
        }
        if (preferences.uppercaseMode && !isCurrency && e.target.type !== 'email' && e.target.type !== 'password') {
            e.target.value = e.target.value.toUpperCase();
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };
    
    const handleCurrencyChange = (e) => { let value = e.target.value; value = value.replace(/\D/g, ''); value = (Number(value) / 100).toFixed(2) + ''; value = value.replace('.', ','); value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); e.target.value = `R$ ${value}`; if (props.onChange) { props.onChange(e); } };

    const finalProps = isCurrency ? { ...props, onChange: handleCurrencyChange } : { ...props, onChange: handleChange };
    
    return <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all", error && "border-red-500 ring-red-500", preferences.uppercaseMode && "uppercase", className)} {...finalProps} />
}));

const Label = memo(forwardRef(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-bold text-gray-600 dark:text-gray-400", className)} {...props} />));
const Textarea = memo(forwardRef(({ className, ...props }, ref) => {
    const { preferences } = usePreferences();

    const handleChange = (e) => {
        if (preferences.uppercaseMode) {
            e.target.value = e.target.value.toUpperCase();
        }
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all", preferences.uppercaseMode && "uppercase", className)} {...props} onChange={handleChange} />
}));

const Select = memo(forwardRef(({ className, children, error, ...props }, ref) => <div className="relative"><select ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-white/10 bg-gray-100/50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all appearance-none pr-8", error && "border-red-500 ring-red-500", className)} {...props}>{children}</select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" /></div></div>));
const DateField = memo(forwardRef(({ className, ...props }, ref) => (
    <div className="relative">
        <Input ref={ref} type="date" className={cn("pr-10 dark:[color-scheme:dark]", className)} {...props} />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
    </div>
)));
const Checkbox = memo(forwardRef(({ className, ...props }, ref) => <input type="checkbox" ref={ref} className={cn("h-4 w-4 shrink-0 rounded-sm border-2 border-cyan-500/50 text-cyan-500 bg-gray-200 dark:bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900", className)} {...props} />));
const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);
    const isControlled = value !== undefined;
    const activeTab = isControlled ? value : internalActiveTab;

    const setActiveTab = (tabValue) => {
        if (!isControlled) {
            setInternalActiveTab(tabValue);
        }
        if (onValueChange) {
            onValueChange(tabValue);
        }
    };

    const contextValue = { activeTab, setActiveTab };

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
};

const TabsList = ({ children, className }) => <div className={cn("flex items-center border-b border-gray-200 dark:border-white/10 overflow-x-auto", className)}>{children}</div>;
const TabsTrigger = ({ value, children, className }) => { const { activeTab, setActiveTab } = useContext(TabsContext); const isActive = activeTab === value; return <button type="button" onClick={() => setActiveTab(value)} className={cn("relative inline-flex items-center flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 disabled:pointer-events-none", isActive ? "text-cyan-500 dark:text-cyan-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white", className)}>{children}{isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}</button>; };
const TabsContent = ({ value, children, className }) => { const { activeTab } = useContext(TabsContext); return activeTab === value ? <div className={cn("mt-6", className)}>{children}</div> : null; };
const Modal = ({ isOpen, onClose, title, children, size = '3xl' }) => { if (!isOpen) return null; const sizeClasses = { '3xl': 'max-w-3xl', '5xl': 'max-w-5xl', '6xl': 'max-w-6xl' }; return createPortal(<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/80 animate-fade-in p-4 pt-16 sm:pt-24 overflow-y-auto" onClick={onClose}><GlassPanel className={cn("relative w-full animate-slide-up flex flex-col", sizeClasses[size])} onClick={(e) => e.stopPropagation()}><div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-white/10"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3><Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><XIcon className="h-5 w-5" /></Button></div><div className="flex-grow p-6 overflow-y-auto">{children}</div></GlassPanel></div>, document.body); };
const Toaster = () => { const { toasts } = useToast(); return createPortal(<div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">{toasts.map(({ id, title, description, variant }) => (<GlassPanel key={id} className={cn("p-4 border-l-4", variant === 'destructive' ? 'border-red-500' : variant === 'violet' ? 'border-violet-500' : 'border-cyan-500')}><p className="font-semibold text-gray-900 dark:text-white">{title}</p><p className="text-sm text-gray-700 dark:text-gray-300">{description}</p></GlassPanel>))}</div>, document.body); };
const SkeletonRow = () => (<tr className="animate-pulse"><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2"></div></td><td className="px-6 py-4"><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></td><td className="px-6 py-4"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div></td></tr>);
const EmptyState = ({ title, message, actionText, onAction }) => (<div className="text-center py-16"><ZapIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" /><h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>{onAction && <div className="mt-6"><Button onClick={onAction}><PlusCircleIcon className="h-5 w-5 mr-2" />{actionText}</Button></div>}</div>);
const Badge = memo(({ children, variant = 'default', className }) => { const variants = { default: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200", secondary: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200", outline: "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300", success: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200", warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200", danger: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200" }; return <span className={cn("text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full", variants[variant], className)}>{children}</span>});
const Avatar = ({ children, className }) => <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>{children}</div>;
const AvatarImage = ({ src, ...props }) => <img src={src} className="aspect-square h-full w-full" {...props} />;
const AvatarFallback = ({ children, ...props }) => <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700" {...props}>{children}</span>;

// --- COMPONENTES DE FORMULÁRIO (CLIENTES) ---
const FormSection = ({ title, children, cols = 3 }) => (<div className="mb-8"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">{title}</h3><div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>{children}</div></div>);
const GeneralInfoForm = ({ formData, handleChange, errors }) => {
    const clientType = formData?.general?.clientType;

    // Opções para o dropdown de Vínculo (Pessoa Física)
    const kinshipOptions = ["Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Cônjuge"];

    return (
        <>
            {/* Seção Principal que sempre aparece */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <Label>Tipo de Plano</Label>
                    <Select name="general.clientType" value={clientType || ''} onChange={handleChange}>
                        <option value="">Selecione...</option>
                        <option value="PME">PME</option>
                        <option value="Pessoa Física">Pessoa Física</option>
                        <option value="Adesão">Adesão</option>
                    </Select>
                </div>
            </div>

            {/* Renderização condicional baseada no Tipo de Plano */}
            {clientType && (
                <>
                    {/* --- Formulário para PME --- */}
                    {clientType === 'PME' && (
                        <>
                            <FormSection title="Dados da Empresa" cols={3}>
                                <div>
                                    <Label>Nome da Empresa</Label>
                                    <Input name="general.companyName" value={formData.general?.companyName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CNPJ</Label>
                                    <Input name="general.cnpj" value={formData.general?.cnpj || ''} onChange={handleChange} mask={maskCNPJ} error={errors?.cnpj} maxLength="18" />
                                    {errors?.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
                                </div>
                                <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                    {errors?.responsibleCpf && <p className="text-xs text-red-500 mt-1">{errors.responsibleCpf}</p>}
                                </div>
                            </FormSection>
                            <FormSection title="Contato" cols={3}>
                                <div>
                                    <Label>Responsável</Label>
                                    <Select name="general.responsibleStatus" value={formData.general?.responsibleStatus || 'Beneficiário'} onChange={handleChange}>
                                        <option>Beneficiário</option>
                                        <option>Não Beneficiário</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} error={errors?.email} />
                                </div>
                                <div>
                                    <Label>Telefone Responsável</Label>
                                    <Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome do Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Cargo do Contato</Label>
                                    <Input name="general.contactRole" value={formData.general?.contactRole || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone do Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                            </FormSection>
                        </>
                    )}

                    {/* --- Formulário para Pessoa Física --- */}
                    {clientType === 'Pessoa Física' && (
                        <>
                            <FormSection title="Dados do Titular" cols={3}>
                                <div>
                                    <Label>Nome Titular</Label>
                                    <Input name="general.holderName" value={formData.general?.holderName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CPF Titular</Label>
                                    <Input name="general.holderCpf" value={formData.general?.holderCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.holderCpf} maxLength="14" />
                                </div>
                                <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                </div>
                            </FormSection>
                            <FormSection title="Contato e Vínculo" cols={3}>
                                 <div>
                                    <Label>Responsável</Label>
                                    <Select name="general.responsibleStatus" value={formData.general?.responsibleStatus || 'Beneficiário'} onChange={handleChange}>
                                        <option>Beneficiário</option>
                                        <option>Não Beneficiário</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Responsável</Label>
                                    <Input type="tel" name="general.phone" value={formData.general?.phone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Vínculo do Titular</Label>
                                    <Select name="general.kinship" value={formData.general?.kinship || ''} onChange={handleChange}>
                                        <option value="">Selecione...</option>
                                        {kinshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </Select>
                                </div>
                            </FormSection>
                        </>
                    )}

                    {/* --- Formulário para Adesão --- */}
                    {clientType === 'Adesão' && (
                         <>
                            <FormSection title="Dados do Titular" cols={3}>
                                <div>
                                    <Label>Nome Titular</Label>
                                    <Input name="general.holderName" value={formData.general?.holderName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select name="general.status" value={formData.general?.status || 'Ativo'} onChange={handleChange}>
                                        <option>Ativo</option><option>Inativo</option><option>Prospect</option><option>Pendente</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>CPF Titular</Label>
                                    <Input name="general.holderCpf" value={formData.general?.holderCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.holderCpf} maxLength="14" />
                                </div>
                                 <div>
                                    <Label>Nome do Responsável</Label>
                                    <Input name="general.responsibleName" value={formData.general?.responsibleName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>CPF do Responsável</Label>
                                    <Input name="general.responsibleCpf" value={formData.general?.responsibleCpf || ''} onChange={handleChange} mask={maskCPF} error={errors?.responsibleCpf} maxLength="14" />
                                </div>
                            </FormSection>
                            <FormSection title="Dados de Adesão e Contato" cols={3}>
                                <div>
                                    <Label>Profissão</Label>
                                    <Input name="general.profession" value={formData.general?.profession || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Sindicato Filiado</Label>
                                    <Input name="general.union" value={formData.general?.union || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Administradora</Label>
                                    <Input name="general.administrator" value={formData.general?.administrator || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Email Responsável</Label>
                                    <Input type="email" name="general.email" value={formData.general?.email || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Nome Contato</Label>
                                    <Input name="general.contactName" value={formData.general?.contactName || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Telefone Contato</Label>
                                    <Input type="tel" name="general.contactPhone" value={formData.general?.contactPhone || ''} onChange={handleChange} />
                                </div>
                            </FormSection>
                        </>
                    )}
                    
                    {/* Seção de Endereço (Comum a todos) */}
                    <FormSection title="Endereço" cols={3}>
                        <div>
                            <Label>CEP</Label>
                            <Input name="address.cep" value={formData.address?.cep || ''} onChange={handleChange} mask={maskCEP} maxLength="9" />
                        </div>
                        <div>
                            <Label>Logradouro</Label>
                            <Input name="address.street" value={formData.address?.street || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Complemento</Label>
                            <Input name="address.complement" value={formData.address?.complement || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Bairro</Label>
                            <Input name="address.neighborhood" value={formData.address?.neighborhood || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Cidade</Label>
                            <Input name="address.city" value={formData.address?.city || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label>Estado</Label>
                            <Input name="address.state" value={formData.address?.state || ''} onChange={handleChange} />
                        </div>
                    </FormSection>
                </>
            )}
        </>
    );
};
const InternalDataForm = ({ formData, handleChange }) => {
    const { users, partners } = useData();

    const allBrokers = useMemo(() => {
        const internal = users.filter(u => u.permissionLevel === 'Corretor').map(u => ({ id: u.id, name: u.name }));
        const external = partners.filter(p => p.type === 'Corretor').map(p => ({ id: p.id, name: `${p.name} (Parceiro)` }));
        return [...internal, ...external].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, partners]);

    const allSupervisors = useMemo(() => {
        const internal = users.filter(u => u.permissionLevel === 'Supervisor').map(u => ({ id: u.id, name: u.name }));
        const external = partners.filter(p => p.type === 'Supervisor').map(p => ({ id: p.id, name: `${p.name} (Parceiro)` }));
        return [...internal, ...external].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, partners]);

    return (
        <FormSection title="Dados Internos e Gestão" cols={2}>
            <div>
                <Label>Corretor Responsável</Label>
                <Select name="internal.brokerId" value={formData?.internal?.brokerId || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {allBrokers.map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}
                </Select>
            </div>
            <div>
                <Label>Supervisor</Label>
                <Select name="internal.supervisorId" value={formData?.internal?.supervisorId || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {allSupervisors.map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}
                </Select>
            </div>
        </FormSection>
    );
};

const BeneficiaryModal = ({ isOpen, onClose, onSave, beneficiary }) => {
    const getInitialFormState = () => ({ id: null, name: '', cpf: '', dob: '', kinship: 'Titular', weight: '', height: '', idCardNumber: '', credentials: { appLogin: '', appPassword: '' } });
    const [formState, setFormState] = useState(getInitialFormState());
    const [age, setAge] = useState(null);
    const [imc, setImc] = useState({ value: null, classification: '' });
    const kinshipOptions = ["Titular", "Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Esposa", "Marido", "Sobrinho(a)", "Neto(a)", "Outro"];

    useEffect(() => {
        if (isOpen) {
            setFormState(beneficiary ? { ...getInitialFormState(), ...beneficiary } : getInitialFormState());
        } else {
            setAge(null);
            setImc({ value: null, classification: '' });
        }
    }, [beneficiary, isOpen]);

    useEffect(() => {
        if (formState.dob) {
            setAge(calculateAge(formState.dob));
        } else {
            setAge(null);
        }
    }, [formState.dob]);

    useEffect(() => {
        const weight = parseFloat(formState.weight);
        const height = parseFloat(formState.height);
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            setImc({ value: imcValue.toFixed(2), classification });
        } else {
            setImc({ value: null, classification: '' });
        }
    }, [formState.weight, formState.height]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormState(p => ({ ...p, [parent]: { ...p[parent], [child]: value }}));
        } else {
            let cleanValue = value;
            if (name === 'height' || name === 'weight') {
                cleanValue = value.replace(/[^0-9]/g, '');
            }
            setFormState(p => ({ ...p, [name]: cleanValue }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={beneficiary ? "Editar Beneficiário" : "Adicionar Beneficiário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo</Label><Input name="name" value={formState.name} onChange={handleChange} required /></div>
                    <div><Label>CPF</Label><Input name="cpf" value={formState.cpf} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Data de Nascimento</Label><DateField name="dob" value={formState.dob} onChange={handleChange} required /></div>
                    {age !== null && <div className="mt-2"><Label>Idade</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{age} anos</p></div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Peso (kg)</Label><Input type="number" name="weight" value={formState.weight} onChange={handleChange} placeholder="Ex: 70"/></div>
                    <div><Label>Altura (cm)</Label><Input type="number" name="height" value={formState.height} onChange={handleChange} placeholder="Ex: 175 (em cm)"/></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>IMC</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{imc.value ? `${imc.value} - ${imc.classification}` : 'N/D'}</p></div>
                    <div><Label>Parentesco</Label><Select name="kinship" value={formState.kinship} onChange={handleChange} required>{kinshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Select></div>
                </div>
                <div><Label>Número da Carteirinha</Label><Input name="idCardNumber" value={formState.idCardNumber} onChange={handleChange} /></div>
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t pt-4 mt-4">Credenciais do Beneficiário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Login do App</Label><Input name="credentials.appLogin" value={formState.credentials?.appLogin || ''} onChange={handleChange} /></div>
                    <div><Label>Senha do App</Label><Input type="text" name="credentials.appPassword" value={formState.credentials?.appPassword || ''} onChange={handleChange} /></div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" onClick={handleSubmit}>Salvar</Button>
                </div>
            </form>
        </Modal>
    );
};
const BeneficiariesForm = ({ beneficiaries, setBeneficiaries, toast }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentBeneficiary, setCurrentBeneficiary] = useState(null);
    const confirm = useConfirm();

    const handleSave = (beneficiaryData) => {
        const updatedBeneficiaries = beneficiaryData.id ? (beneficiaries || []).map(b => (b.id === beneficiaryData.id ? beneficiaryData : b)) : [...(beneficiaries || []), { ...beneficiaryData, id: `local_${Date.now()}` }];
        setBeneficiaries(updatedBeneficiaries);
        toast({ title: "Beneficiário Atualizado", description: `${beneficiaryData.name} foi ${beneficiaryData.id ? 'editado' : 'adicionado'} à lista. Salve o cliente para confirmar.`, variant: 'violet' });
        setModalOpen(false);
        setCurrentBeneficiary(null);
    };

    const handleRemove = async (beneficiaryToRemove) => {
        try {
            await confirm({ title: `Excluir Beneficiário ${beneficiaryToRemove.name}?`, description: "A remoção é permanente." });
            const updatedBeneficiaries = (beneficiaries || []).filter(b => b.id !== beneficiaryToRemove.id);
            setBeneficiaries(updatedBeneficiaries);
            toast({ title: "Removido da lista", description: `${beneficiaryToRemove.name} foi removido. Salve o cliente para confirmar.` });
        } catch (error) {
            if (error) { toast({ title: "Ação cancelada", description: "O beneficiário não foi removido da lista.", variant: 'destructive' }); }
        }
    };
    
    const handleOpenModal = (beneficiary = null) => {
        setCurrentBeneficiary(beneficiary ? { ...beneficiary } : null);
        setModalOpen(true);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Beneficiários</h3>
                <Button type="button" onClick={() => handleOpenModal()}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Beneficiário</Button>
            </div>
            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">
                {(beneficiaries || []).length === 0 ? 
                    <p className="text-gray-500 text-center py-4">Nenhum beneficiário adicionado.</p> 
                    : beneficiaries.map(ben => (
                        <div key={ben.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{ben.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ben.kinship} - {formatDate(ben.dob)}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ben)}><PencilIcon className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleRemove(ben)}><Trash2Icon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
            </div>
            <BeneficiaryModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSave} 
                beneficiary={currentBeneficiary}
            />
        </div>
    );
};

// --- ABAS E COMPONENTES DE DETALHES ---
const HistoryForm = ({ observations, setObservations }) => { const { user } = useAuth(); const [newObservation, setNewObservation] = useState(''); const handleAddObservation = () => { if (!newObservation.trim()) return; const observationEntry = { text: newObservation, authorId: user.uid, authorName: user.name, timestamp: new Date() }; setObservations([observationEntry, ...(observations || [])]); setNewObservation(''); }; return (<div className="mb-8"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 border-b border-gray-200 dark:border-white/10 pb-3 mb-6">Histórico de Observações</h3><div className="space-y-4"><div><Label>Nova Observação</Label><Textarea value={newObservation} onChange={(e) => setNewObservation(e.target.value)} rows={4} placeholder="Adicione uma nova anotação sobre a interação com o cliente..." /><div className="text-right mt-2"><Button type="button" size="sm" onClick={handleAddObservation}>Adicionar ao Histórico</Button></div></div><div className="space-y-4 max-h-96 overflow-y-auto pr-2">{(observations || []).length === 0 ? (<p className="text-gray-500 text-center py-4">Nenhuma observação registrada.</p>) : ((observations || []).map((obs, index) => (<div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg"><p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p><p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-right">{obs.authorName} em {formatDateTime(obs.timestamp)}</p></div>)))}</div></div></div>); };
const DetailItem = memo(( { label, value, isPassword = false, isLink = false, children, isCurrency = false } ) => {
    const { toast } = useToast();
    const { preferences } = usePreferences();
    const { contourMode, uppercaseMode } = preferences;
    const [showPassword, setShowPassword] = useState(false);
    
    const handleCopy = () => { try { const tempInput = document.createElement('textarea'); tempInput.value = value; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); toast({ title: 'Copiado!', description: `${label} copiado.` }); } catch (err) { toast({ title: 'Erro', description: `Não foi possível copiar.`, variant: 'destructive' }); } };
    
    let displayValue = value || 'N/A';
    if (uppercaseMode && typeof displayValue === 'string' && !isCurrency) {
        displayValue = displayValue.toUpperCase();
    }
    
    return (
    <div className="py-1">
        <Label>{label}</Label>
        <div className={cn(
            "flex items-center justify-between mt-1 group",
            contourMode && "border border-gray-200 dark:border-white/10 rounded-lg px-3 min-h-[40px] bg-gray-100/30 dark:bg-black/10"
        )}>
            <div className={cn("text-md text-gray-800 dark:text-gray-100 break-words", uppercaseMode && "uppercase")}>
                {children ? children :
                 (isLink && value ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">{displayValue}</a> :
                 (isPassword && !showPassword ? '••••••••' :
                 (isCurrency ? formatCurrency(value) : displayValue)))}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isPassword && value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</Button>)}
                {value && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}><CopyIcon className="h-4 w-4" /></Button>)}
            </div>
        </div>
    </div>
    );
});
const InternalTab = ({ client }) => { const { users } = useData(); const broker = users.find(u => u.id === client?.internal?.brokerId); const supervisor = users.find(u => u.id === client?.internal?.supervisorId); return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"><DetailItem label="Corretor" value={broker?.name} /><DetailItem label="Supervisor" value={supervisor?.name} /></div>); };
const BeneficiaryViewModal = ({ isOpen, onClose, beneficiary }) => {
    if (!beneficiary) return null;

    const getImcDisplay = (weightStr, heightStr) => {
        const weight = parseFloat(weightStr);
        const height = parseFloat(heightStr);
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            return `${imcValue.toFixed(2)} - ${classification}`;
        }
        return 'N/A';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${beneficiary.name}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    <DetailItem label="Nome Completo" value={beneficiary.name} />
                    <DetailItem label="CPF" value={beneficiary.cpf} />
                    <DetailItem label="Parentesco" value={beneficiary.kinship} />
                    <DetailItem label="Data de Nascimento" value={formatDate(beneficiary.dob)} />
                    <DetailItem label="Idade" value={calculateAge(beneficiary.dob) !== null ? `${calculateAge(beneficiary.dob)} anos` : 'N/A'} />
                    <DetailItem label="Número da Carteirinha" value={beneficiary.idCardNumber} />
                    <DetailItem label="Peso" value={beneficiary.weight ? `${beneficiary.weight} kg` : 'N/A'} />
                    <DetailItem label="Altura" value={beneficiary.height ? `${beneficiary.height} cm` : 'N/A'} />
                    <DetailItem label="IMC" value={getImcDisplay(beneficiary.weight, beneficiary.height)} />
                </div>

                {beneficiary.credentials && (beneficiary.credentials.appLogin || beneficiary.credentials.appPassword) && (
                    <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10">
                        <h5 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-2">Credenciais do Beneficiário</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <DetailItem label="Login do App" value={beneficiary.credentials.appLogin} />
                            <DetailItem label="Senha do App" value={beneficiary.credentials.appPassword} isPassword />
                        </div>
                    </div>
                )}
            </div>
             <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    );
};
const BeneficiariesTab = ({ client }) => {
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

    const handleOpenViewModal = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setViewModalOpen(true);
    };

    const getImcDisplay = (weightStr, heightStr) => {
        const weight = parseFloat(weightStr);
        const height = parseFloat(heightStr);
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            return `${imcValue.toFixed(2)} - ${classification}`;
        }
        return 'N/A';
    };

    return (
        <div>
            {(client?.beneficiaries || []).length > 0 ? (
                <div className="space-y-4">
                    {(client?.beneficiaries || []).map(ben => (
                        <GlassPanel 
                            key={ben?.id} 
                            className="p-4 bg-gray-100 dark:bg-black/20 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200"
                            onClick={() => handleOpenViewModal(ben)}
                        >
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                                {ben?.name} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">- {ben?.kinship}</span>
                            </h4>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">CPF:</span> {ben?.cpf || 'N/A'}</p>
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">Nascimento:</span> {formatDate(ben?.dob) || 'N/A'}</p>
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">Idade:</span> {calculateAge(ben?.dob) !== null ? `${calculateAge(ben.dob)} anos` : 'N/A'}</p>
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">Peso:</span> {ben?.weight ? `${ben.weight} kg` : 'N/A'}</p>
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">Altura:</span> {ben?.height ? `${ben.height} cm` : 'N/A'}</p>
                                <p><span className="font-bold text-gray-500 dark:text-gray-400">IMC:</span> {getImcDisplay(ben?.weight, ben?.height)}</p>
                                <p className="col-span-2"><span className="font-bold text-gray-500 dark:text-gray-400">Carteirinha:</span> {ben?.idCardNumber || 'N/A'}</p>
                            </div>
                            {ben.credentials && (ben.credentials.appLogin || ben.credentials.appPassword) && (
                                <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10">
                                    <h5 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">Credenciais do Beneficiário</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                        <DetailItem label="Login do App" value={ben.credentials.appLogin} />
                                        <DetailItem label="Senha do App" value={ben.credentials.appPassword} isPassword />
                                    </div>
                                </div>
                            )}
                        </GlassPanel>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Nenhum beneficiário cadastrado.</p>
            )}

            <BeneficiaryViewModal 
                isOpen={isViewModalOpen} 
                onClose={() => setViewModalOpen(false)} 
                beneficiary={selectedBeneficiary} 
            />
        </div>
    );
}

const HistoryTab = ({ client }) => (<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{(client?.observations || []).length === 0 ? (<p className="text-gray-500 text-center py-8">Nenhum histórico de observações para este cliente.</p>) : ((client?.observations || []).map((obs, index) => (<div key={index} className="bg-gray-100 dark:bg-black/20 p-4 rounded-lg relative pl-8"><HistoryIcon className="h-5 w-5 text-cyan-500 dark:text-cyan-400 absolute top-4 left-2"/><p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{obs.text}</p><p className="text-xs text-gray-500 mt-2 text-right">{obs.authorName} em {formatDateTime(obs.timestamp)}</p></div>)))}</div>);
const CortexTab = ({ client }) => { const [summary, setSummary] = useState(''); const [isLoading, setIsLoading] = useState(false); const { toast } = useToast(); const handleSummarize = async () => { setIsLoading(true); setSummary(''); const result = await Cortex.summarizeHistory(client); if (result.startsWith('Erro:')) { toast({ title: 'Erro do Córtex', description: result, variant: 'destructive' }); } else { setSummary(result); } setIsLoading(false); }; return (<div><div className="flex items-center gap-4"><Button variant="violet" onClick={handleSummarize} disabled={isLoading}><SparklesIcon className="h-4 w-4 mr-2" />{isLoading ? 'Analisando Histórico...' : 'Sumarizar Histórico com IA'}</Button></div>{isLoading && <p className="mt-4 text-cyan-500 dark:text-cyan-400">O Córtex Gemini está processando as informações...</p>}{summary && (<GlassPanel className="mt-6 p-6 bg-gray-100 dark:bg-black/20"><h4 className="font-semibold text-lg text-violet-600 dark:text-violet-300 mb-3">Resumo da IA</h4><div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap prose dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-1">{summary}</div></GlassPanel>)}</div>); };
const CommissionForm = ({ formData, handleChange }) => { const commissionData = formData?.commission || {}; return ( <FormSection title="Dados de Comissionamento" cols={2}> <div><Label>Valor do Contrato (Base para Comissão)</Label><Input type="number" step="0.01" name="commission.contractValue" value={commissionData.contractValue || ''} onChange={handleChange} placeholder="Ex: 7000.00" /></div> <div><Label>Taxa de Comissão (Ex: 1.0 para 100%)</Label><Input type="number" step="0.1" name="commission.commissionRate" value={commissionData.commissionRate || ''} onChange={handleChange} placeholder="Ex: 3.0" /></div> <div><Label>Estrutura de Pagamento</Label><Select name="commission.paymentStructure" value={commissionData.paymentStructure || ''} onChange={handleChange}><option value="">Selecione...</option><option value="à vista">À Vista</option><option value="parcelado">Parcelado</option><option value="antecipado">Antecipado</option><option value="por boleto">Por Boleto</option></Select></div> {commissionData.paymentStructure === 'parcelado' && (<div><Label>Número de Parcelas</Label><Input type="number" name="commission.parcelCount" value={commissionData.parcelCount || ''} onChange={handleChange} /></div>)} <div><Label>Parcelas Já Recebidas</Label><Input type="number" name="commission.receivedInstallments" value={commissionData.receivedInstallments || 0} onChange={handleChange} /></div> <div><Label>Data de Início do Pagamento da Comissão</Label><DateField name="commission.paymentStartDate" value={commissionData.paymentStartDate || ''} onChange={handleChange} /></div> <div className="md:col-span-2"><Label>Status do Pagamento da Comissão</Label><Select name="commission.status" value={commissionData.status || ''} onChange={handleChange}><option value="">Selecione...</option><option value="Pendente">Pendente</option><option value="Pagamento Parcial">Pagamento Parcial</option><option value="Pago">Pago</option><option value="Cancelado">Cancelado</option></Select></div> </FormSection> ); };
const CommissionDetailsTab = ({ client }) => { const commission = client?.commission; if (!commission) return <p className="text-gray-500">Nenhuma informação de comissão cadastrada.</p>; const totalCommission = (commission.contractValue || 0) * (commission.commissionRate || 0); const installmentValue = commission.paymentStructure === 'parcelado' && commission.parcelCount > 0 ? totalCommission / commission.parcelCount : totalCommission; const statusVariant = { 'Pago': 'success', 'Pagamento Parcial': 'warning', 'Pendente': 'secondary', 'Cancelado': 'danger' }[commission.status] || 'default'; return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"> <DetailItem label="Status da Comissão"><Badge variant={statusVariant}>{commission.status || 'N/A'}</Badge></DetailItem> <DetailItem label="Valor Base do Contrato" value={commission.contractValue} isCurrency /> <DetailItem label="Taxa de Comissão" value={`${(commission.commissionRate || 0) * 100}%`} /> <DetailItem label="Comissão Total Estimada" value={totalCommission} isCurrency /> <DetailItem label="Estrutura de Pagamento" value={commission.paymentStructure} /> {commission.paymentStructure === 'parcelado' && ( <> <DetailItem label="Número de Parcelas" value={commission.parcelCount} /> <DetailItem label="Valor por Parcela" value={installmentValue} isCurrency /> <DetailItem label="Parcelas Recebidas" value={commission.receivedInstallments} /> </> )} <DetailItem label="Data de Início dos Pagamentos" value={formatDate(commission.paymentStartDate)} /> </div> ); };
const ContractDetails = ({ contract, clientType }) => {
    const { users } = useData();
    const boletoOwner = users.find(u => u.id === contract.boletoResponsibleId);

    return (
        <>
            {/* DADOS DO CONTRATO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                <DetailItem label="Plano Fechado (Operadora)" value={contract?.planOperator} />
                <DetailItem label="Nº da Proposta" value={contract?.proposalNumber} />
                <DetailItem label="Nº da Apólice/Contrato" value={contract?.policyNumber} />
                <DetailItem label="Categoria" value={contract?.planCategory} />
                <DetailItem label="Acomodação" value={contract?.accommodation} />
                <DetailItem label="Tipo de Plano" value={contract?.planTypes?.join(', ')} />
                <DetailItem label="Tipo de Contrato" value={clientType} />
                <DetailItem label="Valor do Contrato" value={contract?.contractValue} isCurrency />
                <DetailItem label="Valor da Taxa" value={contract?.feeValue} isCurrency />
                <DetailItem label="Forma de Pagamento" value={contract?.paymentMethod} />
                <DetailItem label="Data da Vigência" value={formatDate(contract?.effectiveDate)} />
                <DetailItem label="Vencimento Mensal" value={contract?.monthlyDueDate ? `Dia ${contract.monthlyDueDate}`: 'N/A'} />
                <DetailItem label="Data Envio do Boleto" value={formatDate(contract?.boletoSentDate)} />
                <DetailItem label="Responsável pelo Boleto" value={boletoOwner?.name} />
                <DetailItem label="Renovação de Contrato" value={formatDate(contract?.renewalDate)} />
                <DetailItem label="Status" value={contract?.status} />
                <DetailItem label="Plano Anterior" value={contract?.previousPlan} />
            </div>

            {/* CREDENCIAIS EM LISTA */}
            {(contract.credentialsList || []).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10">
                    <h5 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-2">Credenciais</h5>
                    <div className="space-y-4">
                        {(contract.credentialsList).map(cred => (
                            <GlassPanel key={cred.id} className="p-4 bg-gray-100 dark:bg-black/20">
                                 <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{cred.title}</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                                    <DetailItem label="Email Criado" value={cred.createdEmail} />
                                    <DetailItem label="Senha do Email" value={cred.createdEmailPassword} isPassword />
                                    <DetailItem label="Site do Portal" value={cred.portalSite} isLink />
                                    <DetailItem label="Senha do Portal" value={cred.portalPassword} isPassword />
                                    <DetailItem label="Login do Portal" value={cred.portalLogin} />
                                    <DetailItem label="Usuário do Portal" value={cred.portalUser} />
                                    <DetailItem label="Login do App" value={cred.appLogin} />
                                    <DetailItem label="Senha do App" value={cred.appPassword} isPassword />
                                 </div>
                            </GlassPanel>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
const ContractManager = ({ client, onBack, onEdit }) => { const activeContract = (client.contracts || []).find(c => c.status === 'ativo'); const inactiveContracts = (client.contracts || []).filter(c => c.status !== 'ativo'); return (<div className="space-y-6"> {activeContract ? ( <GlassPanel className="p-6 border-l-4 border-green-500"> <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contrato Ativo</h3> <Badge variant="success">ATIVO</Badge> </div> <ContractDetails contract={activeContract} /> </GlassPanel> ) : ( <EmptyState title="Nenhum Contrato Ativo" message="Não há um contrato marcado como ativo para este cliente." /> )} {inactiveContracts.length > 0 && ( <GlassPanel className="p-6"> <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Histórico de Contratos</h3> <div className="space-y-4"> {inactiveContracts.map(contract => ( <div key={contract.id} className="p-4 bg-gray-100 dark:bg-black/20 rounded-lg"> <div className="flex justify-between items-center mb-2"> <h4 className="font-semibold text-gray-900 dark:text-white">{contract.planOperator} - {formatDate(contract.effectiveDate)}</h4> <Badge variant="secondary">ARQUIVADO</Badge> </div> <ContractDetails contract={contract} /> </div> ))} </div> </GlassPanel> )} <div className="flex justify-end gap-4"> <Button variant="outline" onClick={onBack}><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar para Cliente</Button> <Button onClick={() => onEdit(client, { initialTab: 'contracts' })}><PlusCircleIcon className="h-4 w-4 mr-2" /> Gerenciar Contratos</Button> </div></div>);};

// --- MODAIS ---
const ColumnModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const colorOptions = ['#3B82F6', '#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#D946EF'];

    const handleSave = () => {
        if (title.trim()) {
            onSave({ title: title.trim(), color });
            setTitle('');
            setColor('#3B82F6');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Coluna">
            <div className="space-y-4">
                <div>
                    <Label>Nome da Coluna</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Em Negociação" />
                </div>
                <div>
                    <Label>Cor da Coluna</Label>
                    <div className="flex gap-3 mt-2">
                        {colorOptions.map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} className={cn("w-8 h-8 rounded-full transition-all", color === c ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : 'hover:scale-110')} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Coluna</Button>
            </div>
        </Modal>
    );
};
const LeadModal = ({ isOpen, onClose, onSave, lead }) => { const { user } = useAuth(); const [formState, setFormState] = useState({}); useEffect(() => { if (lead) { setFormState(lead); } else { setFormState({ name: '', company: '', email: '', phone: '', notes: '', status: 'Novo', ownerId: user?.uid, responseDeadlineDays: 3 }); } }, [lead, isOpen, user]); const handleChange = (e) => setFormState(p => ({...p, [e.target.name]: e.target.value})); const handleSubmit = (e) => { e.preventDefault(); onSave(formState); onClose(); }; return (<Modal isOpen={isOpen} onClose={onClose} title={lead ? "Editar Lead" : "Adicionar Novo Lead"}><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Nome do Lead</Label><Input name="name" value={formState.name || ''} onChange={handleChange} required /></div><div><Label>Empresa</Label><Input name="company" value={formState.company || ''} onChange={handleChange} /></div><div><Label>Email</Label><Input type="email" name="email" value={formState.email || ''} onChange={handleChange} /></div><div><Label>Telefone</Label><Input type="tel" name="phone" value={formState.phone || ''} onChange={handleChange} /></div></div><div><Label>Observações (Córtex AI irá analisar)</Label><Textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={4} placeholder="Ex: Indicado por cliente X, precisa fechar com urgência..."/></div><div><Label>Prazo de Resposta (dias)</Label><Input type="number" name="responseDeadlineDays" value={formState.responseDeadlineDays || 3} onChange={handleChange} /></div><div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Lead</Button></div></form></Modal>); };
const CredentialModal = ({ isOpen, onClose, onSave, credential }) => {
    const getInitialState = () => ({
        id: `local_${Date.now()}`,
        title: '',
        createdEmail: '',
        createdEmailPassword: '',
        portalSite: '',
        portalPassword: '',
        portalLogin: '',
        portalUser: '',
        appLogin: '',
        appPassword: ''
    });
    const [formState, setFormState] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormState(credential ? { ...getInitialState(), ...credential } : getInitialState());
        }
    }, [credential, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formState.title.trim()) {
            onSave(formState);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={credential ? "Editar Credencial" : "Adicionar Nova Credencial"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label>Título (Ex: Portal Amil Saúde, Acesso Dental Uni)</Label>
                    <Input name="title" value={formState.title} onChange={handleChange} required placeholder="Identificação da credencial" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Email Criado</Label><Input name="createdEmail" value={formState.createdEmail} onChange={handleChange} /></div>
                    <div><Label>Senha do Email Criado</Label><Input type="text" name="createdEmailPassword" value={formState.createdEmailPassword} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Site do Portal</Label><Input name="portalSite" value={formState.portalSite} onChange={handleChange} placeholder="https://exemplo.com" /></div>
                    <div><Label>Senha do Portal</Label><Input type="text" name="portalPassword" value={formState.portalPassword} onChange={handleChange} /></div>
                    <div><Label>Login do Portal</Label><Input name="portalLogin" value={formState.portalLogin} onChange={handleChange} /></div>
                    <div><Label>Usuário do Portal</Label><Input name="portalUser" value={formState.portalUser} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div><Label>Login do App</Label><Input name="appLogin" value={formState.appLogin} onChange={handleChange} /></div>
                    <div><Label>Senha do App</Label><Input type="text" name="appPassword" value={formState.appPassword} onChange={handleChange} /></div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" onClick={handleSubmit}>Salvar Credencial</Button>
                </div>
            </form>
        </Modal>
    );
};
const AddCollaboratorModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', permissionLevel: 'Corretor', supervisorId: '' });
    const { users } = useData();
    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', email: '', password: '', permissionLevel: 'Corretor', supervisorId: '' });
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Colaborador">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome Completo</Label><Input name="name" onChange={handleChange} required /></div>
                <div><Label>Email</Label><Input type="email" name="email" onChange={handleChange} required /></div>
                <div><Label>Senha</Label><Input type="text" name="password" onChange={handleChange} required /></div>
                <div><Label>Nível de Permissão</Label><Select name="permissionLevel" value={formData.permissionLevel} onChange={handleChange}><option>Corretor</option><option>Supervisor</option><option>Admin</option></Select></div>
                {formData.permissionLevel === 'Corretor' && (<div><Label>Vincular ao Supervisor</Label><Select name="supervisorId" value={formData.supervisorId} onChange={handleChange}><option value="">Nenhum</option>{users.filter(u => u.permissionLevel === 'Supervisor').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>)}
                <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Adicionar</Button></div>
            </form>
        </Modal>
    );
};


const AddPartnerModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Corretor', document: '', email: '', phone: '', notes: '' });
    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', type: 'Corretor', document: '', email: '', phone: '', notes: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Parceiro Externo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome Completo</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Tipo</Label><Select name="type" value={formData.type} onChange={handleChange}><option>Corretor</option><option>Supervisor</option></Select></div>
                    <div><Label>CPF/CNPJ</Label><Input name="document" value={formData.document} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Email</Label><Input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                    <div><Label>Telefone</Label><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></div>
                </div>
                <div><Label>Observações</Label><Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Parceiro</Button>
                </div>
            </form>
        </Modal>
    );
};
const AddOperatorModal = ({ isOpen, onClose, onSave, operator }) => {
    const getInitialState = () => ({ name: '', managerName: '', managerPhone: '', managerEmail: '', portalLink: '' });
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (operator) {
                setFormData(operator);
            } else {
                setFormData(getInitialState());
            }
        }
    }, [operator, isOpen]);
    
    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSave(formData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={operator ? "Editar Operadora" : "Adicionar Nova Operadora"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome da Operadora (Obrigatório)</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t pt-4 mt-4">Dados Opcionais</h4>
                <div><Label>Gerente de Contas</Label><Input name="managerName" value={formData.managerName || ''} onChange={handleChange} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Telefone do Gerente</Label><Input type="tel" name="managerPhone" value={formData.managerPhone || ''} onChange={handleChange} /></div>
                    <div><Label>Email do Gerente</Label><Input type="email" name="managerEmail" value={formData.managerEmail || ''} onChange={handleChange} /></div>
                </div>
                <div><Label>Link do Portal do Corretor</Label><Input name="portalLink" value={formData.portalLink || ''} onChange={handleChange} placeholder="https://..." /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{operator ? 'Salvar Alterações' : 'Adicionar'}</Button>
                </div>
            </form>
        </Modal>
    );
};
const TaskModal = ({ isOpen, onClose, onSave, task }) => {
    const { users, clients, leads } = useData();
    const [formState, setFormState] = useState({});

    // [NOVO] Definindo as cores disponíveis
    const colorOptions = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'];

    useEffect(() => {
        setFormState(
            task 
            ? { ...task }
            // [ALTERAÇÃO] Define uma cor padrão para novas tarefas
            : { title: '', description: '', assignedTo: '', dueDate: '', priority: 'Média', linkedToId: '', linkedToType: '', status: 'Pendente', color: '#6B7280' }
        );
    }, [task, isOpen]);
    
    const handleChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleLinkChange = (e) => {
        const [type, id] = e.target.value.split('-');
        setFormState(p => ({ ...p, linkedToType: type, linkedToId: id }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    const linkedValue = formState.linkedToType && formState.linkedToId ? `${formState.linkedToType}-${formState.linkedToId}` : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarefa" : "Adicionar Nova Tarefa"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>Título</Label>
                    <Input name="title" value={formState.title || ''} onChange={handleChange} required />
                </div>
                <div>
                    <Label>Descrição</Label>
                    <Textarea name="description" value={formState.description || ''} onChange={handleChange} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Responsável</Label>
                        <Select name="assignedTo" value={formState.assignedTo || ''} onChange={handleChange}>
                            <option value="">Ninguém</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label>Data de Vencimento</Label>
                        <DateField name="dueDate" value={formState.dueDate || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Prioridade</Label>
                        <Select name="priority" value={formState.priority || 'Média'} onChange={handleChange}>
                            <option>Baixa</option><option>Média</option><option>Alta</option>
                        </Select>
                    </div>
                    {/* [NOVO] Seletor de Cores */}
                    <div>
                        <Label>Cor do Card</Label>
                        <div className="flex gap-3 mt-2">
                            {colorOptions.map(color => (
                                <button 
                                    key={color} 
                                    type="button" 
                                    onClick={() => setFormState(p => ({ ...p, color: color }))} 
                                    style={{ backgroundColor: color }} 
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all hover:scale-110", 
                                        formState.color === color && 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800'
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <Label>Vincular a Cliente/Lead</Label>
                    <Select value={linkedValue} onChange={handleLinkChange}>
                        <option value="">Nenhum</option>
                        <optgroup label="Clientes">{clients.map(c => <option key={c.id} value={`client-${c.id}`}>{c.general?.companyName || c.general?.holderName}</option>)}</optgroup>
                        <optgroup label="Leads">{leads.map(l => <option key={l.id} value={`lead-${l.id}`}>{l.name}</option>)}</optgroup>
                    </Select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Tarefa</Button>
                </div>
            </form>
        </Modal>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description }) => { if (!isOpen) return null; return (<Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Ação"}><p className="text-gray-700 dark:text-gray-300">{description || "Tem certeza que deseja prosseguir?"}</p><div className="flex justify-end gap-4 mt-6"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="destructive" onClick={onConfirm}>Confirmar</Button></div></Modal>); };
const ContractModal = ({ isOpen, onClose, onSave, contract, clientType }) => {
    const { operators, users } = useData();
    const sortedOperators = useMemo(() => [...operators].sort((a, b) => a.name.localeCompare(b.name)), [operators]);
    
    const getInitialState = () => ({
        id: `local_${Date.now()}`,
        status: 'ativo',
        proposalNumber: '',
        policyNumber: '',
        planOperator: '',
        previousPlan: '',
        planTypes: [],
        planCategory: '',
        accommodation: '',
        contractValue: '',
        feeValue: '',
        paymentMethod: '',
        monthlyDueDate: '',
        effectiveDate: '',
        boletoSentDate: '',
        renewalDate: '',
        boletoResponsibleId: '',
        credentialsList: []
    });

    const [formState, setFormState] = useState(getInitialState());
    const [isCredentialModalOpen, setCredentialModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormState(contract ? { ...getInitialState(), ...contract } : getInitialState());
        }
    }, [contract, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const newTypes = checked ? [...(formState.planTypes || []), value] : (formState.planTypes || []).filter(v => v !== value);
            setFormState(p => ({ ...p, planTypes: newTypes }));
        } else {
            setFormState(p => ({ ...p, [name]: value }));
        }
    };

    const handleSaveCredential = (credentialData) => {
        const newList = [...(formState.credentialsList || [])];
        const index = newList.findIndex(c => c.id === credentialData.id);
        if (index > -1) {
            newList[index] = credentialData;
        } else {
            newList.push(credentialData);
        }
        setFormState(p => ({ ...p, credentialsList: newList }));
        setCredentialModalOpen(false);
        setEditingCredential(null);
    };

    const handleDeleteCredential = (credentialId) => {
        const newList = (formState.credentialsList || []).filter(c => c.id !== credentialId);
        setFormState(p => ({ ...p, credentialsList: newList }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={contract ? "Editar Contrato" : "Adicionar Novo Contrato"} size="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Plano Fechado (Operadora)</Label><Select name="planOperator" value={formState.planOperator || ''} onChange={handleChange}><option value="">Selecione</option>{sortedOperators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}</Select></div>
                    <div><Label>Número da Proposta</Label><Input name="proposalNumber" value={formState.proposalNumber || ''} onChange={handleChange} /></div>
                    <div><Label>Número da Apólice / Contrato</Label><Input name="policyNumber" value={formState.policyNumber || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Categoria do Plano</Label><Input name="planCategory" value={formState.planCategory || ''} onChange={handleChange} /></div>
                    <div><Label>Acomodação</Label><Select name="accommodation" value={formState.accommodation || ''} onChange={handleChange}><option>Enfermaria</option><option>Apartamento</option></Select></div>
                    <div><Label>Tipo de Plano</Label><div className="flex gap-6 mt-2 pt-2 text-gray-800 dark:text-gray-300"><label className="font-bold flex items-center gap-2"><Checkbox name="planTypes" value="Saúde" checked={(formState.planTypes || []).includes('Saúde')} onChange={handleChange} /> Saúde</label><label className="font-bold flex items-center gap-2"><Checkbox name="planTypes" value="Dental" checked={(formState.planTypes || []).includes('Dental')} onChange={handleChange} /> Dental</label></div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Tipo de Plano (da Visão Geral)</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-black/20 rounded-lg">{clientType || 'N/A'}</p></div>
                    <div><Label>Valor do Contrato</Label><Input type="number" name="contractValue" value={formState.contractValue || ''} onChange={handleChange} /></div>
                    <div><Label>Valor da Taxa</Label><Input type="number" name="feeValue" value={formState.feeValue || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Forma de Pagamento</Label><Select name="paymentMethod" value={formState.paymentMethod || ''} onChange={handleChange}><option>Boleto</option><option>Cartão de Crédito</option><option>Débito Automático</option><option>Pix</option></Select></div>
                    <div><Label>Data da Vigência</Label><DateField name="effectiveDate" value={formState.effectiveDate || ''} onChange={handleChange} /></div>
                    <div><Label>Vencimento Mensal (Dia)</Label><Input type="number" name="monthlyDueDate" value={formState.monthlyDueDate || ''} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Data Envio do Boleto</Label><DateField name="boletoSentDate" value={formState.boletoSentDate || ''} onChange={handleChange} /></div>
                    <div><Label>Responsável pelo Boleto</Label><Select name="boletoResponsibleId" value={formState.boletoResponsibleId || ''} onChange={handleChange}><option value="">Selecione...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><Label>Renovação de Contrato</Label><DateField name="renewalDate" value={formState.renewalDate || ''} onChange={handleChange} /></div>
                    <div><Label>Status</Label><Select name="status" value={formState.status || 'ativo'} onChange={handleChange}><option value="ativo">Ativo</option><option value="inativo">Inativo (Histórico)</option></Select></div>
                    <div><Label>Plano Anterior</Label><Input name="previousPlan" value={formState.previousPlan || ''} onChange={handleChange} /></div>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Credenciais</h3>
                        <Button type="button" onClick={() => { setEditingCredential(null); setCredentialModalOpen(true); }}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Credencial</Button>
                    </div>
                    <div className="space-y-2">
                        {(formState.credentialsList || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhuma credencial adicionada.</p> : (formState.credentialsList || []).map(cred => (
                            <div key={cred.id} className="p-3 rounded-lg flex justify-between items-center bg-gray-100 dark:bg-black/20">
                                <div><p className="font-semibold text-gray-900 dark:text-white">{cred.title}</p><p className="text-sm text-gray-600 dark:text-gray-400">{cred.portalSite || cred.createdEmail}</p></div>
                                <div className="flex gap-2"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCredential(cred); setCredentialModalOpen(true); }}><PencilIcon className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteCredential(cred.id)}><Trash2Icon className="h-4 w-4" /></Button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar Contrato</Button></div>
            </form>
            <CredentialModal isOpen={isCredentialModalOpen} onClose={() => setCredentialModalOpen(false)} onSave={handleSaveCredential} credential={editingCredential} />
        </Modal>
    );
};
// --- PÁGINAS PRINCIPAIS ---
const CommissionWizardModal = ({ isOpen, onClose, onSave }) => {
    const { clients, users } = useData();
    const [step, setStep] = useState(1);
    const [commission, setCommission] = useState({ clientId: '', contractId: '', supervisorId: '', brokerId: '', contractValue: 0, commissionRate: '', paymentStructure: 'À Vista', installmentsTotal: 1, firstDueDate: '' });
    const [activeContracts, setActiveContracts] = useState([]);

    const steps = [
        { id: 1, name: 'Cliente', icon: UsersIcon },
        { id: 2, name: 'Contrato', icon: FileTextIcon },
        { id: 3, name: 'Responsáveis', icon: BriefcaseIcon },
        { id: 4, name: 'Valores', icon: DollarSignIcon }
    ];

    useEffect(() => {
        if (commission.clientId) {
            const client = clients.find(c => c.id === commission.clientId);
            const contracts = (client?.contracts || []).filter(c => c.status === 'ativo');
            setActiveContracts(contracts);
            if (contracts.length === 1) {
                setCommission(p => ({ ...p, contractId: contracts[0].id, contractValue: contracts[0].contractValue }));
                setStep(3);
            } else {
                setCommission(p => ({ ...p, contractId: '', contractValue: 0 }));
            }
        } else {
            setActiveContracts([]);
        }
    }, [commission.clientId, clients]);

    const handleSelectContract = (contractId) => {
        const contract = activeContracts.find(c => c.id === contractId);
        setCommission(p => ({ ...p, contractId: contract.id, contractValue: contract.contractValue }));
    };

    const handleSave = () => {
        const client = clients.find(c => c.id === commission.clientId);
        const dataToSave = { ...commission, clientName: client.general.companyName || client.general.holderName, paymentStatus: 'Pendente' };
        onSave(dataToSave);
    };

    const isStepComplete = (stepNum) => {
        if (stepNum === 1) return !!commission.clientId;
        if (stepNum === 2) return !!commission.contractId;
        if (stepNum === 3) return !!commission.brokerId;
        return false;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lançar Nova Comissão" size="5xl">
            <div className="flex border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
                {steps.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", step >= s.id ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500')}>
                                {step > s.id ? <CheckSquareIcon className="w-6 h-6"/> : <s.icon className="w-6 h-6"/>}
                            </div>
                            <p className={cn("mt-2 text-sm font-semibold", step >= s.id ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500")}>{s.name}</p>
                        </div>
                        {index < steps.length - 1 && <div className={cn("flex-1 h-0.5 mt-5 transition-all", step > s.id ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700')} />}
                    </React.Fragment>
                ))}
            </div>

            <div className="min-h-[250px]">
                {step === 1 && (
                    <div>
                        <Label>1. Selecione o Cliente</Label>
                        <Select value={commission.clientId} onChange={(e) => setCommission(p => ({ ...p, clientId: e.target.value }))}>
                            <option value="">Selecione...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.general.companyName || c.general.holderName}</option>)}
                        </Select>
                    </div>
                )}
                 {step === 2 && (
                    <div>
                        <Label>2. Selecione o Contrato Ativo</Label>
                        <Select value={commission.contractId} onChange={(e) => handleSelectContract(e.target.value)}>
                            <option value="">Selecione...</option>
                            {activeContracts.map(c => <option key={c.id} value={c.id}>{c.planOperator} - {formatCurrency(c.contractValue)} - Início: {formatDate(c.effectiveDate)}</option>)}
                        </Select>
                    </div>
                )}
                {step === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>3. Vincule o Corretor</Label>
                            <Select value={commission.brokerId} onChange={(e) => setCommission(p => ({ ...p, brokerId: e.target.value }))}>
                                 <option value="">Selecione...</option>
                                 {users.filter(u => u.permissionLevel === 'Corretor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </Select>
                        </div>
                         <div>
                            <Label>Vincule o Supervisor (Opcional)</Label>
                            <Select value={commission.supervisorId} onChange={(e) => setCommission(p => ({ ...p, supervisorId: e.target.value }))}>
                                 <option value="">Nenhum</option>
                                 {users.filter(u => u.permissionLevel === 'Supervisor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </Select>
                        </div>
                    </div>
                )}
                 {step === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><Label>Valor do Contrato (Base)</Label><p className="h-10 font-bold flex items-center px-3 text-gray-700 dark:text-gray-300">{formatCurrency(commission.contractValue)}</p></div>
                        <div><Label>Taxa de Comissão (%)</Label><Input type="number" value={commission.commissionRate} onChange={(e) => setCommission(p => ({...p, commissionRate: e.target.value}))} placeholder="Ex: 3.5"/></div>
                         <div><Label>Forma de Pagamento</Label><Select value={commission.paymentStructure} onChange={(e) => setCommission(p => ({...p, paymentStructure: e.target.value}))}><option>À Vista</option><option>Parcelado</option></Select></div>
                        {commission.paymentStructure === 'Parcelado' && (<div><Label>Nº de Parcelas</Label><Input type="number" value={commission.installmentsTotal} onChange={(e) => setCommission(p => ({...p, installmentsTotal: e.target.value}))}/></div>)}
                        <div><Label>Data do 1º Vencimento</Label><DateField value={commission.firstDueDate} onChange={(e) => setCommission(p => ({...p, firstDueDate: e.target.value}))}/></div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Voltar</Button>
                {step < 4 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!isStepComplete(step)}>Avançar</Button>
                ) : (
                    <Button onClick={handleSave} variant="violet"><SparklesIcon className="h-4 w-4 mr-2"/>Salvar Comissão</Button>
                )}
            </div>
        </Modal>
    )
};

function CommissionsPage() {
    const { commissions, addCommission, updateCommission, deleteCommission, loading, users } = useData();
    const { toast } = useToast();
    const [isWizardOpen, setWizardOpen] = useState(false);

    const handleSave = async (commissionData) => {
        const result = await addCommission(commissionData);
        if (result) {
            toast({ title: "Sucesso!", description: `Comissão para ${result.clientName} foi lançada.` });
            setWizardOpen(false);
        } else {
            toast({ title: "Erro", description: "Não foi possível salvar a comissão.", variant: 'destructive' });
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Comissões</h2>
                <Button onClick={() => setWizardOpen(true)} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2" /> Lançar Nova Comissão</Button>
            </div>
            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>
                                {['Cliente', 'Corretor', 'Valor Comissão', 'Status', 'Vencimento'].map(h => <th key={h} scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {loading && commissions.length === 0 ? (Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)) : 
                            commissions.length > 0 ? (commissions.map(com => {
                                const broker = users.find(u => u.id === com.brokerId);
                                const totalCommission = (com.contractValue || 0) * ((com.commissionRate || 0) / 100);
                                return (
                                    <tr key={com.id} className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5 cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{com.clientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{broker?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-white">{formatCurrency(totalCommission)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><Badge>{com.paymentStatus}</Badge></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(com.firstDueDate)}</td>
                                    </tr>
                                )
                            })) : (
                                <tr><td colSpan="5"><EmptyState title="Nenhuma Comissão Lançada" message="Comece lançando sua primeira comissão para vê-la aqui." actionText="Lançar Nova Comissão" onAction={() => setWizardOpen(true)} /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassPanel>
            <CommissionWizardModal isOpen={isWizardOpen} onClose={() => setWizardOpen(false)} onSave={handleSave} />
        </div>
    );
}
function LoginPage() { const { login } = useAuth(); const { toast } = useToast(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); const result = await login(email, password); if (!result.success) { toast({ title: "Falha na Autenticação", description: "Credenciais inválidas.", variant: "destructive" }); } setLoading(false); }; return (<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0D1117] p-4"><GlassPanel className="w-full max-w-sm p-8"><h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">OLYMPUS X</h1><p className="text-center text-gray-500 dark:text-gray-400 mb-8">Acesso ao Ecossistema</p><form onSubmit={handleSubmit} className="space-y-6"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" /></div><div><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" /></div><Button type="submit" variant="default" className="w-full !h-12 !text-base" disabled={loading}>{loading ? 'Autenticando...' : 'Entrar'}</Button></form></GlassPanel></div>); }
function ClientForm({ client, onSave, onCancel, isConversion = false, leadData = null, initialTab = 'general' }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isContractModalOpen, setContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const { addClient, updateClient, loading } = useData();
    const { toast } = useToast();
    const [titularInfo, setTitularInfo] = useState({ age: null, imc: { value: null, classification: '' }});
    const [activeTab, setActiveTab] = useState(initialTab || 'general');

    const handleBeneficiariesChange = useCallback((newBeneficiariesArray) => {
        setFormData(currentFormData => ({ ...currentFormData, beneficiaries: newBeneficiariesArray }));
    }, []);

    useEffect(() => {
        const defaultData = {
            general: { status: 'Ativo', clientType: 'PME', contactRole: '', isResponsibleBeneficiary: 'Sim' },
            address: { cep: '', street: '', complement: '', neighborhood: '', city: '', state: '' },
            contracts: [],
            internal: {},
            beneficiaries: [],
            observations: [],
            commission: {},
            boletoExceptions: []
        };
        if (isConversion && leadData) {
            const conversionData = {
                ...defaultData,
                general: { ...defaultData.general, companyName: leadData.company || '', holderName: leadData.name, email: leadData.email, phone: leadData.phone },
                internal: { brokerId: leadData.ownerId },
                observations: leadData.notes ? [{ text: `Nota original do Lead: ${leadData.notes}`, authorId: leadData.ownerId, authorName: 'Sistema', timestamp: new Date() }] : []
            };
            setFormData(conversionData);
        } else if (client) {
            setFormData({ ...defaultData, ...JSON.parse(JSON.stringify(client)) });
        } else {
            setFormData(defaultData);
        }
        setErrors({});
    }, [client, isConversion, leadData]);
    
    useEffect(() => {
        const { dob, weight, height } = formData.general || {};
        const age = dob ? calculateAge(dob) : null;
        let imc = { value: null, classification: ''};
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        if (weightNum > 0 && heightNum > 0) {
            const heightInMeters = heightNum / 100;
            const imcValue = weightNum / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            imc = { value: imcValue.toFixed(2), classification };
        }
        setTitularInfo({ age, imc });
    }, [formData.general?.dob, formData.general?.weight, formData.general?.height]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(p => {
                const newState = { ...p };
                let current = newState;
                keys.slice(0, -1).forEach(key => {
                    current[key] = { ...current[key] };
                    current = current[key];
                });
                current[keys[keys.length - 1]] = value;
                return newState;
            });
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };
    
    const handleSaveContract = (contractData) => {
        const newContracts = [...(formData.contracts || [])];
        const index = newContracts.findIndex(c => c.id === contractData.id);
        if (contractData.status === 'ativo') {
            newContracts.forEach(c => { if(c.id !== contractData.id) c.status = 'inativo' });
        }
        if (index > -1) {
            newContracts[index] = contractData;
        } else {
            newContracts.push(contractData);
        }
        setFormData(p => ({...p, contracts: newContracts}));
        setContractModalOpen(false);
        setEditingContract(null);
    };
    
    const handleDeleteContract = (contractId) => {
        const newContracts = (formData.contracts || []).filter(c => c.id !== contractId);
        setFormData(p => ({...p, contracts: newContracts}));
    };
    
    const validateForm = () => {
        const newErrors = {};
        const { general } = formData;
        if (general?.cnpj && !validateCNPJ(general.cnpj)) {
            newErrors.cnpj = "CNPJ inválido.";
        }
        if (general?.responsibleCpf && !validateCPF(general.responsibleCpf)) {
            newErrors.responsibleCpf = "CPF inválido.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({ title: "Verifique os campos", description: "Há campos com dados inválidos.", variant: 'destructive' });
            return;
        }
        const { id, ...dataToSave } = formData;
        const isEditing = !!id;
        const result = isEditing ? await updateClient(id, dataToSave) : await addClient(dataToSave);
        if (result) {
            onSave(result, leadData?.id);
        } else {
            toast({ title: "Erro", description: `Não foi possível salvar cliente.`, variant: 'destructive' });
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{isConversion ? `Converter Lead: ${leadData?.name || ''}` : (formData.id ? 'Editar Cliente' : 'Adicionar Novo Cliente')}</h2>
            <form onSubmit={handleSubmit}>
                <GlassPanel className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="general">Visão Geral</TabsTrigger>
                            <TabsTrigger value="contracts">Contratos</TabsTrigger>
                            <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                            <TabsTrigger value="internal">Dados Internos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralInfoForm formData={formData} handleChange={handleChange} errors={errors} />
                        </TabsContent>
                        <TabsContent value="contracts">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Gestão de Contratos</h3>
                                <Button type="button" onClick={() => { setEditingContract(null); setContractModalOpen(true); }}><PlusCircleIcon className="h-4 w-4 mr-2" />Novo Contrato</Button>
                            </div>
                            <div className="space-y-4">
                                {(formData.contracts || []).length === 0 ? <p className="text-gray-500 text-center py-4">Nenhum contrato adicionado.</p> : (formData.contracts || []).map(contract => (
                                    <div key={contract.id} className={cn("p-4 rounded-lg flex justify-between items-center", contract.status === 'ativo' ? 'bg-green-100/70 dark:bg-green-900/40 border-l-4 border-green-500' : 'bg-gray-100 dark:bg-black/20')}>
                                        <div><p className="font-semibold">{contract.planOperator || 'Novo Contrato'}</p><p className="text-sm text-gray-600 dark:text-gray-400">{contract.policyNumber} - Início: {formatDate(contract.effectiveDate)}</p></div>
                                        <div className="flex gap-2"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingContract(contract); setContractModalOpen(true); }}><PencilIcon className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDeleteContract(contract.id)}><Trash2Icon className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="beneficiaries">
                            <BeneficiariesForm beneficiaries={formData.beneficiaries || []} setBeneficiaries={handleBeneficiariesChange} toast={toast} />
                        </TabsContent>
                        <TabsContent value="history"><HistoryForm observations={formData.observations || []} setObservations={(o) => setFormData(p => ({...p, observations: o}))} /></TabsContent>
                        <TabsContent value="internal"><InternalDataForm formData={formData} handleChange={handleChange} /></TabsContent>
                    </Tabs>
                </GlassPanel>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (isConversion ? 'Converter em Cliente' : 'Salvar Cliente')}</Button>
                </div>
            </form>
            <ContractModal isOpen={isContractModalOpen} onClose={() => setContractModalOpen(false)} onSave={handleSaveContract} contract={editingContract} clientType={formData?.general?.clientType} />
        </div>
    );
}
function ClientsList({ onClientSelect, onAddClient }) {
    // [ALTERAÇÃO]: Adicionado "users" e "useToast" para a função de exportação.
    const { clients, loading, operators, users } = useData();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', operator: '', month: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false); // [NOVO] Estado para o botão
    const itemsPerPage = 10;
    const handleFilterChange = (e) => { setCurrentPage(1); setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    
    const filteredClients = useMemo(() => {
        return clients
            .filter(client => {
                const searchMatch = (`${client?.general?.companyName || ''} ${client?.general?.holderName || ''} ${client?.general?.email || ''}`).toLowerCase().includes(searchTerm.toLowerCase());
                const statusMatch = filters.status ? client?.general?.status === filters.status : true;
                const operatorMatch = filters.operator ? (client?.contracts || []).some(c => c.planOperator === filters.operator) : true;
                const monthMatch = filters.month ? (client?.contracts || []).some(c => c.effectiveDate?.startsWith(filters.month)) : true;
                return searchMatch && statusMatch && operatorMatch && monthMatch;
            })
            .sort((a, b) => (a.general?.companyName || a.general?.holderName || '').localeCompare(b.general?.companyName || b.general?.holderName || ''));
    }, [clients, searchTerm, filters]);

    // [NOVO] Função para exportar os clientes da lista filtrada
    const handleExportFilteredClients = async () => {
    if (filteredClients.length === 0) {
        toast({ title: "Nenhum cliente", description: "A lista de clientes para exportar está vazia.", variant: "destructive" });
        return;
    }

    setIsExporting(true);
    toast({ title: "Iniciando exportação...", description: `Preparando dados de ${filteredClients.length} cliente(s).` });

    const zip = new JSZip();
    const getBrokerName = (id) => (users.find(u => u.id === id)?.name || 'N/A');
    
    const toCsv = (headers, rows) => {
        let csvContent = '\uFEFF';
        csvContent += headers.join(';') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
        });
        return csvContent;
    };

    const allClientRows = [];
    const allContractRows = [];
    const allBeneficiaryRows = [];

    // [ALTERAÇÃO] Cabeçalhos atualizados para incluir todos os novos campos
    const clientHeaders = ["ID Cliente", "Tipo de Plano", "Status", "Nome Empresa/Titular", "CNPJ/CPF Titular", "Nome Responsável", "CPF Responsável", "Vínculo do Titular (PF)", "Profissão (Adesão)", "Sindicato Filiado (Adesão)", "Administradora (Adesão)", "Responsável é Beneficiário?", "Email Responsável", "Telefone Responsável", "Nome Contato", "Cargo Contato", "Telefone Contato", "CEP", "Logradouro", "Complemento", "Bairro", "Cidade", "Estado", "Corretor Responsável", "Supervisor"];
    const contractHeaders = ["ID Contrato", "ID Cliente", "Status", "Operadora", "Nº Proposta", "Nº Apólice", "Categoria", "Acomodação", "Tipos de Plano", "Valor", "Taxa", "Pagamento", "Vencimento Mensal", "Data Vigência", "Data Envio Boleto", "Data Renovação", "Responsável Boleto"];
    const beneficiaryHeaders = ["ID Beneficiário", "ID Cliente", "Nome", "CPF", "Nascimento", "Parentesco", "Nº Carteirinha"];

    for (const client of filteredClients) {
        // [ALTERAÇÃO] Lógica para preencher os campos dinâmicos
        allClientRows.push([
            client.id,
            client.general?.clientType,
            client.general?.status,
            client.general?.clientType === 'PME' ? client.general?.companyName : client.general?.holderName,
            client.general?.clientType === 'PME' ? client.general?.cnpj : client.general?.holderCpf,
            client.general?.responsibleName,
            client.general?.responsibleCpf,
            client.general?.kinship, // Campo de Pessoa Física
            client.general?.profession, // Campo de Adesão
            client.general?.union, // Campo de Adesão
            client.general?.administrator, // Campo de Adesão
            client.general?.responsibleStatus,
            client.general?.email,
            client.general?.phone, // Telefone Responsável
            client.general?.contactName,
            client.general?.contactRole, // Apenas PME
            client.general?.contactPhone,
            client.address?.cep, client.address?.street, client.address?.complement, client.address?.neighborhood, client.address?.city, client.address?.state, 
            getBrokerName(client.internal?.brokerId), 
            getBrokerName(client.internal?.supervisorId)
        ]);

        (client.contracts || []).forEach(con => {
            allContractRows.push([
                con.id, client.id, con.status, con.planOperator, con.proposalNumber, con.policyNumber, con.planCategory, con.accommodation, (con.planTypes || []).join('; '), con.contractValue, con.feeValue, con.paymentMethod, con.monthlyDueDate, formatDate(con.effectiveDate), formatDate(con.boletoSentDate), formatDate(con.renewalDate), getBrokerName(con.boletoResponsibleId)
            ]);
        });

        (client.beneficiaries || []).forEach(ben => {
            allBeneficiaryRows.push([
                ben.id, client.id, ben.name, ben.cpf, formatDate(ben.dob), ben.kinship, ben.idCardNumber
            ]);
        });
    }

    zip.file("dados_gerais_clientes.csv", toCsv(clientHeaders, allClientRows));
    if (allContractRows.length > 0) zip.file("contratos_clientes.csv", toCsv(contractHeaders, allContractRows));
    if (allBeneficiaryRows.length > 0) zip.file("beneficiarios_clientes.csv", toCsv(beneficiaryHeaders, allBeneficiaryRows));
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `exportacao_clientes.zip`);
    setIsExporting(false);
};
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const currentClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const renderTableRows = () => { if (loading && clients.length === 0) return Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />); if (currentClients.length > 0) { return currentClients.map((client) => { const activeContract = client.contracts?.find(c => c.status === 'ativo'); return (<tr key={client.id} onClick={() => onClientSelect(client.id)} className="hover:bg-gray-100/50 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors duration-200"><td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</div><div className="text-sm text-gray-500 dark:text-gray-400">{client?.general?.email}</div></td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${client?.general?.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>{client?.general?.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{activeContract?.planOperator || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(activeContract?.effectiveDate) || 'N/A'}</td></tr>) }); } return <tr><td colSpan="4"><EmptyState title="Nenhum Cliente Encontrado" message="Ajuste os filtros ou adicione um novo cliente." actionText="Adicionar Novo Cliente" onAction={onAddClient} /></td></tr>; };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                <div className="flex gap-2 flex-wrap">
                    {/* [NOVO] Botão de exportação em massa */}
                    <Button variant="outline" onClick={handleExportFilteredClients} disabled={isExporting || filteredClients.length === 0}>
                        {isExporting ? 'Exportando...' : <><DownloadIcon className="h-4 w-4 mr-2" />Exportar Lista ({filteredClients.length})</>}
                    </Button>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <FilterIcon className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                    <Button onClick={onAddClient}>
                        <PlusCircleIcon className="h-5 w-5 mr-2" /> Adicionar Cliente
                    </Button>
                </div>
            </div>
            {showFilters && (
                <GlassPanel className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input placeholder="Procurar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">Todos Status</option>
                            <option>Ativo</option>
                            <option>Inativo</option>
                        </Select>
                        <Select name="operator" value={filters.operator} onChange={handleFilterChange}>
                            <option value="">Todas Operadoras</option>
                            {operators.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                        </Select>
                        <Input type="month" name="month" value={filters.month} onChange={handleFilterChange} />
                    </div>
                </GlassPanel>
            )}
            <GlassPanel>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>{['Nome', 'Status', 'Plano Ativo', 'Vigência Ativa'].map(h => <th key={h} scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">{renderTableRows()}</tbody>
                    </table>
                </div>
            </GlassPanel>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} variant="outline">Anterior</Button>
                    <span className="text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
                    <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} variant="outline">Próxima</Button>
                </div>
            )}
        </div>
    );
};

function ClientDetails({ client, onBack, onEdit }) {
    const { toast } = useToast();
    const { deleteClient, users } = useData();
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState('general');
    const { preferences } = usePreferences();
    const [isExporting, setIsExporting] = useState(false);

    if (!client) return null;

    const handleDelete = async () => {
        const clientName = client?.general?.companyName || client?.general?.holderName;
        try {
            await confirm({ title: `Excluir ${clientName}?`, description: "Todos os dados associados serão perdidos permanentemente." });
            const success = await deleteClient(client.id, clientName);
            if (success) {
                toast({ title: "Cliente Excluído", description: `${clientName} foi removido.` });
                onBack();
            } else {
                toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" });
            }
        } catch (e) {}
    };

    const handleExportSingleClient = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    const clientName = (client.general?.companyName || client.general?.holderName || 'cliente').replace(/ /g, '_');

    const getBrokerName = (id) => (users.find(u => u.id === id)?.name || 'N/A');
    
    const toCsv = (headers, rows) => {
        let csvContent = '\uFEFF';
        csvContent += headers.join(';') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
        });
        return csvContent;
    };

    // 1. DADOS GERAIS - [ALTERAÇÃO]
    const clientHeaders = ["ID Cliente", "Tipo de Plano", "Status", "Nome Empresa/Titular", "CNPJ/CPF Titular", "Nome Responsável", "CPF Responsável", "Vínculo do Titular (PF)", "Profissão (Adesão)", "Sindicato Filiado (Adesão)", "Administradora (Adesão)", "Responsável é Beneficiário?", "Email Responsável", "Telefone Responsável", "Nome Contato", "Cargo Contato", "Telefone Contato", "CEP", "Logradouro", "Complemento", "Bairro", "Cidade", "Estado", "Corretor Responsável", "Supervisor"];
    const clientRows = [[
        client.id,
        client.general?.clientType,
        client.general?.status,
        client.general?.clientType === 'PME' ? client.general?.companyName : client.general?.holderName,
        client.general?.clientType === 'PME' ? client.general?.cnpj : client.general?.holderCpf,
        client.general?.responsibleName,
        client.general?.responsibleCpf,
        client.general?.kinship,
        client.general?.profession,
        client.general?.union,
        client.general?.administrator,
        client.general?.responsibleStatus,
        client.general?.email,
        client.general?.phone,
        client.general?.contactName,
        client.general?.contactRole,
        client.general?.contactPhone,
        client.address?.cep, client.address?.street, client.address?.complement, client.address?.neighborhood, client.address?.city, client.address?.state, 
        getBrokerName(client.internal?.brokerId), 
        getBrokerName(client.internal?.supervisorId)
    ]];
    zip.file("cliente_visao_geral.csv", toCsv(clientHeaders, clientRows));

    // 2. CONTRATOS (sem alterações)
    if (client.contracts && client.contracts.length > 0) {
        const contractHeaders = ["ID Contrato", "ID Cliente", "Status", "Operadora", "Nº Proposta", "Nº Apólice", "Categoria", "Acomodação", "Tipos de Plano", "Valor", "Taxa", "Pagamento", "Vencimento Mensal", "Data Vigência", "Data Envio Boleto", "Data Renovação", "Responsável Boleto"];
        const contractRows = client.contracts.map(con => [
            con.id, client.id, con.status, con.planOperator, con.proposalNumber, con.policyNumber, con.planCategory, con.accommodation, (con.planTypes || []).join('; '), con.contractValue, con.feeValue, con.paymentMethod, con.monthlyDueDate, formatDate(con.effectiveDate), formatDate(con.boletoSentDate), formatDate(con.renewalDate), getBrokerName(con.boletoResponsibleId)
        ]);
        zip.file("contratos.csv", toCsv(contractHeaders, contractRows));
    }

    // 3. BENEFICIÁRIOS (sem alterações)
    if (client.beneficiaries && client.beneficiaries.length > 0) {
        const beneficiaryHeaders = ["ID Beneficiário", "ID Cliente", "Nome", "CPF", "Nascimento", "Parentesco", "Peso (kg)", "Altura (cm)", "Nº Carteirinha"];
        const beneficiaryRows = client.beneficiaries.map(ben => [
            ben.id, client.id, ben.name, ben.cpf, formatDate(ben.dob), ben.kinship, ben.weight, ben.height, ben.idCardNumber
        ]);
        zip.file("beneficiarios.csv", toCsv(beneficiaryHeaders, beneficiaryRows));
    }

    // 4. HISTÓRICO (sem alterações)
    if (client.observations && client.observations.length > 0) {
        const historyHeaders = ["ID Cliente", "Data", "Autor", "Observação"];
        const historyRows = client.observations.map(obs => [
            client.id, formatDateTime(obs.timestamp), obs.authorName, obs.text
        ]);
        zip.file("historico.csv", toCsv(historyHeaders, historyRows));
    }
    
    // 5. CREDENCIAIS (sem alterações)
    const credentialRows = [];
    (client.contracts || []).forEach(con => {
        (con.credentialsList || []).forEach(cred => {
            credentialRows.push([
                cred.id, con.id, client.id, cred.title, cred.createdEmail, cred.portalSite, cred.portalLogin, cred.portalUser, cred.appLogin
            ]);
        });
    });
    if (credentialRows.length > 0) {
        const credentialHeaders = ["ID Credencial", "ID Contrato", "ID Cliente", "Título", "Email Criado", "Site do Portal", "Login Portal", "Usuário Portal", "Login App"];
        zip.file("credenciais.csv", toCsv(credentialHeaders, credentialRows));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `export_${clientName}.zip`);
    setIsExporting(false);
};
    
    const OverviewTab = ({ client }) => {
    const clientType = client?.general?.clientType;

    return (
        <>
            {/* --- Layout para PME --- */}
            {clientType === 'PME' && (
                <>
                    <FormSection title="Dados da Empresa">
                        <DetailItem label="Tipo de Plano" value={clientType} />
                        <DetailItem label="Nome da Empresa" value={client.general?.companyName} />
                        <DetailItem label="Status" value={client.general?.status} />
                        <DetailItem label="CNPJ" value={client.general?.cnpj} />
                        <DetailItem label="Nome do Responsável" value={client.general?.responsibleName} />
                        <DetailItem label="CPF do Responsável" value={client.general?.responsibleCpf} />
                    </FormSection>
                    <FormSection title="Contato">
                        <DetailItem label="Responsável" value={client.general?.responsibleStatus} />
                        <DetailItem label="Email Responsável" value={client.general?.email} />
                        <DetailItem label="Telefone Responsável" value={client.general?.phone} />
                        <DetailItem label="Nome do Contato" value={client.general?.contactName} />
                        <DetailItem label="Cargo do Contato" value={client.general?.contactRole} />
                        <DetailItem label="Telefone do Contato" value={client.general?.contactPhone} />
                    </FormSection>
                </>
            )}

            {/* --- Layout para Pessoa Física --- */}
            {clientType === 'Pessoa Física' && (
                <>
                    <FormSection title="Dados do Titular">
                        <DetailItem label="Tipo de Plano" value={clientType} />
                        <DetailItem label="Nome Titular" value={client.general?.holderName} />
                        <DetailItem label="Status" value={client.general?.status} />
                        <DetailItem label="CPF Titular" value={client.general?.holderCpf} />
                        <DetailItem label="Nome do Responsável" value={client.general?.responsibleName} />
                        <DetailItem label="CPF do Responsável" value={client.general?.responsibleCpf} />
                    </FormSection>
                    <FormSection title="Contato e Vínculo">
                        <DetailItem label="Responsável" value={client.general?.responsibleStatus} />
                        <DetailItem label="Email Responsável" value={client.general?.email} />
                        <DetailItem label="Telefone Responsável" value={client.general?.phone} />
                        <DetailItem label="Nome Contato" value={client.general?.contactName} />
                        <DetailItem label="Telefone Contato" value={client.general?.contactPhone} />
                        <DetailItem label="Vínculo do Titular" value={client.general?.kinship} />
                    </FormSection>
                </>
            )}

            {/* --- Layout para Adesão --- */}
            {clientType === 'Adesão' && (
                <>
                     <FormSection title="Dados do Titular">
                        <DetailItem label="Tipo de Plano" value={clientType} />
                        <DetailItem label="Nome Titular" value={client.general?.holderName} />
                        <DetailItem label="Status" value={client.general?.status} />
                        <DetailItem label="CPF Titular" value={client.general?.holderCpf} />
                        <DetailItem label="Nome do Responsável" value={client.general?.responsibleName} />
                        <DetailItem label="CPF do Responsável" value={client.general?.responsibleCpf} />
                    </FormSection>
                    <FormSection title="Dados de Adesão e Contato">
                        <DetailItem label="Profissão" value={client.general?.profession} />
                        <DetailItem label="Sindicato Filiado" value={client.general?.union} />
                        <DetailItem label="Administradora" value={client.general?.administrator} />
                        <DetailItem label="Email Responsável" value={client.general?.email} />
                        <DetailItem label="Nome Contato" value={client.general?.contactName} />
                        <DetailItem label="Telefone Contato" value={client.general?.contactPhone} />
                    </FormSection>
                </>
            )}

            {/* Seção de Endereço (Comum a todos) */}
            <FormSection title="Endereço">
                <DetailItem label="CEP" value={client.address?.cep} />
                <DetailItem label="Logradouro" value={client.address?.street} />
                <DetailItem label="Complemento" value={client.address?.complement} />
                <DetailItem label="Bairro" value={client.address?.neighborhood} />
                <DetailItem label="Cidade" value={client.address?.city} />
                <DetailItem label="Estado" value={client.address?.state} />
            </FormSection>
        </>
    );
};
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"><ChevronLeftIcon className="h-4 w-4 mr-1" /> Voltar</button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{client?.general?.companyName || client?.general?.holderName}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportSingleClient} disabled={isExporting}>
                        {isExporting ? 'Exportando...' : <><DownloadIcon className="h-4 w-4 mr-2" />Exportar</>}
                    </Button>
                    <Button variant="outline" onClick={() => onEdit(client, { initialTab: activeTab })}><PencilIcon className="h-4 w-4 mr-2" />Editar</Button>
                    <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="h-4 w-4 mr-2" />Excluir</Button>
                </div>
            </div>
            <GlassPanel className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="general">Visão Geral</TabsTrigger>
                        <TabsTrigger value="contracts">Contratos</TabsTrigger>
                        <TabsTrigger value="beneficiaries">Beneficiários</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                        <TabsTrigger value="internal">Interno</TabsTrigger>
                        <TabsTrigger value="cortex">Córtex AI</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general"><OverviewTab client={client} /></TabsContent>
                    <TabsContent value="contracts"><ContractManager client={client} onBack={onBack} onEdit={onEdit} /></TabsContent>
                    <TabsContent value="beneficiaries"><BeneficiariesTab client={client} /></TabsContent>
                    <TabsContent value="history"><HistoryTab client={client} /></TabsContent>
                    <TabsContent value="internal"><InternalTab client={client} /></TabsContent>
                    <TabsContent value="cortex"><CortexTab client={client} /></TabsContent>
                </Tabs>
            </GlassPanel>
        </div>
    );
};
function CorporatePage({ onNavigate }) {
    const { users, operators, addOperator, updateOperator, deleteOperator, companyProfile, updateCompanyProfile, partners, addPartner, deletePartner, clients, leads, tasks } = useData();
    const { user, addUser, deleteUser } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isOperatorModalOpen, setOperatorModalOpen] = useState(false);
    const [isPartnerModalOpen, setPartnerModalOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState(null);
    const [companyData, setCompanyData] = useState({});
    const [expandedOperatorId, setExpandedOperatorId] = useState(null);

    const sortedUsers = useMemo(() => [...users].sort((a,b) => (a.name || '').localeCompare(b.name || '')), [users]);
    const sortedPartners = useMemo(() => [...partners].sort((a,b) => (a.name || '').localeCompare(b.name || '')), [partners]);
    const sortedOperators = useMemo(() => [...operators].sort((a,b) => (a.name || '').localeCompare(b.name || '')), [operators]);

    useEffect(() => { setCompanyData(companyProfile || {}); }, [companyProfile]);
    
    const handleCompanyDataChange = (e) => setCompanyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSaveCompanyProfile = async () => { const success = await updateCompanyProfile(companyData); toast({ title: success ? "Sucesso" : "Erro", description: success ? "Dados da empresa atualizados." : "Não foi possível salvar os dados.", variant: success ? 'default' : 'destructive' }); };
    
    const handleDeleteOperator = async (operator) => { try { await confirm({ title: `Remover ${operator.name}?` }); const success = await deleteOperator(operator.id, operator.name); toast({ title: success ? "Removida" : "Erro", description: `${operator.name} foi ${success ? 'removida' : 'impossível de remover'}.`}); } catch (e) {} };
    const handleDeleteUser = async (userToDelete) => { if (userToDelete.id === user.id) { toast({ title: "Ação Inválida", description: "Não pode excluir a própria conta.", variant: "destructive" }); return; } try { await confirm({ title: `Excluir ${userToDelete.name}?` }); const success = await deleteUser(userToDelete.id); toast({ title: success ? "Removido" : "Erro", description: `${userToDelete.name} foi ${success ? 'removido' : 'impossível de remover'}.` }); } catch (e) {} };
    const handleDeletePartner = async (partner) => { try { await confirm({ title: `Remover ${partner.name}?` }); const success = await deletePartner(partner.id, partner.name); toast({ title: success ? "Removido" : "Erro", description: `${partner.name} foi ${success ? 'removido' : 'impossível de remover'}.` }); } catch (e) {} };
    
    const handleSaveOperator = async (operatorData) => {
        const isEditing = !!operatorData.id;
        const success = isEditing ? await updateOperator(operatorData.id, operatorData) : await addOperator(operatorData);
        toast({ title: success ? "Sucesso!" : "Erro", description: `Operadora ${operatorData.name} foi ${isEditing ? 'atualizada' : 'adicionada'}.` });
        if (success) {
            setOperatorModalOpen(false);
            setEditingOperator(null);
        }
    };

    const handleOpenOperatorModal = (operator = null) => {
        setEditingOperator(operator);
        setOperatorModalOpen(true);
    };

    const handleAddUser = async (newUserData) => { const result = await addUser(newUserData); toast({ title: result.success ? "Adicionado" : "Erro", description: result.success ? `${newUserData.name} foi adicionado.` : `Erro: ${result.code}`, variant: result.success ? 'default' : 'destructive' }); if (result.success) setUserModalOpen(false); };
    const handleAddPartner = async (newPartnerData) => { const success = await addPartner(newPartnerData); toast({ title: success ? "Adicionado" : "Erro", description: `${newPartnerData.name} foi adicionado como parceiro.` }); if (success) setPartnerModalOpen(false); };

    return (
    <div className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestão Corporativa</h2>
        <GlassPanel className="p-6">
            <Tabs defaultValue="team">
                <TabsList>
                    <TabsTrigger value="team">Equipe Interna (Usuários)</TabsTrigger>
                    <TabsTrigger value="partners">Parceiros Externos</TabsTrigger>
                    <TabsTrigger value="operators">Operadoras</TabsTrigger>
                    <TabsTrigger value="company">Minha Empresa</TabsTrigger>
                </TabsList>
                
                <TabsContent value="team">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Usuários do Sistema</h3><Button onClick={() => setUserModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Usuário</Button></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sortedUsers.map(u => {
                            const clientCount = clients.filter(c => c.internal?.brokerId === u.id).length;
                            const leadCount = leads.filter(l => l.ownerId === u.id).length;
                            const taskCount = tasks.filter(t => t.assignedTo === u.id && t.status !== 'Concluída').length;
                            return (
                                <GlassPanel key={u.id} className="p-4 flex items-start gap-4">
                                    <Avatar className="h-12 w-12 text-xl mt-1"><AvatarFallback>{u?.name?.[0] || 'S'}</AvatarFallback></Avatar>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{u?.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{u?.email} - <span className="font-semibold">{u?.permissionLevel}</span></p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleDeleteUser(u)} disabled={u.id === user.id}><Trash2Icon className="h-4 w-4" /></Button>
                                        </div>
                                        <div className="flex gap-4 mt-3 text-sm border-t border-gray-200 dark:border-white/10 pt-3">
                                            <span title="Clientes na Carteira"><strong>{clientCount}</strong> Clientes</span>
                                            <span title="Leads Ativos"><strong>{leadCount}</strong> Leads</span>
                                            <span title="Tarefas Pendentes"><strong>{taskCount}</strong> Tarefas</span>
                                        </div>
                                    </div>
                                </GlassPanel>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="partners">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Parceiros Comerciais (sem acesso)</h3><Button onClick={() => setPartnerModalOpen(true)}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar Parceiro</Button></div>
                    <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-3">
                        {sortedPartners.length === 0 && <p className="text-sm text-center text-gray-500 py-4">Nenhum parceiro externo cadastrado.</p>}
                        {sortedPartners.map(p => (<div key={p.id} className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md"><div><p className="font-medium text-gray-900 dark:text-white">{p.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{p.email || 'Sem email'} - <span className="font-semibold">{p.type}</span></p></div><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={() => handleDeletePartner(p)}><Trash2Icon className="h-4 w-4" /></Button></div>))}
                    </div>
                </TabsContent>
                
                <TabsContent value="operators">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80">Operadoras</h3><Button onClick={() => handleOpenOperatorModal()}><PlusCircleIcon className="h-4 w-4 mr-2" />Adicionar</Button></div>
                    <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-4 space-y-2">
                        {sortedOperators.map(op => (
                            <div key={op.id}>
                                <div className="flex justify-between items-center bg-gray-200/70 dark:bg-gray-800/70 p-3 rounded-md">
                                    <p className="font-medium text-gray-900 dark:text-white flex-grow cursor-pointer" onClick={() => setExpandedOperatorId(prev => prev === op.id ? null : op.id)}>{op.name}</p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenOperatorModal(op)}><PencilIcon className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-400" onClick={(e) => {e.stopPropagation(); handleDeleteOperator(op)}}><Trash2Icon className="h-4 w-4" /></Button>
                                        <button onClick={() => setExpandedOperatorId(prev => prev === op.id ? null : op.id)} className="p-1">
                                            <ChevronDownIcon className={cn("h-5 w-5 transition-transform", expandedOperatorId === op.id && "rotate-180")} />
                                        </button>
                                    </div>
                                </div>
                                {expandedOperatorId === op.id && (
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-b-md">
                                        <DetailItem label="Gerente de Contas" value={op.managerName} />
                                        <DetailItem label="Telefone" value={op.managerPhone} />
                                        <DetailItem label="Email" value={op.managerEmail} />
                                        <DetailItem label="Portal do Corretor" value={op.portalLink} isLink />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </TabsContent>
                
                <TabsContent value="company">
                    <FormSection title="Dados da Empresa">
                        <div><Label>Nome da Empresa</Label><Input name="companyName" value={companyData.companyName || ''} onChange={handleCompanyDataChange} /></div>
                        <div><Label>CNPJ</Label><Input name="cnpj" value={companyData.cnpj || ''} onChange={handleCompanyDataChange} /></div>
                        <div><Label>Endereço</Label><Input name="address" value={companyData.address || ''} onChange={handleCompanyDataChange} /></div>
                        <div><Label>Logo da Empresa (URL)</Label><Input name="logoUrl" value={companyData.logoUrl || ''} onChange={handleCompanyDataChange} placeholder="https://site.com/logo.png"/></div>
                    </FormSection>
                    <FormSection title="Metas da Empresa (Opcional)">
                        <div><Label>Meta de Faturamento Mensal</Label><Input type="number" name="goalRevenue" value={companyData.goalRevenue || ''} onChange={handleCompanyDataChange} /></div>
                        <div><Label>Meta de Novos Clientes Mensal</Label><Input type="number" name="goalClients" value={companyData.goalClients || ''} onChange={handleCompanyDataChange} /></div>
                    </FormSection>
                    <div className="flex justify-end"><Button onClick={handleSaveCompanyProfile}>Salvar Alterações</Button></div>
                </TabsContent>
            </Tabs>
        </GlassPanel>
        
        <AddCollaboratorModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleAddUser} />
        <AddOperatorModal isOpen={isOperatorModalOpen} onClose={() => { setOperatorModalOpen(false); setEditingOperator(null); }} onSave={handleSaveOperator} operator={editingOperator} />
        <AddPartnerModal isOpen={isPartnerModalOpen} onClose={() => setPartnerModalOpen(false)} onSave={handleAddPartner} />
    </div>
    );
};

const MiniCalendarPopover = ({ isOpen, onClose, onSelectDate, targetElement }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !targetElement) return null;

    // Lógica de posicionamento simplificada para evitar erros
    const popoverWidth = 288; // Largura do popover (w-72)
    const popoverRect = targetElement.getBoundingClientRect();
    
    // Alinha a borda DIREITA do popover com a borda DIREITA do botão
    const leftPosition = popoverRect.right + window.scrollX - popoverWidth;
    const topPosition = popoverRect.bottom + window.scrollY + 5;

    const style = {
        position: 'absolute',
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        zIndex: 100,
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDay = firstDayOfMonth.getDay();

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    return createPortal(
        <div ref={popoverRef} style={style}>
            <GlassPanel className="p-4 w-72">
                <div className="flex justify-between items-center mb-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button>
                    <span className="font-semibold text-sm capitalize text-gray-900 dark:text-white">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-300">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <button
                                key={day}
                                onClick={() => onSelectDate(date)}
                                className={cn(
                                    "w-8 h-8 rounded-full hover:bg-cyan-500/20 text-gray-800 dark:text-gray-200",
                                    isToday && "ring-2 ring-cyan-500"
                                )}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>
            </GlassPanel>
        </div>,
        document.body
    );
};


function CalendarPage({ onNavigate }) {
    const { users, completedEvents, toggleEventCompletion, updateClient, actionableEvents } = useData();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [popoverState, setPopoverState] = useState({ isOpen: false, event: null, target: null });


    const allEvents = actionableEvents;

    const completedEventIds = useMemo(() => new Set(completedEvents.map(e => e.eventId)), [completedEvents]);

    const eventsByDay = useMemo(() => {
        const eventsMap = {};
        if (allEvents) {
            allEvents.forEach(event => {
                const dayKey = event.date.toISOString().split('T')[0];
                if (!eventsMap[dayKey]) eventsMap[dayKey] = [];
                eventsMap[dayKey].push(event);
            });
        }
        return eventsMap;
    }, [allEvents]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
    const startingDay = firstDayOfMonth.getDay();
    const changeMonth = (offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    const todayKey = new Date().toISOString().split('T')[0];

    const handlePostponeDateSelect = async (newDate) => {
        const { event } = popoverState;
        if (!event) return;

        const { client, originalDate } = event.data;
        const newDateForEvent = newDate.toISOString().split('T')[0];
        const exceptions = client.boletoExceptions || [];
        const existingIndex = exceptions.findIndex(ex => ex.originalDate === originalDate);

        if (existingIndex > -1) {
            exceptions[existingIndex].modifiedDate = newDateForEvent;
        } else {
            exceptions.push({ originalDate: originalDate, modifiedDate: newDateForEvent });
        }

        const success = await updateClient(client.id, { ...client, boletoExceptions: exceptions });
        if (success) {
            toast({ title: 'Adiado!', description: `O envio do boleto foi adiado para ${newDate.toLocaleDateString('pt-BR')}.` });
        } else {
            toast({ title: 'Erro', description: 'Não foi possível adiar o evento.', variant: 'destructive' });
        }
        setPopoverState({ isOpen: false, event: null, target: null });
    };


    const DayAgenda = () => {
        const dayKey = selectedDate.toISOString().split('T')[0];
        const dayEvents = (eventsByDay[dayKey] || []).sort((a, b) => a.type.localeCompare(b.type));
        const pendingEvents = dayEvents.filter(e => !completedEventIds.has(e.id));
        const completedEventsToday = dayEvents.filter(e => completedEventIds.has(e.id));

        const getWhatsAppLink = (client) => {
            const phone = client?.general?.contactPhone || client?.general?.holderCpf;
            if (!phone) return null;
            return `https://wa.me/55${phone.replace(/\D/g, '')}`;
        }

        if (dayEvents.length === 0) {
            return (<div className="text-center text-gray-500 pt-16 flex flex-col items-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                <h4 className="font-semibold mt-4">Nenhum evento para este dia.</h4>
                <p className="text-sm">Relaxe ou planeje o futuro!</p>
            </div>);
        }

        return (
            <div className="space-y-4">
                {pendingEvents.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pendentes</h4>
                        <div className="space-y-3">
                            {pendingEvents.map(event => {
                                const responsible = users.find(u => u.id === event.data?.contract?.boletoResponsibleId || u.id === event.data?.task?.assignedTo);
                                const whatsAppLink = getWhatsAppLink(event.data.client);
                                return (
                                    <GlassPanel key={event.id} className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className={cn("w-8 h-8 mt-1 rounded-lg flex-shrink-0 flex items-center justify-center text-white", event.color)}>
                                                <event.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.title}</p>
                                                <p className="text-xs text-gray-500">Responsável: {responsible?.name || 'Não definido'}</p>
                                            </div>
                                            <Checkbox checked={false} onChange={(e) => toggleEventCompletion(event, e.target.checked)} title="Marcar como concluído" />
                                        </div>
                                        {event.type === 'boletoSend' && (
                                            <div className="flex gap-2 mt-2 pl-11">
                                                <Button size="sm" variant="outline" onClick={() => onNavigate('client-details', event.data.client.id)}>Ver Cliente</Button>
                                                {whatsAppLink && <Button size="sm" as="a" href={whatsAppLink} target="_blank">WhatsApp</Button>}
                                                <Button size="sm" variant="ghost" onClick={(e) => setPopoverState({ isOpen: true, event: event, target: e.currentTarget })}>Adiar</Button>
                                            </div>
                                        )}
                                    </GlassPanel>
                                )
                            })}
                        </div>
                    </div>
                )}
                {completedEventsToday.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-6">Concluídos</h4>
                        <div className="space-y-2">
                            {completedEventsToday.map(event => (
                                <div key={event.id} className="p-2 rounded-lg flex items-center gap-3 opacity-60">
                                    <Checkbox checked={true} onChange={(e) => toggleEventCompletion(event, e.target.checked)} />
                                    <div className={cn("w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white", event.color)}><event.icon className="w-4 h-4" /></div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-through truncate">{event.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-5rem)] flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex-shrink-0">Calendário Inteligente</h2>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <GlassPanel className="p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize w-48 text-center">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-2">{day}</div>)}</div>
                    <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-grow">
                        {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-transparent"></div>)}
                        {daysInMonth.map(day => {
                            const dayKey = day.toISOString().split('T')[0];
                            const dayEvents = (eventsByDay[dayKey] || []).filter(e => !completedEventIds.has(e.id));
                            const isSelected = day.toDateString() === selectedDate.toDateString();
                            const isToday = dayKey === todayKey;

                            const eventTypeColors = {
                                boletoSend: 'bg-cyan-500',
                                task: 'bg-red-500',
                                renewal: 'bg-violet-500',
                                boletoDue: 'bg-yellow-500',
                            };
                            const eventTypesOnDay = new Set(dayEvents.map(e => e.type));

                            return (
                                <div key={dayKey} onClick={() => setSelectedDate(day)} className={cn("border border-gray-200/50 dark:border-white/10 p-2 hover:bg-cyan-500/10 transition-colors cursor-pointer rounded-lg min-h-[5rem]", isSelected && "ring-2 ring-cyan-500", isToday && "bg-cyan-100/30 dark:bg-cyan-900/20")}>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold", isToday ? "text-cyan-600 dark:text-cyan-300" : "text-gray-800 dark:text-white")}>{day.getDate()}</span>
                                        {dayEvents.length > 0 &&
                                            <div className="flex items-center gap-1">
                                                {Array.from(eventTypesOnDay).slice(0, 4).map(type => (
                                                    <div key={type} className={cn("w-2.5 h-2.5 rounded-full", eventTypeColors[type] || 'bg-gray-400')}></div>
                                                ))}
                                            </div>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassPanel>
                <GlassPanel className="p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">Agenda do Dia <span className="text-cyan-500">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span></h3>
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                        <DayAgenda />
                    </div>
                </GlassPanel>
            </div>
            <MiniCalendarPopover
                isOpen={popoverState.isOpen}
                onClose={() => setPopoverState({ isOpen: false, event: null, target: null })}
                onSelectDate={handlePostponeDateSelect}
                targetElement={popoverState.target}
            />
        </div>
    );
};

function ProfilePage() {
    const { user, updateUserProfile, updateUserPassword } = useAuth();
    const { preferences, updatePreferences } = usePreferences();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user && user.name !== 'Usuário Incompleto') {
            setName(user.name);
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const success = await updateUserProfile(user.uid, { name });
        toast({ title: success ? "Sucesso" : "Erro", description: success ? "Nome atualizado." : "Não foi possível atualizar.", variant: success ? 'default' : 'destructive' });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!currentPassword) { toast({ title: "Erro", description: "Insira sua senha atual.", variant: 'destructive' }); return; }
        if (newPassword !== confirmPassword) { toast({ title: "Erro", description: "As senhas não coincidem.", variant: 'destructive' }); return; }
        if (newPassword.length < 6) { toast({ title: "Erro", description: "A nova senha deve ter no mínimo 6 caracteres.", variant: 'destructive' }); return; }
        const result = await updateUserPassword(currentPassword, newPassword);
        if (result === true) {
            toast({ title: "Sucesso", description: "Senha atualizada." });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } else {
            let errorMessage = "Não foi possível atualizar.";
            if (result === 'auth/wrong-password') errorMessage = "A senha atual está incorreta.";
            else if (result === 'auth/requires-recent-login') errorMessage = "Requer autenticação recente. Faça logout e login novamente.";
            toast({ title: "Erro", description: errorMessage, variant: 'destructive' });
        }
    };

    const handlePreferenceChange = async (key, value) => {
        const success = await updatePreferences({ [key]: value });
        if (!success) {
            toast({ title: "Erro", description: "Não foi possível salvar a preferência.", variant: 'destructive' });
        }
    };

    return (
    <div className={cn("p-4 sm:p-6 lg:p-8", preferences.uppercaseMode && "uppercase")}>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Informações Pessoais</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div><Label>Nome Completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
                    <div className="flex justify-end"><Button type="submit">Salvar Nome</Button></div>
                </form>
            </GlassPanel>
            <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Alterar Senha</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div><Label>Senha Atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                    <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                    <div><Label>Confirmar Nova Senha</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                    <div className="flex justify-end"><Button type="submit">Alterar Senha</Button></div>
                </form>
            </GlassPanel>
            <GlassPanel className="p-6 lg:col-span-2">
                 <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400/80 mb-6">Preferências de Interface</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Modo Contorno</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Exibe uma borda em todos os campos de informação para melhor visualização.</p>
                        </div>
                        <Switch checked={preferences.contourMode} onChange={(value) => handlePreferenceChange('contourMode', value)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Modo Maiúsculas</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Exibe todos os textos e campos do sistema em CAIXA ALTA.</p>
                        </div>
                        <Switch checked={preferences.uppercaseMode} onChange={(value) => handlePreferenceChange('uppercaseMode', value)} />
                    </div>
                 </div>
            </GlassPanel>
        </div>
    </div>);
}

const ArchivedLeadsModal = ({ isOpen, onClose, allLeads, onUnarchive }) => {
    const archivedLeads = allLeads.filter(l => l.archived).sort((a, b) => (b.archivedAt?.toDate() || 0) - (a.archivedAt?.toDate() || 0));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Leads Arquivados" size="5xl">
            <div className="max-h-[60vh] overflow-y-auto">
                {archivedLeads.length > 0 ? (
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Nome do Lead</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Empresa</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">Data do Arquivamento</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-500 dark:text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {archivedLeads.map(lead => (
                                <tr key={lead.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lead.company || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDateTime(lead.archivedAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" onClick={() => onUnarchive(lead.id)}>Restaurar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState title="Nenhum Lead Arquivado" message="Quando você mover um lead para a coluna de descarte, ele aparecerá aqui." />
                )}
            </div>
             <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    )
};

const ManageColumnsModal = ({ isOpen, onClose, onSave, columns, boardId, title, showConversionButton = false, showConclusionButton = false }) => {
    const { addKanbanColumn, deleteKanbanColumn, updateKanbanColumnOrder, logAction, leads, tasks } = useData();
    const { toast } = useToast();
    const db = getFirestore();

    const [localColumns, setLocalColumns] = useState([]);
    const [newColumnTitle, setNewColumnTitle] = useState("");

    useEffect(() => {
        const initializedColumns = (columns || []).map(col => ({
            ...col,
            isConversion: col.isConversion || false,
            isArchiveColumn: col.isArchiveColumn || false,
            isConclusion: col.isConclusion || false, // [NOVO]
        }));
        setLocalColumns(initializedColumns);
    }, [columns, isOpen]);

    const handleTitleChange = (id, newTitle) => {
        setLocalColumns(prev => prev.map(col => col.id === id ? { ...col, title: newTitle } : col));
    };

    const handleSetConversion = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isConversion: col.id === id, isConclusion: false, isArchiveColumn: col.id === id ? false : col.isArchiveColumn })));
    };
    
    // [NOVO] Lógica para a coluna de conclusão
    const handleSetConclusion = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isConclusion: col.id === id, isConversion: false, isArchiveColumn: col.id === id ? false : col.isArchiveColumn })));
    };

    const handleSetArchive = (id) => {
        setLocalColumns(prev => prev.map(col => ({ ...col, isArchiveColumn: col.id === id, isConversion: false, isConclusion: false })));
    };

    const handleAddNewColumn = () => {
        if (newColumnTitle.trim() === "") return;
        const newColumn = {
            id: `temp_${Date.now()}`,
            title: newColumnTitle,
            color: '#3B82F6',
            isConversion: false,
            isConclusion: false,
            isArchiveColumn: false,
            order: localColumns.length,
            boardId: boardId,
        };
        setLocalColumns(prev => [...prev, newColumn]);
        setNewColumnTitle("");
    };

    const handleDelete = async (id, title) => {
        if (id.startsWith('temp_')) {
            setLocalColumns(prev => prev.filter(col => col.id !== id));
        } else {
            const itemsInColumn = boardId === 'leads' ? leads.filter(l => l.status === title).length : tasks.filter(t => t.status === title).length;

            if (itemsInColumn > 0) {
                toast({ title: "Coluna não está vazia!", description: "Mova os itens para outra coluna antes de excluir.", variant: 'destructive' });
                return;
            }
            if (await deleteKanbanColumn(id)) {
                setLocalColumns(prev => prev.filter(col => col.id !== id));
                toast({ title: "Coluna removida" });
            }
        }
    };
    
    const handleSave = () => {
        onSave(localColumns);
        onClose();
    };

    return (
        // [ALTERAÇÃO] Título agora é uma prop
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Arraste para reordenar. Defina as colunas especiais.</p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {localColumns.map(col => (
                        <div key={col.id} className="flex items-center gap-3 bg-gray-100 dark:bg-black/20 p-2 rounded-lg">
                            <GripVerticalIcon className="h-5 w-5 text-gray-400 cursor-move" />
                            <Input value={col.title} onChange={(e) => handleTitleChange(col.id, e.target.value)} className="flex-grow"/>
                            
                            {/* [ALTERAÇÃO] Botões condicionais */}
                            {showConclusionButton && (
                                <button onClick={() => handleSetConclusion(col.id)} title="Marcar como coluna de CONCLUSÃO" className={cn("p-2 rounded-full transition-colors", col.isConclusion ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400")}>
                                    <CheckSquareIcon className="h-4 w-4" />
                                </button>
                            )}
                            {showConversionButton && (
                                <button onClick={() => handleSetConversion(col.id)} title="Marcar como coluna de CONVERSÃO" className={cn("p-2 rounded-full transition-colors", col.isConversion ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400")}>
                                    <ZapIcon className={cn("h-4 w-4", col.isConversion && "text-white")} />
                                </button>
                            )}

                            <button onClick={() => handleSetArchive(col.id)} title="Marcar como coluna de ARQUIVO/DESCARTE" className={cn("p-2 rounded-full transition-colors", col.isArchiveColumn ? "bg-red-600 text-white" : "bg-gray-300 dark:bg-gray-600 hover:bg-red-500")}>
                                <ArchiveIcon className="h-4 w-4" />
                            </button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70" onClick={() => handleDelete(col.id, col.title)}>
                                <Trash2Icon className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Adicionar Nova Coluna</h3>
                    <div className="flex gap-3 mt-2">
                        <Input value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Nome da nova coluna" />
                        <Button onClick={handleAddNewColumn}>Adicionar</Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button variant="violet" onClick={handleSave}>Salvar Alterações</Button>
            </div>
        </Modal>
    );
};
function LeadsPage({ onNavigate }) {
    const { leads, updateLead, addLead, leadColumns, addKanbanColumn, deleteKanbanColumn } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();
    const db = getFirestore();
    const [isLeadModalOpen, setLeadModalOpen] = useState(false);
    const [isManageColumnsModalOpen, setManageColumnsModalOpen] = useState(false);
    const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);

    if (!leadColumns) {
        return <div className="p-8 text-center">Carregando colunas...</div>;
    }

    const handleDragEnd = async (item, targetColumnId) => {
        const targetColumn = leadColumns.find(c => c.id === targetColumnId);
        if (!targetColumn) return;

        if (targetColumn.isConversion) {
            onNavigate('convert-lead', item.id);
        } else if (targetColumn.isArchiveColumn) {
            try {
                await confirm({ title: `Arquivar Lead?`, description: `"${item.name}" será removido do funil, mas poderá ser restaurado a qualquer momento.` });
                await updateLead(item.id, { ...item, archived: true, status: targetColumn.title, archivedAt: serverTimestamp() });
                toast({ title: "Lead Arquivado", description: `${item.name} foi movido para o arquivo.` });
            } catch (e) {
                // Ação cancelada pelo usuário
            }
        } else {
            const newStatus = targetColumn.title;
            await updateLead(item.id, { ...item, status: newStatus });
            toast({ title: "Lead Atualizado", description: `${item.name} movido para "${newStatus}".` });
        }
    };
    
    const handleSaveColumns = async (updatedColumns) => {
        const batch = writeBatch(db);
        
        updatedColumns.forEach((col, index) => {
            const { id, ...data } = col;
            const docRef = id.startsWith('temp_') 
                ? doc(collection(db, 'kanban_columns'))
                : doc(db, 'kanban_columns', id);
            
            batch.set(docRef, { ...data, order: index }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: "Sucesso!", description: "Estrutura do funil foi salva." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: 'destructive' });
            console.error("Erro ao salvar colunas: ", error);
        }
    };

    const handleUnarchive = async (leadId) => {
        const sortedColumns = [...leadColumns].sort((a, b) => a.order - b.order);
        const firstColumn = sortedColumns[0];
        if (!firstColumn) {
            toast({ title: "Erro", description: "Nenhuma coluna de funil encontrada para restaurar o lead.", variant: 'destructive' });
            return;
        }
        await updateLead(leadId, { archived: false, archivedAt: null, status: firstColumn.title });
        toast({ title: "Lead Restaurado!", description: "O lead voltou para a primeira coluna do funil." });
    };

    const handleOpenLeadModal = (lead = null) => {
        setEditingLead(lead);
        setLeadModalOpen(true);
    };

    const handleSaveLead = async (leadData) => {
        if (leadData.id) {
            await updateLead(leadData.id, leadData);
            toast({ title: "Lead Atualizado", description: `${leadData.name} foi atualizado.` });
        } else {
            const firstColumn = leadColumns.sort((a,b) => a.order - b.order)[0];
            const status = firstColumn ? firstColumn.title : 'Novo';
            await addLead({ ...leadData, status, archived: false });
            toast({ title: "Lead Adicionado", description: `${leadData.name} foi adicionado.` });
        }
    };

    const columnsForBoard = useMemo(() => {
        if (!leadColumns) return {};
        const visibleLeads = leads.filter(lead => !lead.archived);
        return leadColumns.reduce((acc, column) => {
            acc[column.id] = {
                ...column,
                items: visibleLeads.filter(l => l.status === column.title)
            };
            return acc;
        }, {});
    }, [leadColumns, leads]);

    const KanbanBoard = ({ columns, onDragEnd, children }) => {
        const [draggedItem, setDraggedItem] = useState(null);
        const [dragOverColumn, setDragOverColumn] = useState(null);
        const handleDragStart = (e, item, sourceColumnId) => { setDraggedItem({ item, sourceColumnId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); };
        const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
        const handleDrop = (e, targetColumnId) => { e.preventDefault(); if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) { onDragEnd(draggedItem.item, targetColumnId); } setDraggedItem(null); setDragOverColumn(null); };

        return (<div className="flex gap-6 overflow-x-auto p-2">
            {Object.values(columns).sort((a,b) => a.order - b.order).map((column) => (
                <div key={column.id} className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === column.id ? 'bg-gray-200/50 dark:bg-white/10' : '')} onDragOver={(e) => handleDragOver(e, column.id)} onDrop={(e) => handleDrop(e, column.id)} onDragLeave={() => setDragOverColumn(null)}>
                    <div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.isConversion ? '#10B981' : (column.isArchiveColumn ? '#EF4444' : (column.color || '#3B82F6')) }}>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {column.title}
                            {column.isConversion && <ZapIcon className="h-4 w-4 text-green-500" title="Coluna de Conversão"/>}
                            {column.isArchiveColumn && <ArchiveIcon className="h-4 w-4 text-red-500" title="Coluna de Arquivo/Descarte"/>}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span>
                        </div>
                    </div>
                    <div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">{column.items.length > 0 ? (column.items.map(item => (<div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, column.id)}>{typeof children === 'function' && children(item)}</div>))) : (<div className="text-center text-sm text-gray-500 dark:text-gray-600 p-4">Nenhum item aqui.</div>)}</div>
                </div>
            ))}
        </div>);
    };

    const LeadCard = memo(({ lead, onEdit }) => {
        const [analysis, setAnalysis] = useState(null);
        const [isLoading, setIsLoading] = useState(false);
        const [isAiActive, setAiActive] = useState(false);
        const handleAnalyze = async () => { setIsLoading(true); setAiActive(true); const result = await Cortex.analyzeLead(lead); setAnalysis(result); setIsLoading(false); };
        const score = analysis?.score || 0;
        return (<GlassPanel className="p-4 cursor-grab active:cursor-grabbing group" cortex={score > 75}>
            <div className="flex justify-between items-start">
                <div><p className="font-bold text-gray-900 dark:text-white cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400" onClick={() => onEdit(lead)}>{lead.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{lead.company || 'Sem empresa'}</p></div>
                {isAiActive ? (<div className={cn("text-center transition-opacity", score > 75 && "cortex-active p-1 rounded-lg")}>{isLoading ? (<div className="animate-spin h-5 w-5 border-2 border-violet-500 dark:border-violet-400 border-t-transparent rounded-full mx-auto my-1"></div>) : (<p className="text-xl font-bold text-violet-600 dark:text-violet-400">{score}</p>)}<p className="text-xs text-violet-600 dark:text-violet-500">Score</p></div>) : (<Button variant="violet" size="sm" onClick={handleAnalyze} className="h-auto py-1 px-2 text-xs"><SparklesIcon className="h-3 w-3 mr-1.5" />Analisar</Button>)}
            </div>
            <div className="mt-3 text-xs text-gray-500"><p>Criado em: {lead.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</p></div>
        </GlassPanel>);
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Funil de Leads</h2>
                <div className="flex flex-wrap gap-2">
                     <Button onClick={() => setManageColumnsModalOpen(true)}><PaletteIcon className="h-4 w-4 mr-2"/>Gerenciar Colunas</Button>
                     <Button variant="outline" onClick={() => setArchiveModalOpen(true)}><ArchiveIcon className="h-4 w-4 mr-2"/>Ver Arquivados</Button>
                     <Button onClick={() => handleOpenLeadModal()} variant="violet"><PlusCircleIcon className="h-5 w-5 mr-2" />Adicionar Lead</Button>
                </div>
            </div>
            <GlassPanel className="p-4">
                <KanbanBoard columns={columnsForBoard} onDragEnd={handleDragEnd}>
                    {(item) => <LeadCard lead={item} onEdit={handleOpenLeadModal} />}
                </KanbanBoard>
            </GlassPanel>
            <LeadModal isOpen={isLeadModalOpen} onClose={() => setLeadModalOpen(false)} onSave={handleSaveLead} lead={editingLead} />
            <ManageColumnsModal
    isOpen={isManageColumnsModalOpen}
    onClose={() => setManageColumnsModalOpen(false)}
    onSave={handleSaveColumns}
    columns={leadColumns}
    boardId="leads"
    title="Gerenciar Colunas do Funil" // <-- Título Específico
    showConversionButton={true}        // <-- Mostrar botão de conversão
/>
            <ArchivedLeadsModal
                isOpen={isArchiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                allLeads={leads}
                onUnarchive={handleUnarchive}
            />
        </div>
    );
}
function TasksPage() {
    const { tasks, updateTask, addTask, deleteTask, loading, taskColumns, addKanbanColumn, deleteKanbanColumn, logAction, clients, leads, users } = useData();
    const { toast } = useToast();
    const confirm = useConfirm();
    const db = getFirestore();
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isManageColumnsModalOpen, setManageColumnsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);

    // ===================================================================================
    // [NOVO] Todas as 'const' de componentes foram movidas para DENTRO de TasksPage
    // ===================================================================================

    // Componente para visualizar os detalhes de uma tarefa
    const TaskViewModal = ({ isOpen, onClose, task }) => {
        if (!task) return null;

        const assignedUser = users.find(u => u.id === task.assignedTo);
        const linkedItem = task.linkedToType === 'client' 
            ? clients.find(c => c.id === task.linkedToId) 
            : leads.find(l => l.id === task.linkedToId);
        
        const linkedItemName = linkedItem 
            ? linkedItem.general?.companyName || linkedItem.general?.holderName || linkedItem.name 
            : null;

        const renderDescription = (desc) => { 
            if (!desc) return <p className="text-gray-500 italic">Nenhuma descrição fornecida.</p>;
            return (desc || '').split('\n').map((line, i) => <p key={i}>{line}</p>); 
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Tarefa: ${task.title}`}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        <DetailItem label="Status" value={task.status} />
                        <DetailItem label="Prioridade">
                            <Badge variant={
                                task.priority === 'Alta' ? 'danger' : task.priority === 'Média' ? 'warning' : 'secondary'
                            }>{task.priority}</Badge>
                        </DetailItem>
                        <DetailItem label="Prazo" value={formatDate(task.dueDate)} />
                        <DetailItem label="Responsável" value={assignedUser?.name} />
                        {linkedItemName && (
                             <DetailItem label={`Vinculado a ${task.linkedToType === 'client' ? 'Cliente' : 'Lead'}`} value={linkedItemName} />
                        )}
                    </div>

                    <div>
                        <Label>Descrição</Label>
                        <div className="mt-1 text-md text-gray-800 dark:text-gray-100 prose dark:prose-invert max-w-none">
                            {renderDescription(task.description)}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-white/10">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                </div>
            </Modal>
        );
    };

    // Componente que renderiza cada card de tarefa
    const TaskCard = memo(({ task, onEdit, onDelete, onView }) => {
        const assignedUser = users.find(u => u.id === task.assignedTo);
        const linkedItem = task.linkedToType === 'client' 
            ? clients.find(c => c.id === task.linkedToId) 
            : leads.find(l => l.id === task.linkedToId);
        
        const linkedItemName = linkedItem 
            ? linkedItem.general?.companyName || linkedItem.general?.holderName || linkedItem.name 
            : '';
    
        return (
            <GlassPanel 
                className="p-4 cursor-grab active:cursor-grabbing group border-l-4"
                style={{ borderColor: task.color || '#6B7280' }}
                onDoubleClick={() => onView(task)}
            >
                <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900 dark:text-white flex-grow truncate" title={task.title}>{task.title}</p>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(task); }}><PencilIcon className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/70 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(task); }}><Trash2Icon className="h-4 w-4" /></Button>
                    </div>
                </div>
                
                {linkedItem && (
                    <p className="text-xs mt-2 text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded-md inline-block">
                        {task.linkedToType === 'client' ? 'CLIENTE: ' : 'LEAD: '} {linkedItemName}
                    </p>
                )}
                
                <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
                    <span>Prazo: {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}</span>
                    {assignedUser && <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 border-2 border-violet-400 dark:border-violet-700" title={assignedUser.name}>{assignedUser.name?.[0]}</div>}
                </div>
            </GlassPanel>
        );
    });
    
    // Componente para o quadro Kanban
    const KanbanBoard = ({ columns, onDragEnd, children }) => {
        const [draggedItem, setDraggedItem] = useState(null);
        const [dragOverColumn, setDragOverColumn] = useState(null);
        const handleDragStart = (e, item, sourceColumnId) => { setDraggedItem({ item, sourceColumnId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); };
        const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId); };
        const handleDrop = (e, targetColumnId) => { e.preventDefault(); if (draggedItem && draggedItem.sourceColumnId !== targetColumnId) { onDragEnd(draggedItem.item, targetColumnId); } setDraggedItem(null); setDragOverColumn(null); };

        return (
            <div className="flex gap-6 overflow-x-auto p-2">
                {Object.values(columns).sort((a, b) => a.order - b.order).map((column) => (
                    <div key={column.id} className={cn("w-80 flex-shrink-0 flex flex-col rounded-xl transition-colors duration-300", dragOverColumn === column.id ? 'bg-gray-200/50 dark:bg-white/10' : '')} onDragOver={(e) => handleDragOver(e, column.id)} onDrop={(e) => handleDrop(e, column.id)} onDragLeave={() => setDragOverColumn(null)}>
                        <div className="p-4 flex justify-between items-center border-b-2" style={{ borderColor: column.color || '#3B82F6' }}>
                             <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {column.title}
                                {column.isConclusion && <CheckSquareIcon className="h-4 w-4 text-green-500" title="Coluna de Conclusão"/>}
                                {column.isArchiveColumn && <ArchiveIcon className="h-4 w-4 text-red-500" title="Coluna de Arquivo/Descarte"/>}
                            </h3>
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5">{column.items.length}</span>
                        </div>
                        <div className="p-2 space-y-3 overflow-y-auto min-h-[200px]">
                            {column.items.length > 0 ? (column.items.map(item => (
                                <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, column.id)}>
                                    {typeof children === 'function' && children(item)}
                                </div>
                            ))) : (<div className="text-center text-sm text-gray-500 dark:text-gray-600 p-4">Nenhuma tarefa aqui.</div>)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ===================================================================================
    // Lógica principal do componente TasksPage
    // ===================================================================================
    
    useEffect(() => {
        const conclusionColumn = taskColumns.find(c => c.isConclusion);
        if (!conclusionColumn || !tasks.length) return;

        const now = new Date();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const tasksToArchive = [];

        tasks.forEach(task => {
            if (task.status === conclusionColumn.title && task.completedAt && !task.archived) {
                const completedDate = task.completedAt.toDate();
                if ((now - completedDate) > twoDaysInMs) {
                    tasksToArchive.push(task.id);
                }
            }
        });

        if (tasksToArchive.length > 0) {
            const batch = writeBatch(db);
            tasksToArchive.forEach(taskId => {
                const taskRef = doc(db, "tasks", taskId);
                batch.update(taskRef, { archived: true });
            });
            batch.commit().then(() => {
                toast({ title: "Tarefas Arquivadas", description: `${tasksToArchive.length} tarefa(s) foram arquivadas automaticamente.` });
            });
        }
    }, [tasks, taskColumns, db, toast]);

    if (!taskColumns) {
        return <div className="p-8 text-center">Carregando colunas...</div>;
    }
    
    const handleDragEnd = async (item, targetColumnId) => {
        const targetColumn = taskColumns.find(c => c.id === targetColumnId);
        if (!targetColumn) return;

        let updateData = { status: targetColumn.title };

        if (targetColumn.isConclusion) {
            updateData.completedAt = serverTimestamp();
            logAction({ actionType: 'CONCLUSÃO', module: 'Tarefas', description: `concluiu a tarefa "${item.title}".` });
            toast({ title: "Tarefa Concluída!", description: `"${item.title}" será arquivada em 2 dias.` });
        }
        
        await updateTask(item.id, updateData);
    };

    const handleOpenTaskModal = (task = null) => {
        setEditingTask(task);
        setTaskModalOpen(true);
    };
    
    const handleViewTask = (task) => {
        setViewingTask(task);
    };

    const handleSaveTask = async (taskData) => {
        if (taskData.id) {
            await updateTask(taskData.id, taskData);
            toast({ title: "Tarefa Atualizada", description: `"${taskData.title}" atualizada.` });
        } else {
            const firstColumn = taskColumns.sort((a,b) => a.order - b.order)[0];
            const status = firstColumn ? firstColumn.title : 'Pendente';
            await addTask({ ...taskData, status, archived: false });
            toast({ title: "Tarefa Adicionada", description: `"${taskData.title}" criada.` });
        }
        setTaskModalOpen(false);
    };

    const handleDeleteTask = async (task) => {
        try {
            await confirm({ title: `Excluir Tarefa?`, description: `Tem certeza?` });
            const success = await deleteTask(task.id, task.title);
            toast({ title: success ? "Excluída" : "Erro", description: success ? `"${task.title}" removida.` : "Não foi possível excluir.", variant: success ? 'default' : 'destructive' });
        } catch (e) {}
    };

    const handleSaveColumns = async (updatedColumns) => {
        const batch = writeBatch(db);
        updatedColumns.forEach((col, index) => {
            const { id, ...data } = col;
            const docRef = id.startsWith('temp_') ? doc(collection(db, 'kanban_columns')) : doc(db, 'kanban_columns', id);
            batch.set(docRef, { ...data, order: index }, { merge: true });
        });
        try {
            await batch.commit();
            toast({ title: "Sucesso!", description: "Estrutura do quadro de tarefas foi salva." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: 'destructive' });
        }
    };
    
    const columnsForBoard = useMemo(() => {
        const visibleTasks = tasks.filter(task => !task.archived);
        if (!taskColumns) return {};
        return taskColumns.reduce((acc, column) => {
            acc[column.id] = {
                ...column,
                items: visibleTasks.filter(t => t.status === column.title)
            };
            return acc;
        }, {});
    }, [taskColumns, tasks]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setManageColumnsModalOpen(true)}>
                        <PaletteIcon className="h-4 w-4 mr-2"/>Gerenciar Colunas
                    </Button>
                    <Button onClick={() => handleOpenTaskModal()} variant="violet">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />Nova Tarefa
                    </Button>
                </div>
            </div>
            {loading && !tasks.length ? (<p className="text-center text-gray-500">Carregando...</p>) : (
                <GlassPanel className="p-4">
                    <KanbanBoard columns={columnsForBoard} onDragEnd={handleDragEnd}>
                        {(item) => <TaskCard task={item} onEdit={handleOpenTaskModal} onDelete={handleDeleteTask} onView={handleViewTask} />}
                    </KanbanBoard>
                </GlassPanel>
            )}
            <TaskModal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} task={editingTask} />
            
            <ManageColumnsModal
                isOpen={isManageColumnsModalOpen}
                onClose={() => setManageColumnsModalOpen(false)}
                onSave={handleSaveColumns}
                columns={taskColumns}
                boardId="tasks"
                title="Gerenciar Colunas de Tarefas"
                showConclusionButton={true}
            />
            
            <TaskViewModal 
                isOpen={!!viewingTask} 
                onClose={() => setViewingTask(null)} 
                task={viewingTask} 
            />
        </div>
    );
}
function TimelinePage() { const { timeline, users, loading } = useData(); const [filters, setFilters] = useState({ userId: 'all', module: 'all', actionType: 'all', searchTerm: '' }); const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); const filteredTimeline = useMemo(() => { return timeline.filter(log => { if (!log) return false; const userMatch = filters.userId === 'all' || log.userId === filters.userId; const moduleMatch = filters.module === 'all' || log.module === filters.module; const actionMatch = filters.actionType === 'all' || log.actionType === filters.actionType; const searchMatch = !filters.searchTerm || (log.description || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) || (log.userName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) || (log.entity?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase()); return userMatch && moduleMatch && actionMatch && searchMatch; }); }, [timeline, filters]); const TimelineItem = ({ log }) => { const getIcon = (actionType) => { switch (actionType) { case 'CRIAÇÃO': return <PlusCircleIcon className="h-5 w-5 text-green-500" />; case 'EDIÇÃO': return <PencilIcon className="h-5 w-5 text-yellow-500" />; case 'EXCLUSÃO': return <Trash2Icon className="h-5 w-5 text-red-500" />; case 'CONVERSÃO': return <RefreshCwIcon className="h-5 w-5 text-blue-500" />; default: return <InfoIcon className="h-5 w-5 text-gray-500" />; } }; return ( <div className="flex items-start gap-4 p-4 border-b border-gray-200 dark:border-white/10 last:border-b-0"> <div className="flex-shrink-0 pt-1">{getIcon(log.actionType)}</div> <div className="flex-grow"> <p className="text-sm"> <span className="font-semibold text-gray-900 dark:text-white">{log.userName || 'Sistema'}</span> <span className="text-gray-600 dark:text-gray-400"> {log.description || ''}</span> </p> <div className="text-xs text-gray-500 dark:text-gray-500 mt-1"> {formatDateTime(log.timestamp)} </div> <div className="flex flex-wrap gap-2 mt-2"> {log.module && <Badge variant="outline">{log.module}</Badge>} {log.actionType && <Badge>{log.actionType}</Badge>} {log.entity?.name && <Badge variant="secondary">{log.entity.type}: {log.entity.name}</Badge>} </div> </div> <Avatar className="h-10 w-10 border-2 border-gray-300 dark:border-gray-600"> <AvatarImage src={log.userAvatar} /> <AvatarFallback>{log.userName?.[0] || 'S'}</AvatarFallback> </Avatar> </div> ); }; return ( <div className="p-4 sm:p-6 lg:p-8"> <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Time-Line de Atividades</h2> <GlassPanel className="p-4 mb-6"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> <Input placeholder="Buscar..." name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} /> <Select name="userId" value={filters.userId} onChange={handleFilterChange}> <option value="all">Todos Usuários</option> {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)} </Select> <Select name="module" value={filters.module} onChange={handleFilterChange}> <option value="all">Todos Módulos</option> <option>Clientes</option><option>Leads</option><option>Tarefas</option><option>Corporativo</option> </Select> <Select name="actionType" value={filters.actionType} onChange={handleFilterChange}> <option value="all">Todas Ações</option> <option>CRIAÇÃO</option><option>EDIÇÃO</option><option>EXCLUSÃO</option><option>CONVERSÃO</option> </Select> </div> </GlassPanel> <GlassPanel> <div className="max-h-[70vh] overflow-y-auto"> {loading && timeline.length === 0 ? ( <p className="text-center text-gray-500 p-8">Carregando...</p> ) : filteredTimeline.length > 0 ? ( filteredTimeline.map(log => <TimelineItem key={log.id} log={log} />) ) : ( <EmptyState title="Nenhuma Atividade Encontrada" message="Ajuste os filtros." /> )} </div> </GlassPanel> </div> ); };

const MetricCard = ({ title, value, icon }) => ( <GlassPanel className="p-6 flex flex-col justify-between"> <div className="flex justify-between items-start"> <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3> <div className="text-gray-400 dark:text-gray-500">{icon}</div> </div> <p className="text-4xl font-bold text-gray-900 dark:text-white mt-4">{value}</p> </GlassPanel> );
const SalesFunnelChart = ({ data }) => ( <div className="space-y-2"> {data.map((stage, index) => ( <div key={stage.name} className="flex items-center"> <div className="w-32 text-sm text-right pr-4 text-gray-600 dark:text-gray-400">{stage.name}</div> <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-8"> <div style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }} className="h-8 rounded-full flex items-center justify-end px-3 text-white font-bold"> {stage.value} </div> </div> </div> ))} </div> );
const TeamPerformanceRanking = ({ data, title }) => ( <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3> <div className="space-y-3"> {data.map((item, index) => ( <div key={item.name} className="flex items-center gap-4"> <span className="font-bold text-lg w-6">{index + 1}</span> <div className="flex-1"><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">{formatCurrency(item.value)}</p></div> </div> ))} </div> </GlassPanel> );
const ActivityHeatmap = () => ( <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mapa de Calor de Atividades</h3> <p className="text-gray-500 text-sm">Visualização de atividades por dia da semana (feature em desenvolvimento).</p> </GlassPanel> );
const SimplePieChart = ({ data, title }) => { const total = data.reduce((sum, item) => sum + item.value, 0); return ( <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3> <div className="space-y-2"> {data.map((item, index) => ( <div key={item.name} className="flex items-center justify-between text-sm"> <span>{item.name}</span> <span className="font-semibold">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}% ({item.value})</span> </div> ))} </div> </GlassPanel> );};
const RiskValueMatrix = ({ data }) => { const quadrants = { q1: [], q2: [], q3: [], q4: [] }; const now = new Date(); data.forEach(client => { const activeContract = client.contracts?.find(c => c.status === 'ativo'); if (!activeContract) return; const value = parseFloat(activeContract.contractValue || 0); const endDate = activeContract.dataFimContrato ? new Date(activeContract.dataFimContrato) : null; const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : Infinity; const highValue = value > 1000; const highRisk = daysLeft <= 90; if (highValue && highRisk) quadrants.q1.push(client); else if (highValue && !highRisk) quadrants.q2.push(client); else if (!highValue && highRisk) quadrants.q3.push(client); else quadrants.q4.push(client); }); return ( <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matriz Risco vs. Valor</h3> <div className="grid grid-cols-2 grid-rows-2 gap-2 h-96"> <div className="bg-red-500/10 p-2 rounded-lg"><h4 className="font-bold text-red-700 dark:text-red-300">Alto Valor / Alto Risco ({quadrants.q1.length})</h4></div> <div className="bg-green-500/10 p-2 rounded-lg"><h4 className="font-bold text-green-700 dark:text-green-300">Alto Valor / Baixo Risco ({quadrants.q2.length})</h4></div> <div className="bg-yellow-500/10 p-2 rounded-lg"><h4 className="font-bold text-yellow-700 dark:text-yellow-300">Baixo Valor / Alto Risco ({quadrants.q3.length})</h4></div> <div className="bg-blue-500/10 p-2 rounded-lg"><h4 className="font-bold text-blue-700 dark:text-blue-300">Baixo Valor / Baixo Risco ({quadrants.q4.length})</h4></div> </div> </GlassPanel> ); };

function PainelDeControleTab({ onNavigate }) { const { clients, leads } = useData(); const metrics = useMemo(() => { const totalLeads = leads.length; const leadsGanhos = leads.filter(l => l.status === 'Ganhos').length; const leadsPerdidos = leads.filter(l => l.status === 'Perdidos').length; const activeLeads = totalLeads - leadsGanhos - leadsPerdidos; const conversionRate = (leadsGanhos + leadsPerdidos) > 0 ? (leadsGanhos / (leadsGanhos + leadsPerdidos)) * 100 : 0; const now = new Date(); const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); const newClients = clients.filter(c => c.createdAt && typeof c.createdAt.toDate === 'function' && c.createdAt.toDate() >= startOfMonth).length; const faturamento = clients.reduce((sum, client) => { const activeContract = client.contracts?.find(c => c.status === 'ativo'); return sum + (activeContract ? parseFloat(activeContract.contractValue) || 0 : 0); }, 0); return { faturamento, newClients, activeLeads, conversionRate: conversionRate.toFixed(1) + '%', funnel: [ { name: 'Novo', value: leads.filter(l => l.status === 'Novo').length, color: '#3B82F6' }, { name: 'Em Contato', value: leads.filter(l => l.status === 'Em contato').length, color: '#0EA5E9' }, { name: 'Proposta', value: leads.filter(l => l.status === 'Proposta enviada').length, color: '#F59E0B' }, { name: 'Ganho', value: leadsGanhos, color: '#10B981' }, ] }; }, [clients, leads]); const funnelWithPercentages = useMemo(() => { const total = metrics.funnel.reduce((sum, stage) => sum + stage.value, 0); return metrics.funnel.map(stage => ({ ...stage, percentage: total > 0 ? (stage.value / total) * 100 : 0 })); }, [metrics.funnel]); const AlertsPanel = ({ onNavigate }) => { const { clients } = useData(); const alerts = useMemo(() => { const allAlerts = []; const today = new Date(); const thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(today.getDate() + 30); clients.forEach(client => { (client.contracts || []).forEach(contract => { if (contract.status === 'ativo' && contract.dataFimContrato) { const endDate = new Date(contract.dataFimContrato); if (endDate > today && endDate <= thirtyDaysFromNow) { const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)); allAlerts.push({ id: `exp-${client.id}`, type: 'expiring', text: `Contrato de ${client.general.holderName} vence em ${daysLeft} dias`, action: () => onNavigate('client-details', client.id) }); } } }); (client.beneficiaries || []).forEach(ben => { if (!ben.dob || !ben.weight || !ben.height) { allAlerts.push({ id: `ben-${client.id}-${ben.id}`, type: 'incomplete', text: `Dados incompletos para ${ben.name} (cliente ${client.general.holderName})`, action: () => onNavigate('edit-client', client.id, { initialTab: 'beneficiaries' }) }); } }); }); return allAlerts.slice(0, 5); }, [clients, onNavigate]); return ( <div className="space-y-3"> {alerts.map(alert => ( <div key={alert.id} className="p-3 bg-yellow-100/50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-between"> <div className="flex items-center gap-3"> <AlertTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" /> <p className="text-sm text-yellow-800 dark:text-yellow-200">{alert.text}</p> </div> <Button size="sm" variant="ghost" onClick={alert.action}>Ver</Button> </div> ))} {alerts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum aviso no momento.</p>} </div> );}; const CortexInsights = () => { return ( <div className="space-y-3"> <div className="p-3 bg-violet-100/50 dark:bg-violet-900/30 rounded-lg flex items-center gap-3"> <SparklesIcon className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0" /> <p className="text-sm text-violet-800 dark:text-violet-200">20 clientes PME têm plano de saúde mas não odontológico. Sugerir upsell.</p> </div> </div> ); }; return ( <div className="space-y-8"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> <MetricCard title="Faturamento (Ativos)" value={formatCurrency(metrics.faturamento)} icon={<DollarSignIcon />} /> <MetricCard title="Novos Clientes (Mês)" value={metrics.newClients} icon={<UsersIcon />} /> <MetricCard title="Leads Ativos" value={metrics.activeLeads} icon={<TargetIcon />} /> <MetricCard title="Taxa de Conversão" value={metrics.conversionRate} icon={<TrendingUpIcon />} /> </div> <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Funil de Vendas</h3> <SalesFunnelChart data={funnelWithPercentages} /> </GlassPanel> <div className="space-y-6"> <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avisos Importantes</h3> <AlertsPanel onNavigate={onNavigate} /> </GlassPanel> <GlassPanel className="p-6" cortex> <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-300 mb-4 flex items-center gap-2"><SparklesIcon /> Insights da IA (Córtex)</h3> <CortexInsights /> </GlassPanel> </div> </div> </div> );}
function SaudeFinanceiraTab() { const { clients } = useData(); const metrics = useMemo(() => { const activeClients = clients.filter(c => c.general.status === 'Ativo'); const mrr = activeClients.reduce((sum, client) => { const activeContract = client.contracts?.find(c => c.status === 'ativo'); return sum + (activeContract ? parseFloat(activeContract.contractValue) || 0 : 0); }, 0); const churnedClients = clients.filter(c => c.general.status === 'Inativo').length; const churnRate = clients.length > 0 ? (churnedClients / clients.length) * 100 : 0; const totalRevenue = clients.reduce((sum, c) => sum + (c.contracts || []).reduce((s, contract) => s + parseFloat(contract.contractValue || 0), 0), 0); const totalCommission = clients.reduce((sum, c) => sum + parseFloat(c.commission?.contractValue || 0) * parseFloat(c.commission?.commissionRate || 0), 0); return { mrr, churnRate: churnRate.toFixed(1) + '%', totalRevenue, totalCommission }; }, [clients]); return ( <div className="space-y-8"> <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> <MetricCard title="MRR (Receita Recorrente Mensal)" value={formatCurrency(metrics.mrr)} icon={<RefreshCwIcon />} /> <MetricCard title="Churn Rate" value={metrics.churnRate} icon={<TrendingUpIcon className="transform -scale-y-100" />} /> <MetricCard title="Faturamento Total" value={formatCurrency(metrics.totalRevenue)} icon={<DollarSignIcon />} /> </div> <GlassPanel className="p-6"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receita vs. Comissão</h3> <div className="h-64 flex items-center justify-center text-gray-500">Gráfico em desenvolvimento.</div> </GlassPanel> </div> );}
function PerformanceEquipeTab() { const { user } = useAuth(); const { users, clients, tasks } = useData(); const performanceData = useMemo(() => { const brokers = users.filter(u => u.permissionLevel === 'Corretor'); return brokers.map(broker => { const salesVolume = clients.filter(c => c.internal?.brokerId === broker.id).reduce((sum, c) => sum + (c.contracts || []).reduce((s, contract) => s + parseFloat(contract.contractValue || 0), 0), 0); const activities = tasks.filter(t => t.assignedTo === broker.id).length; return { name: broker.name, salesVolume, activities }; }).sort((a, b) => b.salesVolume - a.salesVolume); }, [users, clients, tasks]); const visibleData = user.permissionLevel === 'Supervisor' ? performanceData.filter(d => users.find(u => u.name === d.name)?.supervisorId === user.uid) : performanceData; return ( <div className="space-y-8"> <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> <TeamPerformanceRanking data={visibleData.map(d => ({name: d.name, value: d.salesVolume}))} title="Ranking por Volume de Vendas" /> <TeamPerformanceRanking data={visibleData.map(d => ({name: d.name, value: d.activities}))} title="Ranking por Atividades Registradas" /> </div> <ActivityHeatmap /> </div> );}
function AnaliseCarteiraTab() { const { clients, operators } = useData(); const operatorData = useMemo(() => { const counts = {}; clients.forEach(client => { const activeContract = client.contracts?.find(c => c.status === 'ativo'); if (activeContract && activeContract.planOperator) { counts[activeContract.planOperator] = (counts[activeContract.planOperator] || 0) + 1; } }); return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [clients]); return ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> <SimplePieChart data={operatorData} title="Clientes por Operadora" /> <RiskValueMatrix data={clients} /> </div> );}

function DashboardPage({ onNavigate }) { 
    const [activeTab, setActiveTab] = useState('painel'); 
    return ( 
        <div className="p-4 sm:p-6 lg:p-8"> 
            <div className="flex justify-between items-center mb-6"> 
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2> 
            </div> 
            <GlassPanel className="p-2 sm:p-4"> 
                <Tabs value={activeTab} onValueChange={setActiveTab}> 
                    <TabsList> 
                        <TabsTrigger value="painel">Painel de Controle</TabsTrigger> 
                        <TabsTrigger value="financeiro">Saúde Financeira</TabsTrigger> 
                        <TabsTrigger value="performance">Performance da Equipe</TabsTrigger> 
                        <TabsTrigger value="carteira">Análise de Carteira</TabsTrigger> 
                    </TabsList> 
                    <TabsContent value="painel"><PainelDeControleTab onNavigate={onNavigate} /></TabsContent> 
                    <TabsContent value="financeiro"><SaudeFinanceiraTab /></TabsContent> 
                    <TabsContent value="performance"><PerformanceEquipeTab /></TabsContent> 
                    <TabsContent value="carteira"><AnaliseCarteiraTab /></TabsContent> 
                </Tabs>
            </GlassPanel> 
        </div> 
    ); 
}

// --- GERENCIADOR DE TAREFAS AUTOMÁTICAS ---
function BoletoTaskManager() {
    // 1. OBTENÇÃO DE DADOS E FUNÇÕES
    // A função `addTask` já está no context e faz o log, então a usamos.
    const { actionableEvents, users, addTask, logAction } = useData();

    // 2. CONTROLE DE EXECUÇÃO
    // Usamos useRef para evitar que a função rode múltiplas vezes se o componente re-renderizar rápido.
    // Isso garante que apenas uma sincronização ocorra por vez.
    const isSyncing = useRef(false);

    useEffect(() => {
        const syncEventsToTasks = async () => {
            // 3. TRAVA DE SEGURANÇA (PREVENÇÃO DE CONCORRÊNCIA)
            if (isSyncing.current) {
                console.log("BoletoTaskManager: Sincronização já em andamento. Ignorando nova chamada.");
                return;
            }
            isSyncing.current = true;
            console.log("BoletoTaskManager: Iniciando sincronização de tarefas de boleto...");

            try {
                // Condição de saída se os dados essenciais não estiverem prontos.
                if (!actionableEvents.length || !users.length || !db) {
                     console.log("BoletoTaskManager: Dados necessários ainda não carregados.");
                     isSyncing.current = false; // Libera a trava
                     return;
                }

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0); // Zera o horário para comparações de data precisas.

                // 4. FILTRO INTELIGENTE DE EVENTOS
                // Filtramos APENAS os eventos de envio de boleto que deveriam ter sido criados ATÉ HOJE.
                // Isso inclui eventos de hoje e os que possam estar atrasados (ex: o sistema ficou offline).
                const pendingBoletoEvents = actionableEvents.filter(event => {
                    if (event.type !== 'boletoSend') return false;
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    // A data do evento deve ser igual ou anterior a hoje.
                    // E NUNCA deve ser de um ano anterior ao ano corrente para evitar processar um histórico muito grande.
                    return eventDate <= hoje && eventDate.getFullYear() >= (hoje.getFullYear() - 1);
                });

                if (pendingBoletoEvents.length === 0) {
                    console.log("BoletoTaskManager: Nenhuma tarefa de boleto pendente para criar.");
                    isSyncing.current = false;
                    return;
                }
                
                // 5. PROCESSAMENTO EM SÉRIE (À PROVA DE ERROS)
                // Usamos um loop `for...of` que respeita o `await` dentro dele,
                // garantindo que uma verificação termine antes da próxima começar.
                for (const event of pendingBoletoEvents) {
                    const { client, contract, originalDate } = event.data;
                    const clientDisplayName = client.general?.companyName || client.general?.holderName || 'Cliente Sem Nome';

                    // 6. VERIFICAÇÃO ATÔMICA NO BANCO DE DADOS (O CORAÇÃO DA CORREÇÃO)
                    // Criamos uma consulta no Firestore para verificar se uma tarefa com marcadores
                    // únicos (isBoletoTask, linkedToId, boletoCycle) JÁ EXISTE.
                    const tasksRef = collection(db, 'tasks');
                    const q = query(tasksRef,
                        where('isBoletoTask', '==', true),         // Flag que identifica a tarefa
                        where('linkedToId', '==', client.id),      // ID do cliente
                        where('boletoCycle', '==', originalDate) // Ciclo único (ex: "2025-07")
                    );

                    const querySnapshot = await getDocs(q);
                    const taskAlreadyExists = !querySnapshot.empty;

                    // 7. LÓGICA DE CRIAÇÃO CONDICIONAL
                    // Somente se a consulta retornar vazia, nós criamos a tarefa.
                    if (!taskAlreadyExists) {
                        console.log(`BoletoTaskManager: CRIANDO tarefa para ${clientDisplayName}, ciclo ${originalDate}`);

                        const tituloTarefa = `Enviar Boleto - ${clientDisplayName}`;
                        const description = `Acessar portal da ${contract.planOperator || 'Operadora'} para o boleto de ${originalDate.split('-')[1]}/${originalDate.split('-')[0]}.\n\nEnviar para o WhatsApp:\nhttps://wa.me/55${(client.general.contactPhone || client.general.phone || '').replace(/\D/g, '')}`;

                        const newTask = {
                            title: tituloTarefa,
                            description: description,
                            assignedTo: contract.boletoResponsibleId,
                            dueDate: event.date.toISOString().split('T')[0],
                            priority: 'Alta',
                            status: 'Pendente',
                            color: '#0EA5E9', // Cor azul para boletos
                            linkedToId: client.id,
                            linkedToType: 'client',
                            archived: false,
                            // Flags para a verificação atômica:
                            isBoletoTask: true,        // Flag booleana
                            boletoCycle: originalDate  // String única 'AAAA-MM'
                        };

                        await addTask(newTask); // Usamos a função do context que já faz o log
                    } else {
                         console.log(`BoletoTaskManager: TAREFA JÁ EXISTE para ${clientDisplayName}, ciclo ${originalDate}. Ignorando.`);
                    }
                }
            } catch (error) {
                console.error("BoletoTaskManager: Erro durante a sincronização de tarefas.", error);
            } finally {
                // 8. LIBERAÇÃO DA TRAVA
                // Independentemente de sucesso ou falha, liberamos a trava para a próxima execução.
                isSyncing.current = false;
                console.log("BoletoTaskManager: Sincronização finalizada.");
            }
        };

        // Roda a sincronização 5 segundos após a inicialização e depois a cada 5 minutos.
        const initialSyncTimeout = setTimeout(syncEventsToTasks, 5000);
        const intervalId = setInterval(syncEventsToTasks, 300000); // 5 minutos

        // Limpa o intervalo quando o componente é desmontado
        return () => {
            clearTimeout(initialSyncTimeout);
            clearInterval(intervalId);
        };
    }, [actionableEvents, users, addTask, logAction]); // Dependências corretas

    return null; // Este componente não renderiza nada na tela.
}
// --- ORQUESTRADOR PRINCIPAL DA APLICAÇÃO ---
function MainApp() {
    const [page, setPage] = useState('dashboard');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [pageOptions, setPageOptions] = useState({});
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const data = useData();
    const { toast } = useToast();
    const [itemDetails, setItemDetails] = useState(null);
    const { preferences } = usePreferences();
    const [taskModalState, setTaskModalState] = useState({ isOpen: false, task: null });

    const handleNavigate = (targetPage, itemId = null, options = {}) => {
        setPage(targetPage);
        setSelectedItemId(itemId);
        setPageOptions(options);
        setSidebarOpen(false);
        setCommandPaletteOpen(false);
    };
    
    useEffect(() => {
        if ((page === 'client-details' || page === 'edit-client' || page === 'convert-lead') && selectedItemId) {
            const item = (page === 'convert-lead') ? data.leads.find(l => l.id === selectedItemId) : data.getClientById(selectedItemId);
            setItemDetails(item);
        } else {
            setItemDetails(null);
        }
    }, [selectedItemId, page, data.getClientById, data.clients, data.leads]);
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const handleSaveClient = async (savedClient, leadIdToDelete = null) => {
        if (leadIdToDelete) {
            const lead = data.leads.find(l => l.id === leadIdToDelete);
            if (lead) {
                await data.deleteLead(leadIdToDelete, lead.name);
                toast({ title: "Lead Convertido!", description: `${lead.name} agora é um cliente.` });
            }
        }
        setItemDetails(savedClient);
        handleNavigate(savedClient?.id ? 'client-details' : 'clients', savedClient?.id);
        toast({ title: "Sucesso", description: `Cliente ${savedClient.general.holderName} salvo.` });
    };
    
    const handleSaveTask = async (taskData) => {
        const result = await data.addTask(taskData);
        if(result) {
            toast({ title: "Tarefa Criada!", description: `A tarefa "${taskData.title}" foi adicionada.`});
            setTaskModalState({ isOpen: false, task: null });
        } else {
            toast({ title: "Erro", description: "Não foi possível criar a tarefa.", variant: 'destructive'});
        }
    };

    const executeCortexPlan = async (plan) => {
        for (const step of plan) {
            const { action, payload } = step;
            switch(action) {
                case 'navigate': handleNavigate(payload.page); break;
                case 'create_task': setTaskModalState({ isOpen: true, task: { title: payload.title || '', description: payload.description || '', dueDate: payload.dueDate || '', assignedTo: payload.assignedTo || '', priority: 'Média', status: 'Pendente' } }); break;
                default: toast({ title: "Ação não reconhecida", description: `Córtex sugeriu: ${action}`, variant: 'destructive' });
            }
        }
    };

    const renderContent = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage onNavigate={handleNavigate} />;
            case 'leads': return <LeadsPage onNavigate={handleNavigate} />;
            case 'clients': return <ClientsList onClientSelect={(id) => handleNavigate('client-details', id)} onAddClient={() => handleNavigate('add-client')} />;
            case 'client-details': return <ClientDetails client={itemDetails} onBack={() => handleNavigate('clients')} onEdit={(client, options) => handleNavigate('edit-client', client.id, options)} />;
            case 'add-client': return <ClientForm onSave={handleSaveClient} onCancel={() => handleNavigate('clients')} />;
            case 'edit-client': return <ClientForm client={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('client-details', itemDetails.id)} initialTab={pageOptions.initialTab} />;
            case 'convert-lead': return <ClientForm isConversion={true} leadData={itemDetails} onSave={handleSaveClient} onCancel={() => handleNavigate('leads')} />;
            case 'commissions': return <CommissionsPage />;
            case 'tasks': return <TasksPage />;
            case 'calendar': return <CalendarPage onNavigate={handleNavigate} />;
            case 'timeline': return <TimelinePage />;
            case 'corporate': return <CorporatePage />;
            case 'profile': return <ProfilePage />;
            default: return <DashboardPage onNavigate={handleNavigate} />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); body { font-family: 'Inter', sans-serif; } .prose { color: #374151; } .dark .prose-invert { color: #d1d5db; } .dark .prose ul { list-style-type: disc; padding-left: 1.5rem; } .dark .prose li { margin-top: 0.25em; margin-bottom: 0.25em; } .cortex-active { border: 1px solid rgba(192, 38, 211, 0.5); box-shadow: 0 0 15px rgba(192, 38, 211, 0.3); animation: pulse-violet 2.5s infinite; } @keyframes pulse-violet { 0% { box-shadow: 0 0 10px rgba(192, 38, 211, 0.2); } 50% { box-shadow: 0 0 25px rgba(192, 38, 211, 0.5); } 100% { box-shadow: 0 0 10px rgba(192, 38, 211, 0.2); } } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #f1f5f9; } .dark ::-webkit-scrollbar-track { background: #0D1117; } ::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 4px; } .dark ::-webkit-scrollbar-thumb { background: #C026D3; } ::-webkit-scrollbar-thumb:hover { background: #9333ea; } .dark ::-webkit-scrollbar-thumb:hover { background: #a31db1; } select option { background: white !important; color: #1f2937 !important; } .dark select option { background: #161b22 !important; color: #e5e7eb !important; }`}</style>
            <BoletoTaskManager />
            <CortexCommand isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={handleNavigate} onExecutePlan={executeCortexPlan} />
            <Sidebar onNavigate={handleNavigate} currentPage={page} isSidebarOpen={isSidebarOpen} />
            <div className="lg:pl-64 transition-all duration-300">
                <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
                <main className={cn("relative", preferences.uppercaseMode && "uppercase")}>{renderContent()}</main>
            </div>
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>}
            <TaskModal isOpen={taskModalState.isOpen} onClose={() => setTaskModalState({ isOpen: false, task: null })} onSave={handleSaveTask} task={taskModalState.task} />
        </div>
    );
}
    const CortexCommand = ({ isOpen, setIsOpen, onNavigate, onExecutePlan }) => {
    const { user } = useAuth();
    const { clients, leads, tasks, users, updateTask } = useData();
    const { toast } = useToast();
    const [view, setView] = useState('home'); // 'home', 'briefing', 'conversation'
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [planToConfirm, setPlanToConfirm] = useState(null);
    const [clarification, setClarification] = useState(null); // Estado para clarificação
    const inputRef = useRef(null);

    const dailyGoals = useMemo(() => {
        if (!tasks) return { total: 0, completed: 0, progress: 0 };
        const todayKey = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => t.dueDate === todayKey);
        const completedToday = todayTasks.filter(t => t.status === 'Concluída').length;
        return {
            total: todayTasks.length,
            completed: completedToday,
            progress: todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0
        };
    }, [tasks]);

    const briefingData = useMemo(() => {
        if (!tasks || !leads) return { tasks: [], leads: [] };
        const todayKey = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(new Date().getDate() - 7);
        
        return {
            tasks: tasks.filter(t => t.dueDate === todayKey && t.status !== 'Concluída').slice(0, 3),
            leads: leads.filter(l => l.status !== 'Ganhos' && l.status !== 'Perdidos' && l.lastActivityDate?.toDate() < sevenDaysAgo).slice(0, 2)
        }
    }, [tasks, leads]);

    const handleReset = () => {
        setView('home');
        setSearchTerm('');
        setConversation([]);
        setPlanToConfirm(null);
        setClarification(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };
    
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
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 4);

        let finalPrompt = PARSE_COMMAND_PROMPT_TEMPLATE
            .replace('{today}', today.toISOString().split('T')[0])
            .replace('{today_plus_4_days}', futureDate.toISOString().split('T')[0])
            .replace('{users}', JSON.stringify(users.map(u => ({ id: u.id, name: u.name }))))
            .replace('{clients}', JSON.stringify(clients.map(c => ({ id: c.id, name: c.general.companyName || c.general.holderName }))))
            .replace('{leads}', JSON.stringify(leads.map(l => ({ id: l.id, name: l.name }))))
            .replace('{command}', commandText);
        
        const response = await Cortex.parseCommand(finalPrompt);

        if (response.plan) {
            const planAction = response.plan[0];
            if (planAction.action === 'clarify_task_details') {
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

    useEffect(() => { if (isOpen) handleReset(); }, [isOpen]);
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);
    
    const GamificationHeader = () => (
        <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso Diário</p>
            <div className="flex items-center gap-3 mt-2"><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${dailyGoals.progress}%` }}></div></div><span className="font-bold text-sm text-gray-800 dark:text-white">{dailyGoals.completed}/{dailyGoals.total}</span></div>
        </div>
    );

    const BriefingView = () => (
        <div className="animate-fade-in space-y-4">
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Tarefas para Hoje</h4>
                {briefingData.tasks.length > 0 ? briefingData.tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-sm">{task.title}</span><Button size="sm" onClick={() => { updateTask(task.id, { ...task, status: 'Concluída' }); toast({ title: "Tarefa Concluída!" }) }}>Concluir</Button>
                    </div>
                )) : <p className="text-sm text-gray-500 p-2">Nenhuma tarefa pendente para hoje. 🎉</p>}
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Leads Precisando de Atenção</h4>
                {briefingData.leads.length > 0 ? briefingData.leads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-sm">{lead.name}</span><Button size="sm" onClick={() => onExecutePlan([{ action: 'create_task', payload: { title: `Follow-up com ${lead.name}`, linkedToName: lead.name, linkedToType: 'lead' } }])}>Criar Tarefa</Button>
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
                            {conversation.map((msg, i) => (<div key={i} className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-700 flex-shrink-0">{user?.name?.[0]}</div><div className={cn("p-3 rounded-lg rounded-tl-none", msg.error ? "bg-red-100 dark:bg-red-500/20" : "bg-gray-100 dark:bg-white/5")}><p className={cn(msg.error ? "text-red-800 dark:text-red-200" : "text-gray-800 dark:text-gray-200")}>{msg.text}</p></div></div>))}
                            {isLoading && (<div className="flex items-center gap-3 animate-fade-in"><div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0"><SparklesIcon className="h-5 w-5 text-violet-500 animate-pulse" /></div><p className="text-sm text-gray-500 italic">Córtex está preparando seu plano...</p></div>)}
                            
                            {clarification && (
                                <div className="flex items-start gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0"><SparklesIcon className="h-5 w-5 text-violet-500" /></div>
                                    <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg rounded-tl-none w-full">
                                        <p className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Encontrei mais de uma pessoa com esse nome. Para quem devo atribuir a tarefa?</p>
                                        <div className="flex flex-col gap-2 mt-2">
                                            {clarification.options.map(opt => <Button key={opt.id} variant="outline" onClick={() => handleClarificationChoice(opt)}> {opt.name} </Button>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {planToConfirm && (
                                <div className="flex items-start gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0"><SparklesIcon className="h-5 w-5 text-violet-500" /></div>
                                    <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg rounded-tl-none w-full">
                                        <p className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Certo, preparei o rascunho. Confirme os detalhes:</p>
                                        <div className="space-y-3 bg-white dark:bg-black/20 p-3 rounded-md">
                                            <div><Label>Título</Label><Input value={planToConfirm[0].payload.title} onChange={(e) => setPlanToConfirm([{ ...planToConfirm[0], payload: { ...planToConfirm[0].payload, title: e.target.value } }])} /></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><Label>Prazo</Label><DateField value={planToConfirm[0].payload.dueDate} onChange={(e) => setPlanToConfirm([{ ...planToConfirm[0], payload: { ...planToConfirm[0].payload, dueDate: e.target.value } }])} /></div>
                                                <div><Label>Responsável</Label><Select value={users.find(u => u.name === planToConfirm[0].payload.assignedToName)?.id || ''} onChange={(e) => setPlanToConfirm([{ ...planToConfirm[0], payload: { ...planToConfirm[0].payload, assignedToName: users.find(u => u.id === e.target.value)?.name } }])}><option>Selecione</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={handleReset}>Cancelar</Button><Button variant="violet" onClick={confirmExecution}>Confirmar e Criar Tarefa</Button></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>,
        document.body
    );
};
    const Sidebar = ({ onNavigate, currentPage, isSidebarOpen }) => { const { logout } = useAuth(); const navItems = [
    { id: 'dashboard', label: 'Painel de Controle', icon: HomeIcon },
    { id: 'leads', label: 'Leads', icon: TargetIcon },
    { id: 'clients', label: 'Clientes', icon: UsersIcon },
    { id: 'commissions', label: 'Comissões', icon: PercentIcon },
    { id: 'tasks', label: 'Minhas Tarefas', icon: CheckSquareIcon },
    { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
    { id: 'timeline', label: 'Time-Line', icon: HistoryIcon },
    { id: 'corporate', label: 'Corporativo', icon: BuildingIcon }
    ];; return (<aside className={cn("fixed top-0 left-0 z-40 w-64 h-full transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}><div className="h-full flex flex-col bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10"><div className="flex items-center justify-center h-20 flex-shrink-0"><h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider">OLYMPUS X</h2></div><nav className="flex-grow mt-6 px-4 space-y-2">{navItems.map(item => (<button key={item.id} onClick={() => onNavigate(item.id)} className={cn("w-full flex items-center p-3 rounded-lg transition-all duration-300 font-semibold", currentPage.startsWith(item.id) ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white")}><item.icon className="h-5 w-5 mr-3" /><span>{item.label}</span></button>))}</nav><div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto flex-shrink-0"><button onClick={() => onNavigate('profile')} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white mb-2"><UserCircleIcon className="h-5 w-5 mr-3" /><span>Meu Perfil</span></button><button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"><LogOutIcon className="h-5 w-5 mr-3" /><span>Sair</span></button></div></div></aside>); }
    const Header = ({ onToggleSidebar, onOpenCommandPalette }) => { 
    const { user } = useAuth(); 
    const { theme, toggleTheme } = useTheme(); 
    const { clients } = useData(); 
    const expiringContracts = useMemo(() => { 
        const today = new Date(); 
        const thirtyDaysFromNow = new Date(); 
        thirtyDaysFromNow.setDate(today.getDate() + 30); 
        return clients.filter(client => (client.contracts || []).some(contract => { 
            if (!contract.renewalDate) return false; 
            const endDate = new Date(contract.renewalDate + 'T00:00:00'); 
            return endDate >= today && endDate <= thirtyDaysFromNow; 
        })).length; 
    }, [clients]); 

    return (
        <header className="sticky top-0 z-30 h-20">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 dark:from-[#0D1117] to-transparent pointer-events-none"></div>
            <div className="relative flex items-center justify-between h-full px-6">
                <button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="hidden lg:block">
                    <Button variant="ghost" onClick={onOpenCommandPalette} className="text-gray-500 dark:text-gray-400">
                        <SparklesIcon className="h-5 w-5 mr-2 text-violet-500"/>
                        Assistente Córtex...
                        <span className="ml-4 text-xs border border-gray-400 dark:border-gray-600 rounded-md px-1.5 py-0.5">Ctrl K</span>
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alterar Tema">
                        {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}
                    </Button>
                    <div className="relative">
                        <Button variant="ghost" size="icon"><BellIcon className="h-6 w-6" /></Button>
                        {expiringContracts > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-[10px] ring-2 ring-white dark:ring-[#0D1117]">{expiringContracts}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-700">{user?.name?.[0]}</div>
                        <div className="text-right hidden sm:block">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.permissionLevel}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    ); 
}
function MainLoader() { const { user, loading } = useAuth(); if (loading) { return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0D1117] text-cyan-500 dark:text-cyan-400"><h1 className="text-4xl font-bold mb-4 animate-pulse">OLYMPUS X</h1><p>Inicializando Ecossistema...</p></div>); } if (!auth || !db) { return (<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0D1117] p-4"><GlassPanel className="w-full max-w-sm p-8 text-center"><h1 className="text-2xl font-bold text-center text-red-600 dark:text-red-400 mb-4">Erro de Configuração</h1><p className="text-center text-gray-600 dark:text-gray-300">Configuração do Firebase não encontrada.</p></GlassPanel></div>) } return user ? <MainApp /> : <LoginPage />; }

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