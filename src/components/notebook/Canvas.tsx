'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { Block, BlockType } from '@/types/block';
import BlockWrapper from './BlockWrapper';
import TextBlock from './blocks/TextBlock';
import ScriptBlock from './blocks/ScriptBlock';
import FormulaBlock from './blocks/FormulaBlock';
import ImageBlock from './blocks/ImageBlock';
import TableBlock from './blocks/TableBlock';
import DataImportBlock from './blocks/DataImportBlock';
import CADBlock from './blocks/CADBlock';
import LeftSidebar from './LeftSidebar';
import Sidebar from './Sidebar';
import NotebookTabs from './NotebookTabs';
import { NotebookProvider, useNotebookContext } from '@/contexts/NotebookContext';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import SimpleChatButton from './SimpleChatButton';

// Inner Canvas component that consumes the context
const CanvasContent: React.FC = () => {
    const {
        activeNotebook,
        addBlock,
        updateBlock,
        removeBlock
    } = useNotebookContext();

    const blocks = activeNotebook?.blocks || [];

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDependencies, setShowDependencies] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const id = active.id as string;
        const block = blocks.find((b) => b.id === id);

        if (block) {
            updateBlock(id, {
                position: {
                    x: block.position.x + delta.x / zoom,
                    y: block.position.y + delta.y / zoom,
                },
            });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom((prev) => Math.min(Math.max(prev * scale, 0.1), 5));
        } else {
            if (!isSpacePressed) {
                setPan((prev) => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY,
                }));
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isSpacePressed || e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
            setPan(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isPanning) {
            setIsPanning(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    // Calculate dependency lines
    const dependencyLines = React.useMemo(() => {
        if (!showDependencies) return [];

        const producerMap = new Map<string, Block>();
        blocks.forEach(block => {
            if ('variableName' in block && block.variableName) {
                producerMap.set(block.variableName, block);
            }
        });

        const lines: { start: { x: number, y: number }, end: { x: number, y: number }, id: string }[] = [];

        blocks.forEach(block => {
            if (block.type === 'formula') {
                const matches = block.content.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
                const uniqueVars = Array.from(new Set(matches));

                uniqueVars.forEach(varName => {
                    const producer = producerMap.get(varName);
                    if (producer && producer.id !== block.id) {
                        const producerW = producer.size?.width ?? 300;
                        const producerH = producer.size?.height ?? 100;
                        const blockW = block.size?.width ?? 300;
                        const blockH = block.size?.height ?? 100;

                        lines.push({
                            id: `${producer.id}-${block.id}`,
                            start: {
                                x: producer.position.x + producerW / 2,
                                y: producer.position.y + producerH / 2
                            },
                            end: {
                                x: block.position.x + blockW / 2,
                                y: block.position.y + blockH / 2
                            }
                        });
                    }
                });
            }
        });

        return lines;
    }, [blocks, showDependencies]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)]">
            {/* Left Sidebar */}
            <LeftSidebar onAddBlock={(type) => {
                // Center of the current view
                const centerX = (-pan.x + window.innerWidth / 2) / zoom;
                const centerY = (-pan.y + window.innerHeight / 2) / zoom;
                addBlock(type, { x: centerX - 150, y: centerY - 50 });
            }} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Top Controls */}
                <div className="absolute top-3 right-4 z-50 flex gap-2 items-center">
                    <ThemeSwitcher />
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className={`p-2 backdrop-blur-md rounded-lg shadow-sm border transition-colors`}
                            style={{
                                backgroundColor: 'var(--surface-color)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)'
                            }}
                            title="Export"
                        >
                            📥
                        </button>
                        {showExportMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowExportMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => setShowExportMenu(false)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <span className="text-red-500">📄</span> PDF
                                    </button>
                                    <button
                                        onClick={() => setShowExportMenu(false)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <span className="text-orange-500">📙</span> Jupyter
                                    </button>
                                    <button
                                        onClick={() => setShowExportMenu(false)}
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <span className="text-green-600">📊</span> Excel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowDependencies(!showDependencies)}
                        className={`p-2 backdrop-blur-md rounded-lg shadow-sm border transition-colors`}
                        style={{
                            backgroundColor: showDependencies ? 'var(--accent-color)' : 'var(--surface-color)',
                            borderColor: showDependencies ? 'var(--accent-color)' : 'var(--border-color)',
                            color: showDependencies ? '#fff' : 'var(--text-color)'
                        }}
                        title="Toggle Dependencies"
                    >
                        🔗
                    </button>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 backdrop-blur-md rounded-lg shadow-sm border transition-colors`}
                        style={{
                            backgroundColor: showSidebar ? 'var(--accent-color)' : 'var(--surface-color)',
                            borderColor: showSidebar ? 'var(--accent-color)' : 'var(--border-color)',
                            color: showSidebar ? '#fff' : 'var(--text-color)'
                        }}
                        title="Toggle Variables"
                    >
                        📦
                    </button>
                </div>

                {/* Notebook Tabs */}
                <NotebookTabs />

                {/* Canvas Area */}
                <div
                    ref={canvasRef}
                    className={`flex-1 relative overflow-hidden ${isSpacePressed ? 'cursor-grab' : 'cursor-crosshair'} ${isPanning ? 'cursor-grabbing' : ''}`}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Grid Background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(var(--grid-color) 1px, transparent 1px)',
                            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                            backgroundPosition: `${pan.x}px ${pan.y}px`
                        }}
                    />

                    {/* Infinite Canvas Container */}
                    <div
                        className="absolute inset-0 transform-gpu"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        {/* Dependency Layer */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--grid-color)" />
                                </marker>
                            </defs>
                            {dependencyLines.map(line => (
                                <path
                                    key={line.id}
                                    d={`M ${line.start.x} ${line.start.y} C ${line.start.x + 50} ${line.start.y}, ${line.end.x - 50} ${line.end.y}, ${line.end.x} ${line.end.y}`}
                                    stroke="var(--grid-color)"
                                    strokeWidth="2"
                                    fill="none"
                                    markerEnd="url(#arrowhead)"
                                />
                            ))}
                        </svg>

                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            {blocks.map((block) => (
                                <BlockWrapper
                                    key={block.id}
                                    block={block}
                                    scale={zoom}
                                    onResize={(size) => updateBlock(block.id, { size })}
                                    onDelete={() => removeBlock(block.id)}
                                >
                                    {block.type === 'text' && (
                                        <TextBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'script' && (
                                        <ScriptBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'formula' && (
                                        <FormulaBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'image' && (
                                        <ImageBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'table' && (
                                        <TableBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'data' && (
                                        <DataImportBlock
                                            block={block}
                                            onChange={(updates) => updateBlock(block.id, updates)}
                                        />
                                    )}
                                    {block.type === 'cad' && (
                                        <CADBlock
                                            id={block.id}
                                            content={block.content}
                                            onUpdate={(content) => updateBlock(block.id, { content })}
                                        />
                                    )}
                                </BlockWrapper>
                            ))}
                        </DndContext>
                    </div>

                    {/* Sidebars and Chat */}
                    {showSidebar && <Sidebar />}
                    <SimpleChatButton />
                </div>
            </div>
        </div>
    );
};

// Main Canvas Component wrapping the content with Provider
const Canvas: React.FC = () => {
    return (
        <NotebookProvider>
            <CanvasContent />
        </NotebookProvider>
    );
};

export default Canvas;
