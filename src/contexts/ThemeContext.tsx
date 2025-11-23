'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'engineering';

interface ThemeColors {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    grid: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
    light: {
        primary: '#475569', // Slate Grey
        accent: '#10b981', // Emerald Green
        background: '#f8fafc', // White / Light Grey
        surface: '#ffffff',
        text: '#1e293b', // Dark Slate
        textSecondary: '#64748b',
        border: '#e2e8f0',
        grid: '#cbd5e1'
    },
    dark: {
        primary: '#0f172a', // Deep Navy Blue
        accent: '#3b82f6', // Electric Blue
        background: '#020617', // Very dark grey/blue
        surface: '#1e293b',
        text: '#f8fafc', // Off-white
        textSecondary: '#94a3b8',
        border: '#334155',
        grid: '#1e293b'
    },
    engineering: {
        primary: '#2563eb', // Blueprint Blue
        accent: '#f97316', // Construction Orange
        background: '#eff6ff', // Grid-like light blue tint
        surface: '#ffffff',
        text: '#1e3a8a', // Navy
        textSecondary: '#60a5fa',
        border: '#bfdbfe',
        grid: '#93c5fd'
    }
};

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeMode>('light');

    // Load theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('flowsheet-theme') as ThemeMode;
        if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
        }
    }, []);

    // Save theme to local storage and update CSS variables
    useEffect(() => {
        localStorage.setItem('flowsheet-theme', theme);

        const root = document.documentElement;
        const colors = themes[theme];

        root.style.setProperty('--primary-color', colors.primary);
        root.style.setProperty('--accent-color', colors.accent);
        root.style.setProperty('--bg-color', colors.background);
        root.style.setProperty('--surface-color', colors.surface);
        root.style.setProperty('--text-color', colors.text);
        root.style.setProperty('--text-secondary-color', colors.textSecondary);
        root.style.setProperty('--border-color', colors.border);
        root.style.setProperty('--grid-color', colors.grid);

        // Update body background
        document.body.style.backgroundColor = colors.background;
        document.body.style.color = colors.text;

    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors: themes[theme] }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
