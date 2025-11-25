'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { useState } from 'react';
import { BlockType } from '@/types/block';
import Logo from '../ui/Logo';
import { FileCode2, Box, Image as ImageIcon } from 'lucide-react';

interface LeftSidebarProps {
    onAddBlock: (type: BlockType) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onAddBlock }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
        { type: 'text', label: 'Text', icon: '📝', description: 'Rich text notes' },
        { type: 'script', label: 'Script', icon: <FileCode2 className="w-6 h-6 text-blue-500" />, description: 'Python/JS code' },
        { type: 'formula', label: 'Formula', icon: '∑', description: 'Math equations' },
        { type: 'table', label: 'Table', icon: '▦', description: 'Data spreadsheet' },
        { type: 'data', label: 'Import', icon: '📊', description: 'Excel/CSV data' },
        { type: 'cad', label: 'CAD', icon: <Box className="w-6 h-6 text-sky-500" />, description: '3D models' },
        { type: 'image', label: 'Image', icon: <ImageIcon className="w-6 h-6 text-purple-500" />, description: 'Upload images' },
    ];

    return (
        <div
            className={`h-full flex flex-col z-30 transition-all duration-300 glass-heavy border-r border-white/10 ${isExpanded ? 'w-64' : 'w-16'}`}
        >
            {/* Header / Logo */}
            <div className="flex items-center justify-between p-4 h-16">
                <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    <Logo showText={true} size={24} />
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 transition-colors"
                >
                    {isExpanded ? '◀' : '▶'}
                </button>
            </div>

            {/* Block Palette */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {blockTypes.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => onAddBlock(item.type)}
                        className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 w-full hover:bg-white/40 dark:hover:bg-black/20 border border-transparent hover:border-white/20 ${!isExpanded ? 'justify-center' : ''}`}
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm glass-button group-hover:scale-110 transition-transform duration-200"
                        >
                            <span className="filter drop-shadow-sm">{item.icon}</span>
                        </div>

                        {isExpanded && (
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-semibold text-sm" style={{ color: 'var(--text-color)' }}>{item.label}</span>
                                <span className="text-[10px] truncate w-full text-left" style={{ color: 'var(--text-secondary-color)' }}>{item.description}</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Footer Area (Optional) */}
            <div className="p-4 border-t border-white/10">
                {/* Placeholder for future settings or user profile */}
            </div>
        </div>
    );
};

export default LeftSidebar;
