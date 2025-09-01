import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

// --- FUNÇÕES AUXILIARES ---

// Verifica se o item é um objeto puro (e não um array ou null)
const isObject = (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Função que mescla dois objetos de forma "profunda" (recursiva).
 * Essencial para que as permissões individuais complexas sobrescrevam as do cargo corretamente.
 * @param {object} target - O objeto base (permissões do cargo).
 * @param {object} source - O objeto que sobrescreve (permissões individuais).
 * @returns {object} - O objeto final mesclado.
 */
const deepMerge = (target, source) => {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};


// --- HOOK PRINCIPAL ---

export const usePermissions = () => {
    const { user } = useAuth();
    const { roles } = useData();

    // O useMemo garante que as permissões sejam calculadas apenas quando o usuário ou os cargos mudarem.
    const permissions = useMemo(() => {
        if (!user || !Array.isArray(roles) || roles.length === 0) {
            return {};
        }

        // 1. Encontra o cargo (role) do usuário logado.
        const userRole = roles.find(r => r.id === user.roleId);

        // 2. Define as permissões base a partir do cargo.
        const basePermissions = userRole ? JSON.parse(JSON.stringify(userRole.permissions || {})) : {};

        // 3. Pega as permissões individuais do usuário, se existirem.
        const userSpecificPermissions = user.permissions || {};

        // 4. [MODIFICADO] Usa a função de deepMerge para combinar as permissões.
        const mergedPermissions = deepMerge(basePermissions, userSpecificPermissions);
        
        return mergedPermissions;

    }, [user, roles]);

    /**
     * Verifica se o usuário tem permissão para uma ação específica em um módulo.
     * @param {string} module - O nome do módulo (ex: 'clients', 'corporate').
     * @param {string} action - A ação a ser verificada (ex: 'view', 'create', 'manageUsers').
     * @returns {boolean} - Retorna 'true' se o usuário tiver a permissão, 'false' caso contrário.
     */
    const can = (module, action) => {
        // SuperAdmin e CEO sempre têm acesso total.
        if (user?.role?.name === 'SuperAdmin' || user?.role?.name === 'CEO') {
            return true;
        }

        if (!permissions || !permissions[module]) {
            return false;
        }

        const permission = permissions[module][action];

        // [MODIFICADO] A lógica agora entende os dois tipos de permissão.

        // Caso 1: Permissão booleana simples (ex: corporate: { manageUsers: true } ou clients: { create: true })
        if (typeof permission === 'boolean') {
            return permission;
        }

        // Caso 2: Objeto de permissão complexo (ex: clients: { view: { scope: 'todos' } })
        if (isObject(permission) && permission.scope) {
            // Considera que ter qualquer escopo diferente de 'nenhum' é ter a permissão de acesso.
            // A filtragem específica (próprio, todos, etc.) é feita na página de listagem.
            return permission.scope !== 'nenhum';
        }
        
        // Se a permissão não for encontrada ou tiver um formato inválido, nega o acesso.
        return false;
    };

    return { permissions, can };
};