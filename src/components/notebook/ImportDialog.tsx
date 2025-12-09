'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState } from 'react';
import { X, FileSpreadsheet, Layers, Book } from 'lucide-react';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sheets: string[];
    onImport: (mode: 'tables' | 'notebooks', selectedSheets: string[]) => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, sheets, onImport }) => {
    const [selectedSheets, setSelectedSheets] = useState<string[]>(sheets);
    const [mode, setMode] = useState<'tables' | 'notebooks'>('tables');

    if (!isOpen) return null;

    const toggleSheet = (sheet: string) => {
        setSelectedSheets(prev =>
            prev.includes(sheet)
                ? prev.filter(s => s !== sheet)
                : [...prev, sheet]
        );
    };

    const handleImport = () => {
        onImport(mode, selectedSheets);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Import Excel Data</h2>
                            <p className="text-xs text-slate-500">Select sheets and import method</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Import Mode Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Import Method</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('tables')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${mode === 'tables'
                                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <Layers size={24} />
                                <div className="text-center">
                                    <div className="font-medium text-sm">Separate Tables</div>
                                    <div className="text-[10px] opacity-70">Create tables in current notebook</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('notebooks')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${mode === 'notebooks'
                                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <Book size={24} />
                                <div className="text-center">
                                    <div className="font-medium text-sm">Separate Notebooks</div>
                                    <div className="text-[10px] opacity-70">Create a notebook for each sheet</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Sheet Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">Select Sheets ({selectedSheets.length})</label>
                            <div className="flex gap-2 text-xs">
                                <button
                                    onClick={() => setSelectedSheets(sheets)}
                                    className="text-indigo-600 hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    onClick={() => setSelectedSheets([])}
                                    className="text-slate-500 hover:text-slate-700 hover:underline"
                                >
                                    None
                                </button>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                            {sheets.map(sheet => (
                                <label
                                    key={sheet}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedSheets.includes(sheet)}
                                        onChange={() => toggleSheet(sheet)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">{sheet}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={selectedSheets.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95"
                    >
                        Import Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportDialog;
