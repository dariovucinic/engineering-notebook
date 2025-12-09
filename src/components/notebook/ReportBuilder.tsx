'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Block } from '@/types/block';
import { X, FileText, GripVertical, Check } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ReportBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: Block[];
    onGenerate: (selectedBlocks: Block[]) => void;
    onExportJSON: (selectedBlocks: Block[]) => void;
}

const SortableItem = ({ block, isSelected, onToggle }: { block: Block, isSelected: boolean, onToggle: () => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
            <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                <GripVertical size={16} />
            </div>
            <div className="flex-1">
                <div className="text-sm font-medium text-slate-700">
                    {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[300px]">
                    {block.type === 'text' ? (block as any).content.substring(0, 50) :
                        block.type === 'formula' ? (block as any).content :
                            block.type === 'table' ? `Table (${(block as any).variableName || 'Unnamed'})` :
                                block.id}
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 text-transparent hover:border-indigo-400'
                    }`}
            >
                <Check size={14} />
            </button>
        </div>
    );
};

const ReportBuilder: React.FC<ReportBuilderProps> = ({ isOpen, onClose, blocks, onGenerate, onExportJSON }) => {
    // Initialize with all blocks selected, in current order
    const [orderedBlocks, setOrderedBlocks] = useState<Block[]>(blocks);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(blocks.map(b => b.id)));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            setOrderedBlocks(blocks);
            setSelectedIds(new Set(blocks.map(b => b.id)));
        }
    }, [isOpen, blocks]);

    if (!isOpen) return null;

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setOrderedBlocks((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleGenerate = () => {
        const selected = orderedBlocks.filter(b => selectedIds.has(b.id));
        onGenerate(selected);
        onClose();
    };

    const handleExportJSON = () => {
        const selected = orderedBlocks.filter(b => selectedIds.has(b.id));
        onExportJSON(selected);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Export Content</h2>
                            <p className="text-xs text-slate-500">Select blocks to export as PDF or Notebook file</p>
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
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedBlocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {orderedBlocks.map(block => (
                                    <SortableItem
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedIds.has(block.id)}
                                        onToggle={() => toggleSelection(block.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                        {selectedIds.size} blocks selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExportJSON}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>Export Notebook</span>
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>Generate PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportBuilder;
