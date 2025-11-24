'use client';

import React, { useState } from 'react';
import { BlockType } from '@/types/block';
import Logo from '../ui/Logo';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface TopBarProps {
    onAddBlock: (type: BlockType) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onAddBlock }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const blockTypes: { type: BlockType; label: string; icon: string; description: string }[] = [
        { type: 'text', label: 'Text', icon: '📝', description: 'Rich text notes' },
        { type: 'script', label: 'Script', icon: '🐍', description: 'Python/JS code' },
        { type: 'formula', label: 'Formula', icon: '∑', description: 'Math equations' },
        { type: 'table', label: 'Table', icon: '▦', description: 'Data spreadsheet' },
        { type: 'data', label: 'Import', icon: '📊', description: 'Excel/CSV data' },
        { type: 'cad', label: 'CAD', icon: '🧊', description: '3D models' },
        { type: 'image', label: 'Image', icon: '🖼️', description: 'Upload images' },
    ];

    return (
        <div
            className="w-full flex flex-col z-30 transition-all duration-300 glass-heavy"
        >
            {/* Main Bar Header */}
            <div className="flex items-center justify-between px-4 py-1.5 h-11">
                <div className="flex items-center gap-3">
                    <Logo showText={true} size={22} />
                    <div className="h-5 w-px bg-gray-200/50 dark:bg-gray-700/50 mx-1" />

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="glass-button px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5"
                        style={{ color: 'var(--text-secondary-color)' }}
                    >
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                </div>
            </div>

            {/* Collapsible Block Palette */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-3 overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-3 min-w-max px-2">
                        {blockTypes.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => onAddBlock(item.type)}
                                className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300 hover:scale-105 min-w-[80px] glass-button border-transparent hover:border-accent"
                                style={{
                                    color: 'var(--text-color)',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-110"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.5)',
                                    }}
                                >
                                    <span className="filter drop-shadow-sm">{item.icon}</span>
                                </div>

                                <span className="font-semibold text-[10px] tracking-wide uppercase opacity-70 group-hover:opacity-100 transition-opacity">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-border-accent:hover {
                    border-color: var(--accent-color) !important;
                }
            `}</style>
        </div>
    );

};

export default TopBar;
