import { create } from 'zustand';

export type BlockType = 'text' | 'image' | 'script' | 'formula' | 'table';

export interface Block {
    id: string;
    type: BlockType;
    content: any;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface NotebookState {
    blocks: Block[];
    variables: Record<string, any>;
    addBlock: (type: BlockType, x?: number, y?: number) => void;
    updateBlock: (id: string, content: any) => void;
    removeBlock: (id: string) => void;
    moveBlock: (id: string, x: number, y: number) => void;
    setVariable: (name: string, value: any) => void;
}

export const useStore = create<NotebookState>((set) => ({
    blocks: [],
    variables: {},
    addBlock: (type, x = 0, y = 0) =>
        set((state) => ({
            blocks: [
                ...state.blocks,
                {
                    id: crypto.randomUUID(),
                    type,
                    content: type === 'text' ? '' : type === 'script' ? '' : type === 'table' ? [['']] : null,
                    x,
                    y,
                    w: 300,
                    h: 200,
                },
            ],
        })),
    updateBlock: (id, content) =>
        set((state) => ({
            blocks: state.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
        })),
    removeBlock: (id) =>
        set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== id),
        })),
    moveBlock: (id, x, y) =>
        set((state) => ({
            blocks: state.blocks.map((b) => (b.id === id ? { ...b, x, y } : b)),
        })),
    setVariable: (name, value) =>
        set((state) => ({
            variables: { ...state.variables, [name]: value },
        })),
}));
