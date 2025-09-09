import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Cria o Contexto
const ThemeContext = createContext();

// 2. Cria o Provedor do Contexto
export const ThemeProvider = ({ children }) => {
    // Tenta pegar o tema do localStorage ou usa 'light' como padrão
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // [IMPORTANTE] Este efeito aplica a classe ao HTML
    useEffect(() => {
        const root = window.document.documentElement; // Pega a tag <html>

        // Remove a classe antiga e adiciona a nova
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);

        // Salva a preferência no localStorage para persistir
        localStorage.setItem('theme', theme);
    }, [theme]); // Roda sempre que o estado 'theme' mudar

    // Função para alternar entre os temas
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const value = { theme, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// 3. Hook customizado para usar o contexto facilmente
export const useTheme = () => {
    return useContext(ThemeContext);
};