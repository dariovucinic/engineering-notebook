'use client';

import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useNotebook } from '@/hooks/useNotebook';
import BlockWrapper from './BlockWrapper';
import TextBlock from './blocks/TextBlock';
import ScriptBlock from './blocks/ScriptBlock';
import FormulaBlock from './blocks/FormulaBlock';
import ImageBlock from './blocks/ImageBlock';
import TableBlock from './blocks/TableBlock';
import DataImportBlock from './blocks/DataImportBlock';
import CADBlock from './blocks/CADBlock';
import { BlockType, Block } from '@/types/block';
import { ExportManager } from '@/utils/ExportManager';
import Sidebar from './Sidebar';
import SimpleChatButton from './SimpleChatButton';

import TopBar from './TopBar';

// ... (imports remain same)

const Canvas: React.FC = () => {
    const { blocks, addBlock, updateBlock, removeBlock } = useNotebook();
    const [zoom, setZoom] = React.useState(1);
    const [pan, setPan] = React.useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = React.useState(false);
    const [isPanning, setIsPanning] = React.useState(false);
    const [showExportMenu, setShowExportMenu] = React.useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDependencies, setShowDependencies] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum distance to trigger drag
            },
        })
    );

    // ... (useEffect and dependencyLines remain same) ...

    React.useEffect(() => {
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

    // Calculate dependencies
    const dependencyLines = useMemo(() => {
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

    const handleAddBlock = (type: BlockType) => {
        const viewportCenter = {
            x: (window.innerWidth / 2 - pan.x) / zoom,
            y: (window.innerHeight / 2 - pan.y) / zoom
        };
        addBlock(type, { x: viewportCenter.x - 150, y: viewportCenter.y - 50 });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const blockId = active.id as string;
        const block = blocks.find(b => b.id === blockId);

        if (block) {
            updateBlock(blockId, {
                position: {
                    x: block.position.x + (delta.x / zoom),
                    y: block.position.y + (delta.y / zoom),
                },
            });
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isSpacePressed) {
            setIsPanning(true);
            e.currentTarget.setPointerCapture(e.pointerId);
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

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newZoom = Math.min(Math.max(0.1, zoom - e.deltaY * zoomSensitivity), 5);
            setZoom(newZoom);
        } else {
            if (!isSpacePressed) {
                setPan(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        }
    };

    return (
        <div className="flex flex-col w-full h-screen overflow-hidden">
            {/* Top Bar - Block Palette */}
            <TopBar onAddBlock={handleAddBlock} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Canvas Area */}
                <div
                    className={`relative flex-1 h-full overflow-hidden ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
                    style={{ backgroundColor: 'var(--bg-color)' }}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(var(--grid-color) 1px, transparent 1px)',
                            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                            backgroundPosition: `${pan.x}px ${pan.y}px`
                        }}
                    />

                    {/* Zoom Indicator */}
                    <div className="absolute bottom-8 right-8 z-50 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-slate-200 text-xs font-mono text-slate-600">
                        {Math.round(zoom * 100)}%
                    </div>

                    {/* Top Right Controls */}
                    <div className="absolute top-4 right-4 z-50 flex gap-2">
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
                                    <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => {
                                                ExportManager.exportToPDF('canvas-content', 'notebook.pdf');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <span className="text-red-500">📄</span> PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                ExportManager.exportToJupyter(blocks, 'notebook.ipynb');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <span className="text-orange-500">📙</span> Jupyter
                                        </button>
                                        <button
                                            onClick={() => {
                                                ExportManager.exportToExcel(blocks, 'notebook.xlsx');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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

                    {/* Canvas Content - Transformed */}
                    <div
                        id="canvas-content"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: '0 0',
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

                    {
                        blocks.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary-color)' }}>
                                Select a block from the top menu to start
                            </div>
                        )
                    }
                </div >

                {/* Sidebars and Chat */}
                {showSidebar && <Sidebar />}
                <SimpleChatButton />
            </div>
        </div >
    );
};

export default Canvas;
