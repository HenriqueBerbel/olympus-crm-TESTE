import { useState, useEffect } from "react";

/**
 * Hook customizado que adia a atualização de um valor.
 * @param {any} value O valor a ser "debounceado" (ex: texto de um input).
 * @param {number} delay O atraso em milissegundos.
 * @returns O valor após o atraso.
 */
export function useDebounce(value, delay) {
    // Estado que irá guardar o valor final, após o atraso
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Cria um "timer" que só vai atualizar o estado após o 'delay'
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Função de limpeza: se o usuário digitar de novo, o timer antigo é cancelado
        // e um novo é criado. Essa é a mágica do debounce.
        return () => {
            clearTimeout(handler);
        };
    },
    [value, delay] // O efeito só roda de novo se o valor ou o delay mudarem
    );

    return debouncedValue;
}