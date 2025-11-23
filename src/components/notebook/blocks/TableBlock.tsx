'use client';

import React, { useState, useEffect } from 'react';
import { TableBlock as TableBlockType, BlockStyle } from '@/types/block';
import { useComputation } from '@/contexts/ComputationContext';
import * as XLSX from 'xlsx';
import FormattingToolbar from '../FormattingToolbar';

interface TableBlockProps {
    block: TableBlockType;
    onChange: (updates: Partial<TableBlockType>) => void;
}

const TableBlock: React.FC<TableBlockProps> = ({ block, onChange }) => {
    const { evaluateFormula, scope, scopeVersion } = useComputation();
    const [, setUpdateTrigger] = useState(0);
    const [showFormatting, setShowFormatting] = useState(false);

    const style = block.style || {
        color: '#000000',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center'
    };

    // Initialize with some data if empty
    const data = block.content.length > 0 ? block.content : [['', '', ''], ['', '', ''], ['', '', '']];

    // Sync from scope to table when scope changes
    useEffect(() => {
        if (block.variableName && block.variableName.trim()) {
            const scopeValue = scope.current[block.variableName.trim()];
            // Check if scope value is a 2D array and different from current content
            if (Array.isArray(scopeValue) && Array.isArray(scopeValue[0])) {
                // Simple equality check to avoid infinite loops
                if (JSON.stringify(scopeValue) !== JSON.stringify(block.content)) {
                    onChange({ content: scopeValue });
                }
            }
        }
        setUpdateTrigger(prev => prev + 1);
    }, [scopeVersion, block.variableName]);

    // Sync from table to scope on mount/change
    useEffect(() => {
        if (block.variableName && block.variableName.trim()) {
            scope.current[block.variableName.trim()] = data;
        }
    }, [block.variableName, data]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStyleChange = (newStyle: BlockStyle) => {
        onChange({ style: newStyle });
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = value;
        onChange({ content: newData });

        // Update scope immediately
        if (block.variableName && block.variableName.trim()) {
            scope.current[block.variableName.trim()] = newData;
        }
    };

    const getCellDisplay = (cell: string): string => {
        if (!cell) return '';

        // If starts with =, evaluate as formula
        if (cell.startsWith('=')) {
            try {
                const result = evaluateFormula(cell.substring(1));
                return String(result);
            } catch {
                return 'Error';
            }
        }

        // Interpolate {variableName}
        return cell.replace(/\{(\w+)\}/g, (match, varName) => {
            const value = scope.current[varName];
            return value !== undefined ? String(value) : match;
        });
    };

    const addRow = () => {
        const cols = data[0]?.length || 3;
        const newData = [...data, Array(cols).fill('')];
        onChange({ content: newData });
        if (block.variableName && block.variableName.trim()) {
            scope.current[block.variableName.trim()] = newData;
        }
    };

    const addCol = () => {
        const newData = data.map(row => [...row, '']);
        onChange({ content: newData });
        if (block.variableName && block.variableName.trim()) {
            scope.current[block.variableName.trim()] = newData;
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

            // Find the maximum number of columns
            const maxCols = jsonData.reduce((max, row) => Math.max(max, row.length), 0);

            // Ensure data is a 2D array, padded to maxCols, preserving numeric types
            const formattedData = jsonData.map(row => {
                const newRow = new Array(maxCols).fill('');
                row.forEach((cell, index) => {
                    // Preserve numbers, convert null/undefined to empty string
                    if (cell === null || cell === undefined) {
                        newRow[index] = '';
                    } else if (typeof cell === 'number') {
                        newRow[index] = cell; // Keep as number
                    } else {
                        newRow[index] = String(cell);
                    }
                });
                return newRow;
            });

            // If empty, default to empty 3x3
            if (formattedData.length === 0) {
                onChange({ content: [['', '', ''], ['', '', ''], ['', '', '']] });
            } else {
                onChange({ content: formattedData });
                // Update scope immediately
                if (block.variableName && block.variableName.trim()) {
                    scope.current[block.variableName.trim()] = formattedData;
                }
            }
        } catch (error) {
            console.error('Error importing Excel:', error);
            alert('Failed to import Excel file');
        } finally {
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-md">
                    <span className="text-xs font-bold text-slate-500 tracking-wider">TABLE</span>
                </div>
                <input
                    className="w-32 font-mono text-xs font-medium text-slate-700 outline-none border border-transparent hover:border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded px-2 py-1 bg-white transition-all"
                    value={block.variableName || ''}
                    onChange={(e) => onChange({ variableName: e.target.value })}
                    placeholder="variable_name"
                />
                <div className="flex-1" />
                <button
                    onClick={() => setShowFormatting(!showFormatting)}
                    className={`p-1.5 rounded hover:bg-slate-100 ${showFormatting ? 'bg-slate-100 text-indigo-600' : 'text-slate-500'}`}
                    title="Toggle Formatting"
                >
                    <span className="text-lg">Aa</span>
                </button>
            </div>

            {showFormatting && (
                <div className="px-2 pt-2">
                    <FormattingToolbar style={style} onChange={handleStyleChange} />
                </div>
            )}

            <div className="p-0 overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="w-full border-collapse">
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => {
                                    const isFormula = typeof cell === 'string' && (cell.startsWith('=') || cell.includes('{'));
                                    const displayValue = isFormula ? getCellDisplay(cell) : cell;

                                    return (
                                        <td key={`${rowIndex}-${colIndex}`} className="border border-slate-100 p-0 min-w-[60px] h-8 relative group transition-colors hover:bg-slate-50">
                                            <input
                                                className={`
                                                    w-full h-full px-2 py-1 outline-none border-none bg-transparent font-mono
                                                    ${isFormula ? 'text-indigo-600 font-medium' : 'text-slate-700'}
                                                    placeholder:text-slate-300
                                                `}
                                                style={{
                                                    color: style.color,
                                                    fontSize: style.fontSize,
                                                    fontFamily: style.fontFamily,
                                                    textAlign: style.textAlign
                                                }}
                                                value={cell === null || cell === undefined ? '' : String(cell)}
                                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                placeholder={rowIndex === 0 && colIndex === 0 ? '=' : ''}
                                            />
                                            {isFormula && (
                                                <>
                                                    {/* Display result overlay */}
                                                    <div
                                                        className="absolute inset-0 bg-white/95 pointer-events-none flex items-center px-2 text-sm text-slate-800 font-medium group-hover:opacity-0 transition-opacity"
                                                        style={{
                                                            color: style.color,
                                                            fontSize: style.fontSize,
                                                            fontFamily: style.fontFamily,
                                                            textAlign: style.textAlign
                                                        }}
                                                    >
                                                        {displayValue}
                                                    </div>
                                                    {/* Show formula on hover */}
                                                    <div className="absolute -top-8 left-0 bg-slate-800 text-white text-xs px-2 py-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity delay-75">
                                                        <span className="font-mono">{cell}</span>
                                                        <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex gap-2 p-2 bg-slate-50 border-t border-slate-100 items-center">
                <button onClick={addRow} className="text-[10px] font-medium px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors uppercase tracking-wide">+ Row</button>
                <button onClick={addCol} className="text-[10px] font-medium px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors uppercase tracking-wide">+ Col</button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-medium px-2 py-1 bg-white border border-slate-200 text-indigo-600 rounded hover:bg-indigo-50 hover:border-indigo-200 transition-colors uppercase tracking-wide flex items-center gap-1"
                >
                    <span>📥</span> Import
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default TableBlock;
