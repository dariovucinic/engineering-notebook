'use client';

import React, { useState } from 'react';
import { ScriptBlock as ScriptBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';

interface ScriptBlockProps {
    block: ScriptBlockType;
    onChange: (updates: Partial<ScriptBlockType>) => void;
}

const ScriptBlock: React.FC<ScriptBlockProps> = ({ block, onChange }) => {
    const { runScript, pyodideReady, webRReady } = useComputation();
    const [isExecuting, setIsExecuting] = useState(false);

    const language = block.language || 'python';

    const handleRun = async () => {
        setIsExecuting(true);
        const result = await runScript(block.content, language);
        onChange({ output: result });
        setIsExecuting(false);
    };

    const handleLanguageChange = (newLanguage: 'python' | 'r') => {
        onChange({ language: newLanguage });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const value = block.content;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);

            onChange({ content: newValue });

            // We need to set the cursor position after the state update
            // Using setTimeout to ensure it runs after render
            setTimeout(() => {
                if (e.target instanceof HTMLTextAreaElement) {
                    e.target.selectionStart = e.target.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 bg-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-md">
                        <span className="text-xs font-bold text-slate-500 tracking-wider">SCRIPT</span>
                    </div>
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value as 'python' | 'r')}
                        className="text-xs font-medium text-slate-700 bg-transparent outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                        <option value="python" disabled={!pyodideReady}>
                            Python {!pyodideReady && '(loading...)'}
                        </option>
                        <option value="r" disabled={!webRReady}>
                            R {!webRReady && '(loading...)'}
                        </option>
                    </select>
                </div>
                <button
                    onClick={handleRun}
                    className={`
                        p-1.5 rounded-md transition-all duration-200
                        ${isExecuting
                            ? 'text-slate-300 cursor-wait'
                            : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    disabled={isExecuting || (language === 'python' && !pyodideReady) || (language === 'r' && !webRReady)}
                    title={isExecuting ? 'Running...' : 'Run Script'}
                >
                    {isExecuting ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="flex-1 relative group">
                <textarea
                    className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent resize-none outline-none text-slate-800 leading-relaxed"
                    value={block.content}
                    onChange={(e) => onChange({ content: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'python' ? '# Write Python code here...' : '# Write R code here...'}
                    spellCheck={false}
                />
            </div>
            {block.output && (
                <div className="max-h-[40%] overflow-auto p-3 bg-white border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Output</div>
                    <div className="font-mono text-xs text-slate-700 whitespace-pre-wrap break-words">
                        {block.output}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptBlock;
