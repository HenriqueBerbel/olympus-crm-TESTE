import React, { useState, createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
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

export const usePreferences = () => useContext(PreferencesContext);