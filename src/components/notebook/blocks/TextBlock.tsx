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
        color: '#000000',
        fontSize: '14px',
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
        // Interpolate {variableName} with actual values
        const result = block.content.replace(/\{(\w+)\}/g, (match, varName) => {
            const value = scope.current[varName];
            return value !== undefined ? String(value) : match;
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
                <div className="flex items-center gap-2 mb-2">
                    <FormattingToolbar style={style} onChange={handleStyleChange} />

                    {/* Variable Selector */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVariables(!showVariables);
                            }}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${showVariables ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'}`}
                        >
                            {'{x}'} Vars
                        </button>
                        {showVariables && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto p-1">
                                    {variables.length > 0 ? (
                                        variables.map(v => (
                                            <button
                                                key={v}
                                                onClick={() => {
                                                    insertVariable(v);
                                                    setShowVariables(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center justify-between group/item"
                                            >
                                                <span className="font-mono text-xs">{v}</span>
                                                <span className="text-xs text-slate-400 group-hover/item:text-indigo-500">
                                                    {String(scope.current[v]).substring(0, 10)}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-slate-400 text-center">No variables</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <textarea
                    ref={textareaRef}
                    className="w-full flex-1 p-4 resize-none outline-none bg-white font-mono text-sm"
                    style={{
                        color: style.color,
                        fontSize: style.fontSize,
                        fontFamily: style.fontFamily,
                        textAlign: style.textAlign
                    }}
                    value={block.content}
                    onChange={(e) => onChange({ content: e.target.value })}
                    placeholder="Type markdown here... Use {varName} to display variables"
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
                <span className="text-slate-400 italic">Click to add text...</span>
            )}
        </div>
    );
};

export default TextBlock;
