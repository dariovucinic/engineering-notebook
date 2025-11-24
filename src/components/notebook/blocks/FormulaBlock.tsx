'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FormulaBlock as FormulaBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Settings, Palette, Type } from 'lucide-react';

interface FormulaBlockProps {
    block: FormulaBlockType;
    onChange: (updates: Partial<FormulaBlockType>) => void;
}

const COLORS = [
    { label: 'Default', value: 'var(--text-color)' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Green', value: '#10b981' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Orange', value: '#f97316' },
];

const SIZES = [
    { label: 'Small', value: '0.875rem' },
    { label: 'Normal', value: '1rem' },
    { label: 'Large', value: '1.25rem' },
    { label: 'Huge', value: '1.5rem' },
];

const FormulaBlock: React.FC<FormulaBlockProps> = ({ block, onChange }) => {
    const { evaluateFormula, scope, scopeVersion } = useComputation();
    const [results, setResults] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!block.content.trim()) {
            setResults([]);
            return;
        }

        const res = evaluateFormula(block.content);

        // Handle mathjs ResultSet or single result
        let newResults: any[] = [];
        if (res && typeof res === 'object' && 'entries' in res) {
            newResults = res.entries;
        } else {
            // If it's a single result, we need to map it to the correct line.
            // If there are multiple lines but only one result (e.g. only last line is an expression),
            // mathjs might just return that one result.
            // However, usually mathjs returns a ResultSet if the input has newlines.
            // Let's assume if it's not a ResultSet, it corresponds to the last line or the only line.
            newResults = [res];
        }

        setResults(newResults);

        // Store result in scope if variable name is provided (only for single line/result)
        if (block.variableName && block.variableName.trim() && newResults.length === 1) {
            scope.current[block.variableName.trim()] = newResults[0];
        }
    }, [block.content, block.variableName, evaluateFormula, scope, scopeVersion]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Auto-resize on open
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const formatResult = (val: any): string => {
        if (typeof val === 'number') {
            return Number.isInteger(val) ? val.toString() : val.toFixed(4);
        }
        if (typeof val === 'object') {
            // Handle arrays/matrices nicely
            return JSON.stringify(val);
        }
        return val !== undefined && val !== null ? val.toString() : '';
    };

    const getLatex = (expression: string) => {
        try {
            return expression
                .replace(/\*/g, '\\cdot ')
                .replace(/\//g, '\\div ')
                .replace(/pi/g, '\\pi')
                .replace(/theta/g, '\\theta')
                .replace(/alpha/g, '\\alpha')
                .replace(/beta/g, '\\beta')
                .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
                .replace(/\^/g, '^');
        } catch (e) {
            return expression;
        }
    };

    const getDisplayLatex = () => {
        const lines = block.content.split('\n');

        // If we have a single result but multiple lines, it's likely the result of the last expression.
        // If we have a ResultSet, entries correspond to expressions. 
        // Note: Empty lines are skipped by mathjs in the ResultSet.
        // This makes mapping tricky. We need to identify which lines are expressions.
        // Simple approach: Map results to non-empty lines? 
        // Or better: rely on the fact that we want to show results for lines that generate them.

        let resultIndex = 0;

        const displayLines = lines.map((line) => {
            if (!line.trim()) return ''; // Skip empty lines in display? Or keep them empty.

            let latex = getLatex(line);

            // Try to find a result for this line
            // If results is an array from ResultSet, it matches expression order.
            let resultVal = undefined;

            // Heuristic: if the line looks like an expression (not empty, not just comment), consume a result.
            // This is imperfect but might work for now.
            if (results.length > 0) {
                // If results is just one item and we are at the last non-empty line?
                // Let's assume 1-to-1 mapping if results.length == lines.length (excluding empty?)
                // Actually, let's just use the index if it matches, otherwise fallback.

                if (results.length === lines.length) {
                    resultVal = results[lines.indexOf(line)]; // This is wrong if duplicate lines.
                } else {
                    // If lengths differ, we can't easily map. 
                    // Fallback: show result only on the last line if it's a single result.
                    if (results.length === 1 && line === lines[lines.length - 1]) {
                        resultVal = results[0];
                    } else if (results.length > resultIndex) {
                        resultVal = results[resultIndex];
                        resultIndex++;
                    }
                }
            }

            if (resultVal !== undefined && resultVal !== null) {
                const formattedResult = formatResult(resultVal);

                // Check if result is redundant (e.g. a = 5, result is 5)
                const isAssignment = line.includes('=');
                const rhs = isAssignment ? line.split('=').pop()?.trim() : line.trim();

                // If the RHS is exactly the result, don't show it
                if (rhs !== formattedResult) {
                    latex += ` = ${formattedResult}`;
                }
            }

            return `&${latex}`;
        });

        if (block.variableName) {
            if (displayLines.length > 0) {
                displayLines[0] = `&${block.variableName} = ` + displayLines[0].substring(1);
            }
        }

        return `\\begin{aligned} ${displayLines.join(' \\\\ ')} \\end{aligned}`;
    };

    const handleStyleChange = (key: 'color' | 'fontSize', value: string) => {
        onChange({
            style: {
                ...block.style,
                [key]: value
            }
        });
    };

    return (
        <div
            className="relative group flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg overflow-visible"
            style={{
                color: block.style?.color || 'var(--text-color)',
                fontSize: block.style?.fontSize || '1rem',
            }}
        >
            {/* Settings Toolbar */}
            <div className={`absolute -top-10 right-0 flex items-center gap-2 p-1.5 rounded-lg glass shadow-lg transition-all duration-200 z-50 ${showSettings ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => handleStyleChange('color', c.value)}
                            className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    {SIZES.map((s) => (
                        <button
                            key={s.value}
                            onClick={() => handleStyleChange('fontSize', s.value)}
                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium ${block.style?.fontSize === s.value ? 'bg-black/5 dark:bg-white/5' : ''}`}
                            title={s.label}
                        >
                            {s.label[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings Toggle */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="absolute top-1 right-1 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <Settings size={14} />
            </button>

            <div
                className="flex-1 flex items-center px-4 py-2"
                onDoubleClick={() => setIsEditing(true)}
            >
                {isEditing ? (
                    <div className="flex items-start gap-2 w-full">
                        <input
                            className="w-16 font-mono text-sm outline-none border-b border-gray-300 focus:border-indigo-500 bg-transparent text-right pt-1"
                            value={block.variableName || ''}
                            onChange={(e) => onChange({ variableName: e.target.value })}
                            placeholder="var"
                        />
                        <span className="font-mono pt-1">=</span>
                        <textarea
                            ref={inputRef}
                            className="flex-1 font-mono text-sm outline-none border-b border-gray-300 focus:border-indigo-500 bg-transparent resize-none overflow-hidden min-h-[1.5rem]"
                            value={block.content}
                            onChange={(e) => {
                                onChange({ content: e.target.value });
                                // Auto-resize
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    setIsEditing(false);
                                }
                            }}
                            placeholder="Write variables, formulas and operations"
                            rows={1}
                        />
                    </div>
                ) : (
                    <div className="w-full cursor-text">
                        {block.content ? (
                            <InlineMath math={getDisplayLatex()} />
                        ) : (
                            <span className="text-gray-400 italic text-sm">Write variables, formulas and operations...</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormulaBlock;
