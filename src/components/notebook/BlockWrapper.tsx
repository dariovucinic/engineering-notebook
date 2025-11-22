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
}

const BlockWrapper: React.FC<BlockWrapperProps> = ({ block, isSelected, scale, children, onResize }) => {
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

    const handleResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
        onResize(data.size);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`transition-all duration-200 ease-out ${isDragging ? 'z-50 scale-105' : ''}`}
        >
            <ResizableBox
                width={block.size?.width || 300}
                height={block.size?.height || 100}
                onResizeStop={handleResize}
                minConstraints={[150, 80]}
                maxConstraints={[1200, 1000]}
                transformScale={scale}
                handle={
                    <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                }
                className={`group relative rounded-xl bg-white transition-all duration-200
                    ${isSelected
                        ? 'ring-2 ring-indigo-500 shadow-lg'
                        : 'shadow-sm hover:shadow-md border border-gray-200/50'
                    }
                    ${isDragging ? 'shadow-xl ring-2 ring-indigo-400/50' : ''}
                `}
            >
                <div className="h-full w-full relative overflow-hidden rounded-xl flex flex-col">
                    {/* Drag Handle Header */}
                    <div
                        {...listeners}
                        {...attributes}
                        className="h-6 w-full absolute top-0 left-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex justify-center items-center"
                    >
                        <div className="w-12 h-1 bg-gray-200 rounded-full mt-2 shadow-sm" />
                    </div>

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
