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

const Sidebar: React.FC = () => {
    const { scope, scopeVersion } = useComputation();
    const [variables, setVariables] = useState<[string, any][]>([]);

    useEffect(() => {
        const vars = Object.entries(scope.current).filter(([key]) => !key.startsWith('_'));
        setVariables(vars);
    }, [scopeVersion, scope]);

    const formatValue = (value: any): string => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(4);
        if (typeof value === 'string') return `"${value}"`;
        if (Array.isArray(value)) {
            const shape = Array.isArray(value[0]) ? `${value.length}x${value[0].length}` : `${value.length}`;
            return `Array[${shape}]`;
        }
        if (typeof value === 'object') return 'Object';
        return String(value);
    };

    const getType = (value: any): string => {
        if (Array.isArray(value)) return 'Matrix/List';
        return typeof value;
    };

    return (
        <div
            className="w-72 flex flex-col h-full z-20 transition-colors duration-300 glass-heavy border-l"
        >
            {/* Variable Explorer Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary-color)' }}>
                        <span>📦</span> Variables
                    </h3>
                </div>

                <div className="flex-1 overflow-auto p-3 space-y-2 custom-scrollbar">
                    {variables.length === 0 ? (
                        <div className="text-center text-xs mt-10 italic" style={{ color: 'var(--text-secondary-color)' }}>
                            No variables defined yet.
                        </div>
                    ) : (
                        variables.map(([name, value]) => (
                            <div
                                key={name}
                                className="group p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    backgroundColor: 'rgba(255,255,255,0.05)'
                                }}
                                onClick={() => navigator.clipboard.writeText(name)}
                                title="Click to copy variable name"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{name}</span>
                                    <span className="text-[10px] uppercase opacity-70" style={{ color: 'var(--text-secondary-color)' }}>{getType(value)}</span>
                                </div>
                                <div
                                    className="font-mono text-xs truncate p-1.5 rounded bg-black/5 dark:bg-white/5"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {formatValue(value)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
