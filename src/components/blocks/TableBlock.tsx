import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Trash2 } from 'lucide-react';

interface TableBlockProps {
    id: string;
    initialContent: string[][];
}

const TableBlock: React.FC<TableBlockProps> = ({ id, initialContent }) => {
    const updateBlock = useStore((state) => state.updateBlock);
    // Ensure we have at least one cell
    const [data, setData] = useState<string[][]>(
        initialContent && initialContent.length > 0 ? initialContent : [['']]
    );

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = value;
        setData(newData);
        updateBlock(id, newData);
    };

    const addRow = () => {
        const cols = data[0].length;
        const newRow = Array(cols).fill('');
        const newData = [...data, newRow];
        setData(newData);
        updateBlock(id, newData);
    };

    const addColumn = () => {
        const newData = data.map(row => [...row, '']);
        setData(newData);
        updateBlock(id, newData);
    };

    return (
        <div className="overflow-x-auto">
            <table className="border-collapse w-full">
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                                <td key={`${rowIndex}-${colIndex}`} className="border border-gray-300 p-0 min-w-[100px]">
                                    <input
                                        className="w-full p-2 outline-none focus:bg-blue-50"
                                        value={cell}
                                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex gap-2 mt-2">
                <button onClick={addRow} className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600">
                    <Plus size={12} /> Add Row
                </button>
                <button onClick={addColumn} className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600">
                    <Plus size={12} /> Add Column
                </button>
            </div>
        </div>
    );
};

export default TableBlock;
