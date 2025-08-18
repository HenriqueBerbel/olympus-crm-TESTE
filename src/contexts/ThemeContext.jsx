import React, { useState, createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const value = { theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);