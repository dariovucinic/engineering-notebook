export type BlockType = 'text' | 'math' | 'table' | 'image' | 'script' | 'formula' | 'data' | 'cad';

export interface BlockPosition {
    x: number;
    y: number;
}

export interface BlockSize {
    width: number;
    height: number;
}

export interface BlockStyle {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
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
    style?: BlockStyle;
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
    style?: BlockStyle;
}

export interface DataImportBlock extends BaseBlock {
    type: 'data';
    content: any[];
    variableName?: string;
    fileName?: string;
    data?: any;
    selectedSheet?: string;
}

export interface CADBlock extends BaseBlock {
    type: 'cad';
    content: string; // Base64 or URL
}

export type Block = TextBlock | ScriptBlock | FormulaBlock | ImageBlock | TableBlock | DataImportBlock | CADBlock;
