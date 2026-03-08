'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Block, BlockType } from '@/types/block';
import { v4 as uuidv4 } from 'uuid';

interface Notebook {
    id: string;
    name: string;
    blocks: Block[];
}

interface NotebookContextType {
    notebooks: Notebook[];
    activeNotebookId: string;
    activeNotebook: Notebook | undefined;
    createNotebook: (initialData?: { name?: string, blocks?: Block[] }) => void;
    deleteNotebook: (id: string) => void;
    renameNotebook: (id: string, newName: string) => void;
    switchNotebook: (id: string) => void;
    addBlock: (type: BlockType, position: { x: number; y: number }, initialContent?: any) => void;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    removeBlock: (id: string) => void;
    projectName: string;
    setProjectName: (name: string) => void;
}

const NotebookContext = createContext<NotebookContextType | null>(null);

export const NotebookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state: one default notebook
    const [notebooks, setNotebooks] = useState<Notebook[]>([
        { id: 'default', name: 'Notebook 1', blocks: [] }
    ]);
    const [activeNotebookId, setActiveNotebookId] = useState<string>('default');
    const [projectName, setProjectName] = useState('Mark 85');

    const activeNotebook = notebooks.find(n => n.id === activeNotebookId);

    // --- Notebook Management ---

    const createNotebook = useCallback((initialData?: { name?: string, blocks?: Block[] }) => {
        const newId = uuidv4();
        const newNotebook: Notebook = {
            id: newId,
            name: initialData?.name || `Notebook ${notebooks.length + 1}`,
            blocks: initialData?.blocks || []
        };
        setNotebooks(prev => [...prev, newNotebook]);
        setActiveNotebookId(newId);
    }, [notebooks.length]);

    const deleteNotebook = useCallback((id: string) => {
        setNotebooks(prev => {
            const newNotebooks = prev.filter(n => n.id !== id);
            // Prevent deleting the last notebook
            if (newNotebooks.length === 0) {
                return prev;
            }
            return newNotebooks;
        });

        // If we deleted the active notebook, switch to the first one
        if (activeNotebookId === id) {
            setNotebooks(prev => {
                const remaining = prev.filter(n => n.id !== id);
                if (remaining.length > 0) {
                    setActiveNotebookId(remaining[0].id);
                }
                return remaining; // This return is just for the setter logic, state update happens in next render
            });
        }
    }, [activeNotebookId]);

    const renameNotebook = useCallback((id: string, newName: string) => {
        setNotebooks(prev => prev.map(n => n.id === id ? { ...n, name: newName } : n));
    }, []);

    const switchNotebook = useCallback((id: string) => {
        setActiveNotebookId(id);
    }, []);

    // --- Block Management (Operates on Active Notebook) ---

    const addBlock = useCallback((type: BlockType, position: { x: number; y: number }, initialContent?: any) => {
        const baseBlock = {
            id: uuidv4(),
            position,
            size: { width: 300, height: 100 },
        };

        let newBlock: Block;

        switch (type) {
            case 'text':
                newBlock = {
                    ...baseBlock,
                    type: 'text',
                    content: initialContent || '',
                    style: {
                        color: 'var(--text-color)',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        textAlign: 'left'
                    }
                };
                break;
            case 'script':
                newBlock = { ...baseBlock, type: 'script', content: initialContent || '', output: '' };
                break;
            case 'formula':
                newBlock = { ...baseBlock, type: 'formula', content: initialContent || '' };
                break;
            case 'image':
                newBlock = { ...baseBlock, type: 'image', content: initialContent || '' };
                break;
            case 'table':
                newBlock = {
                    ...baseBlock,
                    type: 'table',
                    content: initialContent || [['', '', ''], ['', '', ''], ['', '', '']],
                    style: {
                        color: 'var(--text-color)',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        textAlign: 'center'
                    }
                };
                break;
            case 'data':
                newBlock = { ...baseBlock, type: 'data', content: initialContent || [], size: { width: 400, height: 300 } };
                break;
            case 'cad':
                newBlock = { ...baseBlock, type: 'cad', content: initialContent || '', size: { width: 500, height: 500 } };
                break;
            default:
                newBlock = { ...baseBlock, type: 'text', content: '' };
        }

        setNotebooks(prev => prev.map(n => {
            if (n.id === activeNotebookId) {
                return { ...n, blocks: [...n.blocks, newBlock] };
            }
            return n;
        }));
    }, [activeNotebookId]);

    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setNotebooks(prev => prev.map(n => {
            if (n.id === activeNotebookId) {
                return {
                    ...n,
                    blocks: n.blocks.map(b => b.id === id ? { ...b, ...updates } as Block : b)
                };
            }
            return n;
        }));
    }, [activeNotebookId]);

    const removeBlock = useCallback((id: string) => {
        setNotebooks(prev => prev.map(n => {
            if (n.id === activeNotebookId) {
                return { ...n, blocks: n.blocks.filter(b => b.id !== id) };
            }
            return n;
        }));
    }, [activeNotebookId]);

    return (
        <NotebookContext.Provider value={{
            notebooks,
            activeNotebookId,
            activeNotebook,
            createNotebook,
            deleteNotebook,
            renameNotebook,
            switchNotebook,
            addBlock,
            updateBlock,
            removeBlock,
            projectName,
            setProjectName
        }}>
            {children}
        </NotebookContext.Provider>
    );
};

export const useNotebookContext = () => {
    const context = useContext(NotebookContext);
    if (!context) {
        throw new Error('useNotebookContext must be used within a NotebookProvider');
    }
    return context;
};
