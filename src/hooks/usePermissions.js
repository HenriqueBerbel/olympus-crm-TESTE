import { useAuth } from '../contexts/AuthContext';

/**
 * Hook customizado para verificar as permissões do usuário logado de forma granular.
 * Ele lê a estrutura de permissões que definimos e permite checagens detalhadas.
 * Ex: can('clients', 'view') retorna 'own', 'team', 'all' ou false.
 * Ex: can('clients', 'create') retorna true ou false.
 */
const usePermissions = () => {
    const { user } = useAuth();

    // Se o usuário ainda não carregou ou não tem um cargo definido, nega tudo por segurança.
    if (!user || !user.role) {
        return { 
            can: () => false, 
            permissions: {},
            roleName: 'none', 
            user: null 
        };
    }

    const rolePermissions = user.role.permissions || {};
    const userOverrides = user.customPermissions || {};

    /**
     * A função principal que verifica se o usuário tem uma permissão.
     * @param {string} module - O módulo a ser verificado (ex: 'clients', 'tasks', 'corporate').
     * @param {string} action - A ação a ser verificada (ex: 'view', 'create', 'edit', 'delete', 'manageUsers').
     * @returns {string|boolean} - Retorna o escopo ('own', 'team', 'all') ou um booleano (true/false).
     */
    const can = (module, action) => {
        // Prioridade 1: Verifica se existe uma permissão customizada (override) no perfil do usuário.
        if (userOverrides[module] && userOverrides[module][action] !== undefined) {
            return userOverrides[module][action];
        }

        // Prioridade 2: Se não houver override, usa a permissão padrão do cargo (role).
        if (rolePermissions[module] && rolePermissions[module][action] !== undefined) {
            return rolePermissions[module][action];
        }

        // Se nenhuma regra foi encontrada em nenhum dos níveis, nega a permissão por padrão.
        return false;
    };

    return { 
        user, 
        roleName: user.role.name, // Ex: "Supervisor", "Corretor"
        permissions: rolePermissions, // Objeto com as permissões base do cargo
        can // A função para fazer as checagens
    };
};

export default usePermissions;