'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { useState, useRef } from 'react';
import { DataImportBlock as DataImportBlockType } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import * as XLSX from 'xlsx';

interface DataImportBlockProps {
    block: DataImportBlockType;
    onChange: (updates: Partial<DataImportBlockType>) => void;
}

const DataImportBlock: React.FC<DataImportBlockProps> = ({ block, onChange }) => {
    const { scope, scopeVersion } = useComputation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [sheets, setSheets] = useState<string[]>([]);
    const [preview, setPreview] = useState<any[][]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);

            // Get all sheet names
            const sheetNames = workbook.SheetNames;
            setSheets(sheetNames);

            // Parse all sheets
            const parsedData: any = {
                sheets: sheetNames
            };

            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                parsedData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            });

            // Set preview from first sheet
            const firstSheet = sheetNames[0];
            const firstSheetData = parsedData[firstSheet];
            setPreview(firstSheetData.slice(0, 5)); // First 5 rows

            // Update block
            onChange({
                fileName: file.name,
                data: parsedData,
                selectedSheet: firstSheet
            });

            // Store in scope if variable name is set
            if (block.variableName && block.variableName.trim()) {
                scope.current[block.variableName.trim()] = parsedData;
            }

        } catch (error: any) {
            console.error('Error parsing Excel file:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVariableNameChange = (name: string) => {
        onChange({ variableName: name });

        // Update scope with new variable name
        if (block.data && name.trim()) {
            scope.current[name.trim()] = block.data;
        }
    };

    const handleSheetChange = (sheetName: string) => {
        onChange({ selectedSheet: sheetName });
        if (block.data && block.data[sheetName]) {
            setPreview(block.data[sheetName].slice(0, 5));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded-md">
                        <span className="text-xs font-bold text-indigo-600 tracking-wider">DATA</span>
                    </div>
                    {block.fileName && (
                        <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]" title={block.fileName}>
                            {block.fileName}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing...' : block.fileName ? 'Change File' : 'Upload Excel'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-auto">
                {!block.data ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                        <span className="text-2xl mb-2 opacity-50 group-hover:scale-110 transition-transform">📊</span>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Click to upload Excel file</span>
                    </div>
                ) : (
                    <>
                        {/* Controls */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variable Name</label>
                                <input
                                    type="text"
                                    value={block.variableName || ''}
                                    onChange={(e) => handleVariableNameChange(e.target.value)}
                                    placeholder="myData"
                                    className="w-full px-2 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                />
                            </div>
                            {sheets.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sheet</label>
                                    <select
                                        value={block.selectedSheet || sheets[0]}
                                        onChange={(e) => handleSheetChange(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                    >
                                        {sheets.map(sheet => (
                                            <option key={sheet} value={sheet}>{sheet}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        {preview.length > 0 && (
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preview</span>
                                    <span className="text-[10px] text-slate-400">{preview.length} rows shown</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <tbody>
                                            {preview.map((row, rowIndex) => (
                                                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-slate-50/50 font-semibold text-slate-700' : 'border-t border-slate-100 text-slate-600'}>
                                                    {row.map((cell: any, cellIndex: number) => (
                                                        <td key={cellIndex} className="px-3 py-2 whitespace-nowrap border-r border-slate-100 last:border-r-0">
                                                            {String(cell || '')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Usage Hint */}
                        {block.variableName && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                                <span className="text-lg">✓</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Ready to use</span>
                                    <code className="text-xs font-mono">data = {block.variableName}['{block.selectedSheet}']</code>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DataImportBlock;
