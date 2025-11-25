'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: 'python' | 'javascript' | 'r';
    readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language = 'python', readOnly = false }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Determine language extension
        const langExtension = language === 'python' ? python() : javascript();

        const startState = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                langExtension,
                oneDark,
                EditorView.updateListener.of((update: any) => {
                    if (update.docChanged && !readOnly) {
                        onChange(update.state.doc.toString());
                    }
                }),
                EditorView.editable.of(!readOnly),
                EditorView.theme({
                    "&": {
                        height: "100%",
                        fontSize: "13px",
                        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
                    },
                    ".cm-scroller": {
                        overflow: "auto",
                        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
                    },
                    ".cm-content": {
                        padding: "8px 0",
                        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
                    },
                    ".cm-gutters": {
                        backgroundColor: "#282c34",
                        color: "#5c6370",
                        border: "none"
                    }
                })
            ]
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [language]); // Recreate editor when language changes

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
            viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: value
                }
            });
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            className="h-full w-full"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
        />
    );
};

export default CodeEditor;
