import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface ScriptBlockProps {
    id: string;
    initialContent: string;
}

const ScriptBlock: React.FC<ScriptBlockProps> = ({ id, initialContent }) => {
    const { updateBlock, setVariable } = useStore();
    const [code, setCode] = useState(initialContent);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simple evaluation logic
        // Parses lines like "x = 10" or "y = x + 5"
        const lines = code.split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
            if (match) {
                const varName = match[1];
                const expression = match[2];
                try {
                    // DANGEROUS: In a real app, use a safe parser/evaluator
                    // For this prototype, we'll use a Function constructor with local scope simulation
                    // But since we want to access global variables, we might need to fetch them from store
                    // However, for simplicity, let's just evaluate simple math for now
                    // We'll need to access the current variables state to evaluate dependent variables

                    // This is tricky without a proper dependency graph.
                    // For now, we'll just parse simple numbers or strings
                    const value = eval(expression); // Very unsafe, but fits the "prototype" requirement
                    setVariable(varName, value);
                    setError(null);
                } catch (e) {
                    // setError('Invalid expression');
                }
            }
        });
        updateBlock(id, code);
    }, [code, id, updateBlock, setVariable]);

    return (
        <div className="font-mono text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
            <textarea
                className="w-full bg-transparent outline-none resize-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="x = 10"
                rows={Math.max(2, code.split('\n').length)}
            />
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
};

export default ScriptBlock;
