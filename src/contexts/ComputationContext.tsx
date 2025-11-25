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
    pyodideReady: boolean;
    webRReady: boolean;
}

const ComputationContext = createContext<ComputationContextType | null>(null);

export const ComputationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scope = useRef<Record<string, any>>({});
    const [scopeVersion, setScopeVersion] = useState(0);
    const [pyodideReady, setPyodideReady] = useState(false);
    const pyodideRef = useRef<any>(null);

    // Load Pyodide on mount
    useEffect(() => {
        const loadPyodide = async () => {
            try {
                // @ts-ignore
                const pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
                });
                // Load common engineering libraries
                await pyodide.loadPackage(["micropip", "numpy", "pandas", "scipy"]);

                pyodideRef.current = pyodide;
                setPyodideReady(true);
                console.log('Pyodide loaded successfully');
            } catch (error) {
                console.error('Failed to load Pyodide:', error);
            }
        };
        loadPyodide();
    }, []);

    // Load WebR on mount
    const webRRef = useRef<any>(null);
    const [webRReady, setWebRReady] = useState(false);

    useEffect(() => {
        const loadWebR = async () => {
            try {
                // Dynamic import from CDN - using new Function to bypass Turbopack analysis
                const { WebR } = await (new Function('return import("https://webr.r-wasm.org/latest/webr.mjs")'))();
                const webR = new WebR();
                await webR.init();
                webRRef.current = webR;
                setWebRReady(true);
                console.log('WebR loaded successfully');
            } catch (error) {
                console.error('Failed to load WebR:', error);
            }
        };
        loadWebR();
    }, []);

    const runScript = useCallback(async (code: string, language: 'python' | 'r' = 'python') => {
        const logs: string[] = [];

        try {
            if (language === 'python') {
                if (!pyodideRef.current) {
                    return 'Error: Python is still loading...';
                }

                // Capture stdout
                pyodideRef.current.setStdout({
                    batched: (msg: string) => logs.push(msg)
                });

                // Sync JavaScript scope to Python globals
                for (const [key, value] of Object.entries(scope.current)) {
                    pyodideRef.current.globals.set(key, value);
                }

                // Run the user's Python code
                await pyodideRef.current.runPythonAsync(code);

                // Capture all new/modified variables from Python globals
                const currentGlobals = pyodideRef.current.globals;
                for (const key of currentGlobals.keys()) {
                    // Skip built-in Python modules and private variables
                    if (!key.startsWith('_') && !key.startsWith('__') &&
                        !['js', 'pyodide', 'pyodide_py', 'micropip'].includes(key)) {
                        const value = currentGlobals.get(key);
                        // Convert Python objects to JS
                        scope.current[key] = typeof value?.toJs === 'function' ? value.toJs() : value;
                    }
                }

                setScopeVersion(prev => prev + 1);
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
            return math.evaluate(expression, matrixScope);
        } catch (error) {
            return 'Error';
        }
    }, []);

    const updateVariable = useCallback((name: string, value: any) => {
        scope.current[name] = value;
        setScopeVersion(prev => prev + 1);
    }, []);

    return (
        <ComputationContext.Provider value={{ runScript, evaluateFormula, updateVariable, scope, scopeVersion, pyodideReady, webRReady }}>
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
