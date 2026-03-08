'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { create, all } from 'mathjs';

const math = create(all);

interface ComputationContextType {
    runScript: (code: string, language?: 'python' | 'r') => Promise<any>;
    evaluateFormula: (expression: string) => any;
    updateVariable: (name: string, value: any) => void;
    scope: React.MutableRefObject<Record<string, any>>;
    scopeVersion: number;
    executionCount: number;
    pyodideReady: boolean;
    webRReady: boolean;
}

const ComputationContext = createContext<ComputationContextType | null>(null);

export const ComputationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scope = useRef<Record<string, any>>({});
    const [scopeVersion, setScopeVersion] = useState(0);
    const [executionCount, setExecutionCount] = useState(0);
    // Pyodide refs - kept for types but disabled
    const [pyodideReady, setPyodideReady] = useState(false);
    const pyodideRef = useRef<any>(null);

    // WebR refs - kept for types but disabled
    const webRRef = useRef<any>(null);
    const [webRReady, setWebRReady] = useState(false);

    // Kernels are now disabled for faster Electron performance
    /*
    useEffect(() => {
        // Pyodide and WebR loading logic removed to prioritize native Python bridge
    }, []);
    */

    const runScript = useCallback(async (code: string, language: 'python' | 'r' = 'python') => {
        const logs: string[] = [];

        try {
            // Check if we are in Electron and have the native bridge
            // @ts-ignore
            const isElectron = window.electronAPI?.isElectron;

            if (language === 'python') {
                if (isElectron) {
                    // Use native Electron bridge
                    // @ts-ignore
                    const result = await window.electronAPI.runPython(code, scope.current);
                    if (result.success) {
                        // Sync outputs back to scope
                        if (result.outputs) {
                            Object.assign(scope.current, result.outputs);
                            setScopeVersion(prev => prev + 1);
                        }

                        let output = result.logs || '';
                        if (result.errors) {
                            output += (output ? '\n' : '') + '--- ERRORS ---\n' + result.errors;
                        }
                        return output || 'Executed successfully (Native)';
                    } else {
                        const errOutput = (result.logs ? result.logs + '\n' : '') +
                            `Error: ${result.error}${result.traceback ? '\n' + result.traceback : ''}`;
                        return errOutput;
                    }
                }

                // Fallback to Pyodide for web
                if (!pyodideRef.current) {
                    return 'Error: Python is still loading...';
                }

                // Capture stdout
                pyodideRef.current.setStdout({
                    batched: (msg: string) => logs.push(msg)
                });

                // Sync JavaScript scope to Python globals
                const proxiesToDestroy: any[] = [];
                try {
                    for (const [key, value] of Object.entries(scope.current)) {
                        if (typeof value === 'object' && value !== null) {
                            const pyProxy = pyodideRef.current.toPy(value);
                            proxiesToDestroy.push(pyProxy);
                            pyodideRef.current.globals.set(key, pyProxy);
                        } else {
                            pyodideRef.current.globals.set(key, value);
                        }
                    }

                    // Run the user's Python code
                    await pyodideRef.current.runPythonAsync(code);

                    // Capture all new/modified variables from Python globals
                    const currentGlobals = pyodideRef.current.globals;
                    for (const key of currentGlobals.keys()) {
                        if (!key.startsWith('_') && !key.startsWith('__') &&
                            !['js', 'pyodide', 'pyodide_py', 'micropip'].includes(key)) {
                            const value = currentGlobals.get(key);
                            scope.current[key] = typeof value?.toJs === 'function' ? value.toJs() : value;
                        }
                    }

                    setScopeVersion(prev => prev + 1);
                    setExecutionCount(prev => prev + 1);
                } finally {
                    for (const proxy of proxiesToDestroy) {
                        try { proxy.destroy(); } catch (e) { }
                    }
                }

                return logs.length > 0 ? logs.join('\n') : 'Executed successfully (no output)';
            } else if (language === 'r') {
                if (!webRRef.current) {
                    return 'Error: R is still loading...';
                }

                // Create a canvas for R plotting if needed (future feature)
                // For now, just capture stdout

                // R execution via WebR
                const shelter = await new webRRef.current.Shelter();
                try {
                    const result = await shelter.captureR(code, {
                        withAutoprint: true,
                        captureStreams: true,
                        captureConditions: false
                    });

                    // Process output
                    result.output.forEach((out: any) => {
                        if (out.type === 'stdout' || out.type === 'stderr') {
                            logs.push(out.data);
                        }
                    });

                    // TODO: Variable syncing for R is more complex and requires explicit conversion
                    // For now, we just run the script.

                } finally {
                    await shelter.purge();
                }

                return logs.length > 0 ? logs.join('\n') : 'Executed successfully (no output)';
            }
            return 'Error: Unsupported language';
        } catch (error: any) {
            console.error("Script execution error:", error);
            return `Error: ${error.message}`;
        }
    }, []);

    const evaluateFormula = useCallback((expression: string) => {
        try {
            if (!expression.trim()) return '';

            // Pre-process: Replace JS-style object/array access with evaluated values
            // This handles expressions like myTable['Foglio1'][1][1] that math.js can't parse
            let processedExpression = expression;

            // Pattern to match variable access with brackets: varName['key'] or varName[0] etc.
            // We'll find and evaluate these patterns, replacing with their values
            const jsAccessPattern = /([a-zA-Z_][a-zA-Z0-9_]*)(\[['"\d\]][^\s+\-*/=]*)/g;

            processedExpression = expression.replace(jsAccessPattern, (match, varName, accessors) => {
                try {
                    if (scope.current[varName] !== undefined) {
                        // Build and evaluate the full access expression
                        const scopeKeys = Object.keys(scope.current);
                        const scopeValues = Object.values(scope.current);
                        const fn = new Function(...scopeKeys, `return ${match}`);
                        const value = fn(...scopeValues);

                        if (typeof value === 'number') {
                            return value.toString();
                        } else if (typeof value === 'string') {
                            return `"${value}"`;
                        }
                        return match; // Can't substitute, leave as-is
                    }
                } catch (e) {
                    // If JS evaluation fails, leave the original expression
                }
                return match;
            });

            // Convert arrays to math.js matrices for proper indexing
            const matrixScope: Record<string, any> = {};
            for (const [key, value] of Object.entries(scope.current)) {
                if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
                    // 2D array - convert to matrix
                    matrixScope[key] = math.matrix(value);
                } else if (Array.isArray(value)) {
                    // 1D array - convert to matrix
                    matrixScope[key] = math.matrix(value);
                } else {
                    matrixScope[key] = value;
                }
            }

            const result = math.evaluate(processedExpression, matrixScope);

            // Sync back changes to scope.current
            let scopeChanged = false;
            for (const [key, value] of Object.entries(matrixScope)) {
                // Skip internal mathjs properties if any (though usually clean)
                // Convert Matrices back to arrays for consistency
                let valToStore = value;
                if (value && typeof value === 'object' && value.isMatrix) {
                    valToStore = value.toArray();
                }

                // Update if new or changed
                if (JSON.stringify(scope.current[key]) !== JSON.stringify(valToStore)) {
                    scope.current[key] = valToStore;
                    scopeChanged = true;
                }
            }

            if (scopeChanged) {
                setScopeVersion(prev => prev + 1);
            }

            return result;
        } catch (error) {
            return 'Error';
        }
    }, []);

    const updateVariable = useCallback((name: string, value: any) => {
        scope.current[name] = value;
        setScopeVersion(prev => prev + 1);
    }, []);

    return (
        <ComputationContext.Provider value={{ runScript, evaluateFormula, updateVariable, scope, scopeVersion, executionCount, pyodideReady, webRReady }}>
            {children}
        </ComputationContext.Provider>
    );
};

export const useComputation = () => {
    const context = useContext(ComputationContext);
    if (!context) {
        throw new Error('useComputation must be used within a ComputationProvider');
    }
    return context;
};
