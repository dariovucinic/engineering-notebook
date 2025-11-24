'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: { mode: ThemeMode; label: string; icon: string }[] = [
        { mode: 'light', label: 'Clean Slate', icon: '☀️' },
        { mode: 'dark', label: 'Deep Space', icon: '🌙' },
        { mode: 'engineering', label: 'Blueprint', icon: '📐' }
    ];

    const currentTheme = themes.find(t => t.mode === theme) || themes[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
                style={{ color: 'var(--text-color)' }}
            >
                <span className="text-lg">{currentTheme.icon}</span>
                <span className="text-sm font-medium flex-1">{currentTheme.label}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full right-0 w-48 mt-2 py-1 rounded-xl glass z-50 overflow-hidden"
                    style={{
                        borderColor: 'var(--border-color)'
                    }}
                >
                    {themes.map((t) => (
                        <button
                            key={t.mode}
                            onClick={() => {
                                setTheme(t.mode);
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                            style={{
                                color: theme === t.mode ? 'var(--accent-color)' : 'var(--text-color)',
                                fontWeight: theme === t.mode ? 'bold' : 'normal'
                            }}
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-sm">{t.label}</span>
                            {theme === t.mode && (
                                <span className="ml-auto text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
