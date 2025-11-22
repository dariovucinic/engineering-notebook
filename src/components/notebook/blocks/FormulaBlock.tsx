'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FormulaBlock as FormulaBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface FormulaBlockProps {
    block: FormulaBlockType;
    onChange: (updates: Partial<FormulaBlockType>) => void;
}

const FormulaBlock: React.FC<FormulaBlockProps> = ({ block, onChange }) => {
    const { evaluateFormula, scope, scopeVersion } = useComputation();
    const [result, setResult] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!block.content.trim()) {
            setResult('');
            return;
        }

        const res = evaluateFormula(block.content);
        setResult(res.toString());

        // Store result in scope if variable name is provided
        if (block.variableName && block.variableName.trim()) {
            scope.current[block.variableName.trim()] = res;
        }
    }, [block.content, block.variableName, evaluateFormula, scope, scopeVersion]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Simple heuristic to convert mathjs expression to LaTeX
    // For complex cases, we might need a proper parser or mathjs.toTex()
    const getLatex = (expression: string) => {
        try {
            // Basic replacements for common operators
            let latex = expression
                .replace(/\*/g, '\\cdot ')
                .replace(/\//g, '\\div ')
                .replace(/pi/g, '\\pi')
                .replace(/theta/g, '\\theta')
                .replace(/alpha/g, '\\alpha')
                .replace(/beta/g, '\\beta')
                .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
                .replace(/\^/g, '^');

            // Handle newlines
            if (latex.includes('\n')) {
                return `\\begin{aligned} ${latex.replace(/\n/g, ' \\\\ ')} \\end{aligned}`;
            }
            return latex;
        } catch (e) {
            return expression;
        }
    };

    return (
        <div
            className="flex flex-col h-full bg-white border border-gray-200 rounded shadow-sm overflow-hidden"
            onDoubleClick={() => setIsEditing(true)}
        >
            <div className="flex items-center gap-2 p-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1">
                    <input
                        className="w-16 font-mono text-xs outline-none border border-transparent hover:border-gray-300 focus:border-indigo-300 rounded px-1 bg-transparent transition-colors text-right"
                        value={block.variableName || ''}
                        onChange={(e) => onChange({ variableName: e.target.value })}
                        placeholder="var"
                    />
                    <span className="text-gray-400 font-mono">=</span>
                </div>

                <div className="flex-1 min-w-0 relative">
                    {isEditing ? (
                        <textarea
                            ref={inputRef}
                            className="w-full font-mono text-sm outline-none bg-white border border-indigo-200 rounded px-2 py-1 shadow-sm resize-y min-h-[2rem]"
                            value={block.content}
                            onChange={(e) => onChange({ content: e.target.value })}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    setIsEditing(false);
                                }
                            }}
                            placeholder="e.g. a * b"
                            rows={Math.max(1, block.content.split('\n').length)}
                        />
                    ) : (
                        <div
                            className="w-full min-h-[2rem] flex items-center px-2 cursor-text hover:bg-gray-100/50 rounded transition-colors whitespace-pre-wrap"
                            onClick={() => setIsEditing(true)}
                        >
                            {block.content ? (
                                <span className="text-lg text-gray-800">
                                    <InlineMath math={getLatex(block.content)} />
                                </span>
                            ) : (
                                <span className="text-gray-400 text-sm italic">Empty formula...</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 p-2 bg-white flex items-center justify-end">
                <span className="font-mono text-xl font-bold text-gray-800 tracking-tight">
                    {result || '...'}
                </span>
            </div>
        </div>
    );
};

export default FormulaBlock;
