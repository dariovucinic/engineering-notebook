'use client';

import React from 'react';
import { Block } from '@/types/block';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

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
            className={`transition-all duration-200 ease-out ${isDragging ? 'z-50 scale-105' : ''}`}
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
                    <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-secondary-color)' }} />
                    </div>
                }
                className={`group relative rounded-xl transition-all duration-300 glass
                    ${isSelected
                        ? 'ring-2 ring-accent shadow-lg'
                        : 'hover:shadow-md'
                    }
                    ${isDragging ? 'shadow-2xl ring-2 ring-accent scale-105' : ''}
                `}
                style={{
                    borderColor: isSelected ? 'var(--accent-color)' : undefined,
                    '--tw-ring-color': 'var(--accent-color)'
                } as React.CSSProperties}
            >
                <div className="h-full w-full relative overflow-hidden rounded-xl flex flex-col">
                    {/* Drag Handle Header */}
                    <div
                        {...listeners}
                        {...attributes}
                        className="h-6 w-full absolute top-0 left-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex justify-center items-center"
                    >
                        <div className="w-12 h-1 rounded-full mt-2 shadow-sm" style={{ backgroundColor: 'var(--border-color)' }} />
                    </div>

                    {/* Delete Button */}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="absolute top-2 right-2 z-[60] p-1.5 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent"
                            style={{
                                color: 'var(--text-secondary-color)',
                                backgroundColor: 'var(--bg-color)'
                            }}
                            title="Delete block"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 w-full h-full overflow-hidden">
                        {children}
                    </div>
                </div>
            </ResizableBox>
        </div>
    );
};

export default BlockWrapper;
