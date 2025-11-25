'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { useState, useEffect } from 'react';
import { useComputation } from '@/contexts/ComputationContext';

const VariableExplorer: React.FC = () => {
    const { scope, scopeVersion } = useComputation();
    const [variables, setVariables] = useState<[string, any][]>([]);

    useEffect(() => {
        // Filter out internal variables if needed, though context handles most
        const vars = Object.entries(scope.current).filter(([key]) => !key.startsWith('_'));
        setVariables(vars);
    }, [scopeVersion, scope]);

    const formatValue = (value: any): string => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';

        if (typeof value === 'number') {
            // Format numbers nicely (max 4 decimal places)
            return Number.isInteger(value) ? value.toString() : value.toFixed(4);
        }

        if (typeof value === 'string') {
            return `"${value}"`;
        }

        if (Array.isArray(value)) {
            const shape = Array.isArray(value[0])
                ? `${value.length}x${value[0].length}`
                : `${value.length}`;
            return `Array[${shape}]`;
        }

        if (typeof value === 'object') {
            return 'Object';
        }

        return String(value);
    };

    const getType = (value: any): string => {
        if (Array.isArray(value)) return 'Matrix/List';
        return typeof value;
    };

    return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-10">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span>📦</span> Variables
                </h3>
            </div>

            <div className="flex-1 overflow-auto p-2">
                {variables.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs mt-10 italic">
                        No variables defined yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {variables.map(([name, value]) => (
                            <div
                                key={name}
                                className="group p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(name)}
                                title="Click to copy variable name"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-sm font-bold text-indigo-600">{name}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">{getType(value)}</span>
                                </div>
                                <div className="font-mono text-xs text-gray-600 truncate bg-white/50 p-1 rounded">
                                    {formatValue(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VariableExplorer;
