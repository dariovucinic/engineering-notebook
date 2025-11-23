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
            className="w-full flex flex-col shadow-md z-30 backdrop-blur-md border-b transition-all duration-300"
            style={{
                backgroundColor: 'var(--surface-color)',
                borderColor: 'var(--border-color)'
            }}
        >
            {/* Main Bar Header */}
            <div className="flex items-center justify-between px-4 py-2 h-14">
                <div className="flex items-center gap-4">
                    <Logo showText={true} size={28} />
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs font-medium flex items-center gap-2"
                        style={{ color: 'var(--text-secondary-color)' }}
                    >
                        <span>{isExpanded ? 'Collapse' : 'Expand'} Menu</span>
                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeSwitcher />
                </div>
            </div>

            {/* Collapsible Block Palette */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-32 opacity-100 border-t' : 'max-h-0 opacity-0'}`}
                style={{ borderColor: 'var(--border-color)' }}
            >
                <div className="p-3 overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-3 min-w-max px-2">
                        {blockTypes.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => onAddBlock(item.type)}
                                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 hover:shadow-md border border-transparent hover:scale-105 min-w-[80px]"
                                style={{
                                    color: 'var(--text-color)',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm transition-colors group-hover:text-white"
                                    style={{
                                        backgroundColor: 'var(--bg-color)',
                                    }}
                                >
                                    <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                                </div>

                                <span className="font-bold text-xs">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                button:hover .w-10 {
                    background-color: var(--accent-color) !important;
                }
            `}</style>
        </div>
    );
};

export default TopBar;
