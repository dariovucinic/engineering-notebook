'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FormulaBlock as FormulaBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Settings } from 'lucide-react';

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
        if (!block.content?.trim()) {
            setResults([]);
            return;
        }

        try {
            // Strip comment lines (starting with //) before evaluation
            const evaluatableContent = block.content
                .split('\n')
                .filter(line => !line.trim().startsWith('//'))
                .join('\n')
                .trim();

            if (!evaluatableContent) {
                setResults([]);
                return;
            }

            const res = evaluateFormula(evaluatableContent);

            let newResults: any[] = [];
            if (res && typeof res === 'object' && 'entries' in res && Array.isArray(res.entries)) {
                newResults = res.entries;
            } else if (res !== undefined) {
                newResults = [res];
            }

            setResults(newResults);
        } catch (err) {
            console.error("Error evaluating formula:", err);
            setResults([]);
        }
    }, [block.content, evaluateFormula, scope, scopeVersion]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const formatResult = (val: any): string => {
        if (typeof val === 'number') {
            return Number.isInteger(val) ? val.toString() : val.toFixed(4);
        }
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        return val !== undefined && val !== null ? val.toString() : '';
    };

    const getLatex = (expression: string) => {
        try {
            let latex = expression;
            // Convert (a * b) / c  or  a / b  ->  \frac{a * b}{c}
            // Strip outer parens from numerator/denominator so they don't appear in the rendered formula
            latex = latex.replace(
                /(\([^)]+\)|[a-zA-Z0-9_]+)\s*\/\s*(\([^)]+\)|[a-zA-Z0-9_]+)/g,
                (_, num, den) => {
                    const n = num.startsWith('(') && num.endsWith(')') ? num.slice(1, -1).trim() : num;
                    const d = den.startsWith('(') && den.endsWith(')') ? den.slice(1, -1).trim() : den;
                    return `\\frac{${n}}{${d}}`;
                }
            );

            const greekMap: Record<string, string> = {
                alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\delta', epsilon: '\\epsilon',
                zeta: '\\zeta', eta: '\\eta', theta: '\\theta', iota: '\\iota', kappa: '\\kappa',
                lambda: '\\lambda', mu: '\\mu', nu: '\\nu', xi: '\\xi', omicron: 'o',
                pi: '\\pi', rho: '\\rho', sigma: '\\sigma', tau: '\\tau', upsilon: '\\upsilon',
                phi: '\\phi', chi: '\\chi', psi: '\\psi', omega: '\\omega',
                Gamma: '\\Gamma', Delta: '\\Delta', Theta: '\\Theta', Lambda: '\\Lambda',
                Xi: '\\Xi', Pi: '\\Pi', Sigma: '\\Sigma', Upsilon: '\\Upsilon',
                Phi: '\\Phi', Psi: '\\Psi', Omega: '\\Omega'
            };

            latex = latex.replace(new RegExp(`\\b(${Object.keys(greekMap).join('|')})\\b`, 'g'), (match) => greekMap[match]);
            latex = latex
                .replace(/\*/g, '\\cdot ')
                .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
                .replace(/\^/g, '^');

            return latex;
        } catch (e) {
            return expression;
        }
    };

    // Detect if RHS of an assignment is a simple literal (no operators, no variable references)
    const isSimpleLiteral = (rhs: string): boolean => {
        // A simple literal is just a number, possibly with a sign
        return /^-?\d+(\.\d+)?$/.test(rhs.trim());
    };

    // Returns an array of {latex, result, isComment} objects for each line
    const getLineItems = () => {
        const lines = block.content.split('\n');
        const nonCommentLines = lines.filter(l => !l.trim().startsWith('//') && l.trim() !== '');

        let resultIndex = 0;

        return lines.map((line) => {
            if (!line.trim()) return { empty: true };

            if (line.trim().startsWith('//')) {
                return { isComment: true, text: line.trim().slice(2).trim() };
            }

            let resultVal: any = undefined;
            if (results.length > 0) {
                if (results.length === nonCommentLines.length) {
                    const idx = nonCommentLines.indexOf(line.trim());
                    resultVal = idx >= 0 ? results[idx] : undefined;
                } else if (results.length > resultIndex) {
                    resultVal = results[resultIndex];
                    resultIndex++;
                }
            }

            const isAssignment = line.includes('=');
            const rhs = isAssignment ? line.split('=').slice(1).join('=').trim() : '';
            const simple = isSimpleLiteral(rhs);

            // Build the display latex: if it's a computed expression (not a simple literal),
            // append = result inline into the formula itself.
            let displayLatex = getLatex(line);

            if (!simple && resultVal !== undefined && resultVal !== null) {
                const formattedResult = formatResult(resultVal);
                // Only append if the raw result differs from the literal RHS
                if (rhs !== formattedResult) {
                    displayLatex += ` = ${formattedResult}`;
                }
            }

            return { isComment: false, empty: false, latex: displayLatex };
        });
    };

    const handleStyleChange = (key: 'color' | 'fontSize', value: string) => {
        onChange({ style: { ...block.style, [key]: value } });
    };

    return (
        <div
            className="relative group flex flex-col h-full rounded-lg overflow-visible"
            style={{
                backgroundColor: 'var(--surface-color)',
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

            {/* Content Area */}
            <div
                className="flex-1 flex flex-col px-4 py-2 cursor-text"
                onClick={() => { if (!isEditing) setIsEditing(true); }}
            >
                {isEditing ? (
                    <textarea
                        ref={inputRef}
                        className="w-full font-mono text-sm outline-none bg-transparent resize-none overflow-hidden min-h-[1.5rem]"
                        style={{ color: 'var(--text-color)' }}
                        value={block.content}
                        onChange={(e) => {
                            onChange({ content: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                setIsEditing(false);
                            }
                        }}
                        placeholder="Write variables, formulas and operations..."
                        rows={1}
                    />
                ) : (
                    <div className="w-full flex flex-col gap-0.5">
                        {block.content ? (
                            getLineItems().map((item: any, i: number) => {
                                if (item.empty) return <div key={i} className="h-3" />;
                                if (item.isComment) return (
                                    <div key={i} className="text-sm italic" style={{ color: 'var(--text-secondary-color)', opacity: 0.6 }}>
                                        {item.text}
                                    </div>
                                );
                                return (
                                    <div key={i} className="min-h-[1.75rem] flex items-baseline">
                                        <InlineMath math={item.latex} />
                                    </div>
                                );
                            })
                        ) : (
                            <span className="italic text-sm" style={{ color: 'var(--text-secondary-color)' }}>Write variables, formulas and operations...</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormulaBlock;
