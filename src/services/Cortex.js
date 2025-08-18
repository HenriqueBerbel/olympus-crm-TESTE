// src/services/Cortex.js

import { formatDateTime } from "../utils";

// --- CORTEX AI (GEMINI) ---
const GEMINI_API_KEY = "AIzaSyBblrqaeYhLpze4QqNlACEFJpC4ek-7z3Y"; // Sua chave de API
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

const SYSTEM_KNOWLEDGE_BASE = `
## Persona e Missão
        Você é Córtex, o co-piloto de IA do sistema Olympus X CRM, uma plataforma para corretores de seguros de saúde.
        Sua missão é ser o assistente mais inteligente e proativo do mercado, eliminando a necessidade de navegação manual, respondendo dúvidas e executando ações complexas através de comandos simples.
        Seu tom é amigável, especialista, convidativo e um pouco futurista. Você sempre busca reduzir o trabalho do usuário.
... (O restante da sua base de conhecimento gigante) ...
`;


const apiClient = async (prompt) => {
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

const Cortex = {
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

    summarizeHistory: async (client) => {
        const observationsText = (client.observations || [])
            .map(obs => `Em ${formatDateTime(obs.timestamp)} por ${obs.authorName}: ${obs.text}`)
            .join('\n');
        const prompt = `Resuma o seguinte histórico de observações de um cliente em 3 a 4 bullet points concisos. Foque nos pontos mais importantes para um rápido entendimento do relacionamento. Histórico: "${observationsText || 'Nenhum histórico de observações.'}"`;
        
        const response = await apiClient(prompt);
        return response.data;
    },

    getHelp: async (question) => {
        const prompt = `${SYSTEM_KNOWLEDGE_BASE}\n\nO usuário perguntou: "${question}".\n\nResponda a pergunta dele com base no seu conhecimento profundo do sistema.`;
        const response = await apiClient(prompt);
        return response.data;
    }
};

export default Cortex;