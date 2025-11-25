/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Calculator } from 'lucide-react';

interface FormulaBlockProps {
    id: string;
    initialContent: string;
}

const FormulaBlock: React.FC<FormulaBlockProps> = ({ id, initialContent }) => {
    const { updateBlock, variables } = useStore();
    const [expression, setExpression] = useState(initialContent);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (!expression.trim()) {
                setResult(null);
                return;
            }

            // Create a function that takes variables as arguments
            const varNames = Object.keys(variables);
            const varValues = Object.values(variables);

            const func = new Function(...varNames, `return ${expression};`);
            const res = func(...varValues);

            setResult(res);
            setError(null);
        } catch (e) {
            setResult(null);
            setError('Error');
        }
        updateBlock(id, expression);
    }, [expression, variables, id, updateBlock]);

    return (
        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-md border border-blue-100 text-blue-900">
            <Calculator size={18} className="text-blue-400" />
            <input
                className="bg-transparent outline-none font-mono font-medium flex-1"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="a + b"
            />
            <div className="font-bold text-lg">
                {result !== null ? `= ${Number(result).toLocaleString()}` : ''}
            </div>
            {error && <div className="text-red-400 text-xs">{error}</div>}
        </div>
    );
};

export default FormulaBlock;
