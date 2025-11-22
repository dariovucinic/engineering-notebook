import React from 'react';
import { useStore, BlockType } from '@/lib/store';
import { X, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

interface BlockWrapperProps {
    id: string;
    type: BlockType;
    children: React.ReactNode;
}

export const BlockWrapper: React.FC<BlockWrapperProps> = ({ id, type, children }) => {
    const removeBlock = useStore((state) => state.removeBlock);

    return (
        <div className="group relative mb-4 rounded-lg border border-transparent hover:border-gray-200 bg-white transition-all">
            <div className="absolute -left-10 top-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                </button>
                <button
                    onClick={() => removeBlock(id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};
