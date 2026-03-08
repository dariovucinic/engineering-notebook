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
import { useComputation } from '@/contexts/ComputationContext';
import SimpleChatButton from './SimpleChatButton';
import ReactDOMServer from 'react-dom/server';
import ReportBuilder from './ReportBuilder';
import PrintView from './PrintView';
import Header from './Header';

// Inner Canvas component that consumes the context
const CanvasContent: React.FC = () => {
    const {
        activeNotebook,
        addBlock,
        updateBlock,
        removeBlock,
        createNotebook
    } = useNotebookContext();
    const { scope, runScript } = useComputation();

    const blocks = activeNotebook?.blocks || [];

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDependencies, setShowDependencies] = useState(true);
    const [showReportBuilder, setShowReportBuilder] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isRunningAll, setIsRunningAll] = useState(false);

    // Run all script blocks in sequence (sorted by Y position)
    const runAllScripts = async () => {
        const scriptBlocks = blocks
            .filter(b => b.type === 'script')
            .sort((a, b) => a.position.y - b.position.y);

        if (scriptBlocks.length === 0) return;

        setIsRunningAll(true);

        for (const block of scriptBlocks) {
            const scriptBlock = block as any;
            const content = scriptBlock.content || '';
            const language = scriptBlock.language || 'python';

            if (content.trim()) {
                try {
                    const output = await runScript(content, language);
                    updateBlock(block.id, { output });
                } catch (error: any) {
                    updateBlock(block.id, { output: `Error: ${error.message}` });
                }
            }
        }

        setIsRunningAll(false);
    };

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

        // Global wheel handler for Ctrl+scroll zoom anywhere
        const handleGlobalWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const scale = e.deltaY > 0 ? 0.9 : 1.1;
                setZoom((prev) => Math.min(Math.max(prev * scale, 0.1), 5));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('wheel', handleGlobalWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('wheel', handleGlobalWheel);
        };
    }, []);

    // Global paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Ignore if pasting into an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLDivElement && e.target.isContentEditable) {
                return;
            }

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        e.preventDefault();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const content = event.target?.result as string;
                            // Add block at center of view
                            // We need to calculate this carefully since we are in a closure
                            // Using functional state updates for setBlocks is tricky if we depend on 'pan' and 'zoom' from state
                            // But since this useEffect will have dependencies, it should work fine if we include them

                            // Center of window relative to canvas origin
                            const centerX = (-pan.x + window.innerWidth / 2) / zoom;
                            const centerY = (-pan.y + window.innerHeight / 2) / zoom;

                            addBlock('image', { x: centerX - 150, y: centerY - 100 }, content);
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addBlock, pan, zoom]);

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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) return;

        // Calculate drop position in canvas coordinates
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Convert to canvas space (undo pan and zoom)
        const canvasX = (clientX - pan.x) / zoom;
        const canvasY = (clientY - pan.y) / zoom;

        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                // Offset multiple images slightly
                addBlock('image', {
                    x: canvasX + (index * 20),
                    y: canvasY + (index * 20)
                }, content);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleGenerateReport = (selectedBlocks: Block[]) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to generate the report.');
            return;
        }

        const reportHtml = ReactDOMServer.renderToString(<PrintView blocks={selectedBlocks} scope={scope.current} />);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Engineering Report</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .break-inside-avoid { page-break-inside: avoid; }
                    }
                    body { font-family: 'Inter', sans-serif; }
                </style>
            </head>
            <body>
                ${reportHtml}
                <script>
                    // Wait for images/styles to load then print
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleExportJSON = (selectedBlocks: Block[]) => {
        const defaultName = `notebook-export-${new Date().toISOString().slice(0, 10)}`;
        const filename = prompt('Enter filename for export:', defaultName);
        if (!filename) return; // User cancelled

        const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

        const data = JSON.stringify(selectedBlocks, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportNotebook = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const blocks = JSON.parse(content);
                    if (Array.isArray(blocks)) {
                        const notebookName = file.name.replace('.json', '');
                        createNotebook({ name: notebookName, blocks });
                    } else {
                        alert('Invalid notebook format: Expected an array of blocks');
                    }
                } catch (err) {
                    console.error('Failed to parse notebook file', err);
                    alert('Invalid notebook file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)] scifi-gradient transition-colors duration-500">
            <ReportBuilder
                isOpen={showReportBuilder}
                onClose={() => setShowReportBuilder(false)}
                blocks={blocks}
                onGenerate={handleGenerateReport}
                onExportJSON={handleExportJSON}
            />

            <Header
                onRunAll={runAllScripts}
                isRunningAll={isRunningAll}
                showDependencies={showDependencies}
                onToggleDependencies={() => setShowDependencies(!showDependencies)}
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
            />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar */}
                <LeftSidebar
                    onAddBlock={(type) => {
                        // Center of the current view
                        const centerX = (-pan.x + window.innerWidth / 2) / zoom;
                        const centerY = (-pan.y + window.innerHeight / 2) / zoom;
                        addBlock(type, { x: centerX - 150, y: centerY - 50 });
                    }}
                    onExport={() => setShowReportBuilder(true)}
                    onImport={handleImportNotebook}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full relative">

                    {/* Canvas Area */}
                    <div
                        ref={canvasRef}
                        className={`flex-1 relative overflow-hidden ${isSpacePressed ? 'cursor-grab' : 'cursor-crosshair'} ${isPanning ? 'cursor-grabbing' : ''}`}
                        onWheel={handleWheel}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Grid Background */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-20"
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
                                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-color)" opacity="0.5" />
                                    </marker>
                                </defs>
                                {dependencyLines.map(line => (
                                    <path
                                        key={line.id}
                                        d={`M ${line.start.x} ${line.start.y} C ${line.start.x + 50} ${line.start.y}, ${line.end.x - 50} ${line.end.y}, ${line.end.x} ${line.end.y}`}
                                        stroke="var(--accent-color)"
                                        strokeWidth="1"
                                        strokeOpacity="0.4"
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
                    </div>
                </div>

                {/* Right Sidebar (Variables) */}
                {showSidebar && <Sidebar />}
            </div>

            <SimpleChatButton />
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
