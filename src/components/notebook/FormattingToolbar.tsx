/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React from 'react';
import { BlockStyle } from '@/types/block';

interface FormattingToolbarProps {
    style: BlockStyle;
    onChange: (newStyle: BlockStyle) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ style, onChange }) => {
    const handleChange = (key: keyof BlockStyle, value: string) => {
        onChange({ ...style, [key]: value });
    };

    return (
        <div className="formatting-toolbar flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm mb-2" onClick={(e) => e.stopPropagation()}>
            {/* Color Picker */}
            <div className="relative group">
                <input
                    type="color"
                    value={style.color || '#000000'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                    title="Text Color"
                />
            </div>

            <div className="w-px h-4 bg-slate-200" />

            {/* Font Size */}
            <select
                value={style.fontSize || '14px'}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer text-slate-600"
                title="Font Size"
            >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
            </select>

            <div className="w-px h-4 bg-slate-200" />

            {/* Font Family */}
            <select
                value={style.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer text-slate-600 max-w-[100px]"
                title="Font Family"
            >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times</option>
                <option value="'Courier New', monospace">Courier</option>
                <option value="Georgia, serif">Georgia</option>
            </select>

            <div className="w-px h-4 bg-slate-200" />

            {/* Alignment */}
            <div className="flex gap-1">
                <button
                    onClick={() => handleChange('textAlign', 'left')}
                    className={`p-1 rounded hover:bg-slate-100 ${style.textAlign === 'left' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500'}`}
                    title="Align Left"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
                </button>
                <button
                    onClick={() => handleChange('textAlign', 'center')}
                    className={`p-1 rounded hover:bg-slate-100 ${style.textAlign === 'center' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500'}`}
                    title="Align Center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
                </button>
                <button
                    onClick={() => handleChange('textAlign', 'right')}
                    className={`p-1 rounded hover:bg-slate-100 ${style.textAlign === 'right' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500'}`}
                    title="Align Right"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};

export default FormattingToolbar;
