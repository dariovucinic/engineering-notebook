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
import { motion } from 'framer-motion';

interface LeftSidebarProps {
    onAddBlock: (type: BlockType) => void;
    onExport: () => void;
    onImport: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onAddBlock, onExport, onImport }) => {
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
            className={`flex flex-col z-30 transition-all duration-300 glass border border-white/10 rounded-xl my-4 ml-4 ${isExpanded ? 'w-64' : 'w-16'}`}
            style={{
                borderColor: 'var(--border-color)',
                height: 'calc(100% - 2rem)',
                boxShadow: '0 0 20px rgba(0,0,0,0.2), 0 0 40px -10px var(--accent-color)'
            }}
        >
            {/* Toggle Handle - now integrated into the top of the bar or just the side */}
            <div className="flex justify-end p-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded hover:bg-white/10 text-[var(--accent-color)] transition-colors opacity-50 hover:opacity-100"
                >
                    {isExpanded ? '◀' : '▶'}
                </button>
            </div>

            {/* Block Palette */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {blockTypes.map((item) => (
                    <motion.button
                        key={item.type}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onAddBlock(item.type)}
                        className={`group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 w-full hover:bg-white/5 border border-transparent hover:border-white/10 ${!isExpanded ? 'justify-center' : ''}`}
                    >
                        <div
                            className="w-8 h-8 rounded flex items-center justify-center text-lg shadow-sm glass group-hover:shadow-[0_0_10px_var(--accent-color)] transition-all duration-200"
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <span className="filter drop-shadow-sm">{item.icon}</span>
                        </div>

                        {isExpanded && (
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-medium text-sm tracking-wide" style={{ color: 'var(--text-color)' }}>{item.label}</span>
                                <span className="text-[10px] truncate w-full text-left uppercase tracking-wider opacity-60" style={{ color: 'var(--text-secondary-color)' }}>{item.description}</span>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Footer Area */}
            <div className="p-4 border-t border-white/10 space-y-2">
                <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onImport}
                    className={`group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 w-full hover:bg-white/5 border border-transparent hover:border-white/10 ${!isExpanded ? 'justify-center' : ''}`}
                    title="Import Notebook"
                >
                    <div className="w-8 h-8 rounded flex items-center justify-center text-lg shadow-sm glass group-hover:text-emerald-400 group-hover:shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-200">
                        📂
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>Import</span>
                        </div>
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onExport}
                    className={`group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 w-full hover:bg-white/5 border border-transparent hover:border-white/10 ${!isExpanded ? 'justify-center' : ''}`}
                    title="Export"
                >
                    <div className="w-8 h-8 rounded flex items-center justify-center text-lg shadow-sm glass group-hover:text-indigo-400 group-hover:shadow-[0_0_10px_rgba(129,140,248,0.3)] transition-all duration-200">
                        📥
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>Export</span>
                        </div>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

export default LeftSidebar;
