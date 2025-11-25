'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNotebookContext } from '@/contexts/NotebookContext';
import { Plus, X, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const NotebookTabs: React.FC = () => {
    const {
        notebooks,
        activeNotebookId,
        switchNotebook,
        createNotebook,
        deleteNotebook,
        renameNotebook
    } = useNotebookContext();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleRenameStart = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
        setContextMenu(null);
    };

    const handleRenameSubmit = () => {
        if (editingId && editName.trim()) {
            renameNotebook(editingId, editName.trim());
        }
        setEditingId(null);
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ id, x: e.clientX, y: e.clientY });
    };

    return (
        <div className="flex items-center h-10 px-2 gap-1 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-40 select-none">
            {/* Tabs List */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
                {notebooks.map((notebook) => (
                    <div
                        key={notebook.id}
                        onContextMenu={(e) => handleContextMenu(e, notebook.id)}
                        onClick={() => switchNotebook(notebook.id)}
                        className={`
                            group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all duration-200 min-w-[120px] max-w-[200px]
                            ${activeNotebookId === notebook.id
                                ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-medium border-t-2 border-t-blue-500'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-400 border-t-2 border-t-transparent hover:border-t-gray-300 dark:hover:border-t-gray-700'
                            }
                        `}
                    >
                        {editingId === notebook.id ? (
                            <input
                                ref={inputRef}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit();
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="w-full bg-transparent outline-none text-sm font-medium"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-sm truncate flex-1" onDoubleClick={() => handleRenameStart(notebook.id, notebook.name)}>
                                {notebook.name}
                            </span>
                        )}

                        {/* Close Button (only visible on hover or active, and if more than 1 notebook) */}
                        {notebooks.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotebook(notebook.id);
                                }}
                                className={`
                                    p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                    hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400
                                    ${activeNotebookId === notebook.id ? 'opacity-0 group-hover:opacity-100' : ''}
                                `}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}

                {/* New Notebook Button */}
                <button
                    onClick={createNotebook}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-blue-600 transition-colors"
                    title="New Notebook"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => {
                            const nb = notebooks.find(n => n.id === contextMenu.id);
                            if (nb) handleRenameStart(nb.id, nb.name);
                        }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200"
                    >
                        <Edit2 size={14} /> Rename
                    </button>
                    {notebooks.length > 1 && (
                        <button
                            onClick={() => {
                                deleteNotebook(contextMenu.id);
                                setContextMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotebookTabs;
