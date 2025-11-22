export type BlockType = 'text' | 'math' | 'table' | 'image' | 'script' | 'formula' | 'data';

export interface BlockPosition {
    x: number;
    y: number;
}

export interface BlockSize {
    width: number;
    height: number;
}

export interface BaseBlock {
    id: string;
    type: BlockType;
    position: BlockPosition;
    size?: BlockSize;
}

export interface TextBlock extends BaseBlock {
    type: 'text';
    content: string;
}

export interface ScriptBlock extends BaseBlock {
    type: 'script';
    content: string;
    output?: string;
    language?: 'python' | 'r';
}

export interface FormulaBlock extends BaseBlock {
    type: 'formula';
    content: string;
    variableName?: string;
}

export interface ImageBlock extends BaseBlock {
    type: 'image';
    content: string;
}

export interface TableBlock extends BaseBlock {
    type: 'table';
    content: string[][];
    variableName?: string;
}

export interface DataImportBlock extends BaseBlock {
    type: 'data';
    fileName?: string;
    data?: any;
    selectedSheet?: string;
    variableName?: string;
}

export type Block = TextBlock | ScriptBlock | FormulaBlock | ImageBlock | TableBlock | DataImportBlock;

