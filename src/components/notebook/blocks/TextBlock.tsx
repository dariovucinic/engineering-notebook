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

    if (isEditing) {
        return (
            <div ref={containerRef} className="w-full h-full flex flex-col">
                <FormattingToolbar style={style} onChange={handleStyleChange} />
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
