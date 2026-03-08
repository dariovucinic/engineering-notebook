'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React from 'react';
import { Block } from '@/types/block';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockWrapperProps {
    block: Block;
    isSelected?: boolean;
    scale: number;
    children: React.ReactNode;
    onResize: (size: { width: number; height: number }) => void;
    onDelete?: () => void;
}

const BlockWrapper: React.FC<BlockWrapperProps> = ({ block, isSelected, scale, children, onResize, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
    });

    const style = {
        // We need to adjust the transform to account for the scale
        // When scaled down, the drag delta needs to be larger to move the same visual distance
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        left: block.position.x,
        top: block.position.y,
        position: 'absolute' as const,
        zIndex: isDragging ? 100 : 1,
    };

    const [size, setSize] = React.useState({
        width: block.size?.width || 300,
        height: block.size?.height || 100
    });

    // Sync local state when block size changes externally
    React.useEffect(() => {
        setSize({
            width: block.size?.width || 300,
            height: block.size?.height || 100
        });
    }, [block.size?.width, block.size?.height]);

    const handleResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
        setSize(data.size);
    };

    const handleResizeStop = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
        setSize(data.size);
        onResize(data.size);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`transition-all duration-200 ease-out ${isDragging ? 'z-50' : ''}`}
        >
            <ResizableBox
                width={size.width}
                height={size.height}
                onResize={handleResize}
                onResizeStop={handleResizeStop}
                minConstraints={[150, 80]}
                maxConstraints={[1200, 1000]}
                transformScale={scale}
                handle={
                    <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-secondary-color)' }} />
                    </div>
                }
                // Removed visual classes from here, moved to inner motion.div
                className="group relative"
            >
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    whileHover={{ scale: 1.005, y: -2 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        mass: 0.8
                    }}
                    className={`h-full w-full relative overflow-hidden rounded-sm flex flex-col glass
                        ${isSelected
                            ? 'ring-1 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                            : 'hover:shadow-lg hover:ring-1 hover:ring-white/10'
                        }
                        ${isDragging ? 'shadow-2xl ring-1 ring-cyan-500 scale-105' : ''}
                    `}
                    style={{
                        borderColor: isSelected ? 'var(--accent-color)' : undefined,
                        // Corner accents via clip-path could be cool but complex. 
                        // For now, let's stick to borders and glass.
                    } as React.CSSProperties}
                >
                    {/* Drag Handle Header - SciFi Style */}
                    <div
                        {...listeners}
                        {...attributes}
                        className="h-6 w-full absolute top-0 left-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex justify-between items-center px-2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    >
                        {/* Decorative technical markers */}
                        <div className="flex gap-1">
                            <div className="w-1 h-3 bg-cyan-500/50 rounded-sm"></div>
                            <div className="w-1 h-2 bg-cyan-500/30 rounded-sm mt-1"></div>
                        </div>

                        <div className="w-16 h-1 rounded-full bg-cyan-500/20 backdrop-blur-md" />


                        <div className="flex gap-1">
                            <div className="w-1 h-2 bg-cyan-500/30 rounded-sm mt-1"></div>
                            <div className="w-1 h-3 bg-cyan-500/50 rounded-sm"></div>
                        </div>
                    </div>

                    {/* Delete Button - HUD Style */}
                    {onDelete && (
                        <motion.button
                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="absolute top-1 right-1 z-[60] p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                            style={{
                                color: 'var(--text-secondary-color)',
                            }}
                            title="Delete block"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </motion.button>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 w-full h-full overflow-hidden relative">
                        {/* Optional corner markers for HUD feel */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/30 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/30 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/30 pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/30 pointer-events-none" />

                        {children}
                    </div>
                </motion.div>
            </ResizableBox>
        </div>
    );
};

export default BlockWrapper;
