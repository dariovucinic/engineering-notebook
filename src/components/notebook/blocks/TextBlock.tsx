'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useRef, useEffect, useState } from 'react';
import { TextBlock as TextBlockType, BlockStyle } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import ReactMarkdown from 'react-markdown';
import FormattingToolbar from '../FormattingToolbar';

interface TextBlockProps {
    block: TextBlockType;
    onChange: (updates: Partial<TextBlockType>) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ block, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { scope, scopeVersion } = useComputation();
    const [interpolated, setInterpolated] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [showVariables, setShowVariables] = useState(false);

    const style = block.style || {
        color: '#ffffff', // Default to white for dark mode
        fontSize: '16px', // Slightly larger for readability
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left'
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
        }
    }, [block.content, isEditing]);

    useEffect(() => {
        // Interpolate {expression} with actual values
        // Updated regex to match expressions like {varName}, {var['key']}, {var[0][1]}, etc.
        const result = block.content.replace(/\{([^}]+)\}/g, (match, expression) => {
            try {
                // Try to evaluate the expression against the scope
                // First, check if it's a simple variable name
                const trimmedExpr = expression.trim();

                // Create a function that can access scope variables
                const scopeKeys = Object.keys(scope.current);
                const scopeValues = Object.values(scope.current);

                // Build a function that takes scope values as arguments
                const fn = new Function(...scopeKeys, `return ${trimmedExpr}`);
                const value = fn(...scopeValues);

                return value !== undefined ? String(value) : match;
            } catch (e) {
                // If evaluation fails, return the original match
                return match;
            }
        });
        setInterpolated(result);
    }, [block.content, scope, scopeVersion]);

    const handleStyleChange = (newStyle: BlockStyle) => {
        onChange({ style: newStyle });
    };

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsEditing(false);
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    const insertVariable = (varName: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const text = block.content;
            const newText = text.substring(0, start) + `{${varName}}` + text.substring(end);
            onChange({ content: newText });

            // Restore focus and cursor position
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(start + varName.length + 2, start + varName.length + 2);
                }
            }, 0);
        }
    };

    if (isEditing) {
        const variables = Object.keys(scope.current).filter(k => !k.startsWith('_'));

        return (
            <div ref={containerRef} className="w-full h-full flex flex-col">
                <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <FormattingToolbar style={style} onChange={handleStyleChange} />

                    {/* Variable Selector */}
                    <div className="relative ml-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVariables(!showVariables);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${showVariables ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            {'{x}'} Vars
                        </button>
                        {showVariables && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] rounded-lg shadow-2xl border border-white/10 overflow-hidden z-50">
                                <div className="p-2 border-b border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Available Variables</div>
                                <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {variables.length > 0 ? (
                                        variables.map(v => (
                                            <button
                                                key={v}
                                                onClick={() => {
                                                    insertVariable(v);
                                                    setShowVariables(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded flex items-center justify-between group/item transition-colors"
                                            >
                                                <span className="font-mono text-xs text-cyan-400">{v}</span>
                                                <span className="text-[10px] text-white/30 font-mono group-hover/item:text-white/50">
                                                    {String(scope.current[v]).substring(0, 15)}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-4 text-xs text-white/20 text-center italic">No variables yet</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <textarea
                    ref={textareaRef}
                    className="w-full flex-1 p-6 resize-none outline-none bg-transparent font-sans leading-relaxed custom-scrollbar selection:bg-cyan-500/30"
                    style={{
                        color: style.color || '#ffffff', // Fallback to white if null
                        fontSize: style.fontSize,
                        fontFamily: style.fontFamily,
                        textAlign: style.textAlign
                    }}
                    value={block.content}
                    onChange={(e) => onChange({ content: e.target.value })}
                    placeholder="Type notes here... Use {variable} to show values."
                />
            </div>
        );
    }

    return (
        <div
            className="w-full h-full p-4 overflow-y-auto cursor-text prose prose-sm max-w-none"
            style={{
                color: style.color,
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                textAlign: style.textAlign
            }}
            onClick={() => setIsEditing(true)}
        >
            {block.content ? (
                <ReactMarkdown
                    components={{
                        p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                        h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold mb-2" {...props} />,
                        h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold mb-2" {...props} />,
                        h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold mb-2" {...props} />,
                        ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-2" {...props} />,
                        ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-2" {...props} />,
                        code: ({ node, ...props }: any) => <code className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-pink-500" {...props} />,
                    }}
                >
                    {interpolated}
                </ReactMarkdown>
            ) : (
                <span className="text-white/20 italic font-light">Click to add text...</span>
            )}
        </div>
    );
};

export default TextBlock;
