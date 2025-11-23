import { useState, useCallback } from 'react';
import { Block, BlockType } from '@/types/block';
import { v4 as uuidv4 } from 'uuid';

export const useNotebook = () => {
    const [blocks, setBlocks] = useState<Block[]>([]);

    const addBlock = useCallback((type: BlockType, position: { x: number; y: number }) => {
        const baseBlock = {
            id: uuidv4(),
            position,
            size: { width: 300, height: 100 },
        };

        let newBlock: Block;

        switch (type) {
            case 'text':
                newBlock = {
                    ...baseBlock,
                    type: 'text',
                    content: '',
                    style: {
                        color: '#000000',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        textAlign: 'left'
                    }
                };
                break;
            case 'script':
                newBlock = { ...baseBlock, type: 'script', content: '', output: '' };
                break;
            case 'formula':
                newBlock = { ...baseBlock, type: 'formula', content: '' };
                break;
            case 'image':
                newBlock = { ...baseBlock, type: 'image', content: '' };
                break;
            case 'table':
                newBlock = {
                    ...baseBlock,
                    type: 'table',
                    content: [['', '', ''], ['', '', ''], ['', '', '']],
                    style: {
                        color: '#000000',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        textAlign: 'center'
                    }
                };
                break;
            case 'data':
                newBlock = { ...baseBlock, type: 'data', content: [], size: { width: 400, height: 300 } };
                break;
            case 'cad':
                newBlock = { ...baseBlock, type: 'cad', content: '', size: { width: 500, height: 500 } };
                break;
            default:
                newBlock = { ...baseBlock, type: 'text', content: '' };
        }

        setBlocks((prev) => [...prev, newBlock]);
    }, []);

    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, ...updates } as Block : block))
        );
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks((prev) => prev.filter((block) => block.id !== id));
    }, []);

    return {
        blocks,
        addBlock,
        updateBlock,
        removeBlock,
    };
};
