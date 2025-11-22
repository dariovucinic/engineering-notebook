import React from 'react';
import { useStore } from '@/lib/store';
import { BlockWrapper } from './BlockWrapper';
import { Plus } from 'lucide-react';

// Placeholder components for now
const TextBlock = React.lazy(() => import('./blocks/TextBlock'));
const ScriptBlock = React.lazy(() => import('./blocks/ScriptBlock'));
const FormulaBlock = React.lazy(() => import('./blocks/FormulaBlock'));
const TableBlock = React.lazy(() => import('./blocks/TableBlock'));
const ImageBlock = React.lazy(() => import('./blocks/ImageBlock'));

export const Canvas: React.FC = () => {
    const { blocks, addBlock } = useStore();

    const renderBlockContent = (block: any) => {
        switch (block.type) {
            case 'text': return <TextBlock id={block.id} initialContent={block.content} />;
            case 'script': return <ScriptBlock id={block.id} initialContent={block.content} />;
            case 'formula': return <FormulaBlock id={block.id} initialContent={block.content} />;
            case 'table': return <TableBlock id={block.id} initialContent={block.content} />;
            case 'image': return <ImageBlock id={block.id} initialContent={block.content} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-sm rounded-xl p-12 relative">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 outline-none" contentEditable suppressContentEditableWarning>
                    Untitled Notebook
                </h1>

                <div className="space-y-2">
                    {blocks.map((block) => (
                        <BlockWrapper key={block.id} id={block.id} type={block.type}>
                            <React.Suspense fallback={<div>Loading...</div>}>
                                {renderBlockContent(block)}
                            </React.Suspense>
                        </BlockWrapper>
                    ))}
                </div>

                <div className="mt-8 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Plus size={16} /> Text
                    </button>
                    <button onClick={() => addBlock('script')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Plus size={16} /> Script
                    </button>
                    <button onClick={() => addBlock('formula')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Plus size={16} /> Formula
                    </button>
                    <button onClick={() => addBlock('table')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Plus size={16} /> Table
                    </button>
                    <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                        <Plus size={16} /> Image
                    </button>
                </div>
            </div>
        </div>
    );
};
