'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TextBlock as TextBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';

interface TextBlockProps {
    block: TextBlockType;
    onChange: (content: string) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ block, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { scope, scopeVersion } = useComputation();
    const [interpolated, setInterpolated] = useState<string>('');

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [block.content]);

    useEffect(() => {
        // Interpolate {variableName} with actual values
        const result = block.content.replace(/\{(\w+)\}/g, (match, varName) => {
            const value = scope.current[varName];
            return value !== undefined ? String(value) : match;
        });
        setInterpolated(result);
    }, [block.content, scope, scopeVersion]);

    return (
        <div className="h-full w-full flex flex-col gap-1">
            <textarea
                ref={textareaRef}
                className="w-full p-2 resize-none outline-none bg-transparent text-left"
                dir="ltr"
                value={block.content}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type here... Use {varName} to display variables"
            />
            {interpolated !== block.content && (
                <div className="px-2 py-1 text-sm text-gray-600 bg-gray-50 rounded border-t border-gray-200 whitespace-pre-wrap">
                    {interpolated}
                </div>
            )}
        </div>
    );
};

export default TextBlock;
