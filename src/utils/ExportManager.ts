/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import { Block } from '@/types/block';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export const ExportManager = {
    exportToPDF: async (elementId: string, filename: string = 'notebook-export.pdf') => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found');
            alert('Export failed: Canvas element not found');
            return;
        }

        try {
            // Use html2canvas with onclone to handle the transform removal safely
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById(elementId);
                    const originalElement = document.getElementById(elementId);

                    if (clonedElement && originalElement) {
                        // 1. Reset transforms on the clone
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'absolute';
                        clonedElement.style.top = '0';
                        clonedElement.style.left = '0';
                        clonedElement.style.width = 'fit-content';
                        clonedElement.style.height = 'fit-content';

                        // 2. AGGRESSIVE STYLE INLINING
                        // We must copy computed styles from the ORIGINAL element to the CLONED element.
                        // This "bakes" the CSS variables and oklab colors into standard RGB values.

                        const copyComputedStyles = (source: Element, target: HTMLElement) => {
                            const computed = window.getComputedStyle(source);
                            // We copy a comprehensive list of visual properties
                            const properties = [
                                'color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
                                'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                                'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
                                'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
                                'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
                                'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'textAlign', 'whiteSpace', 'textDecoration',
                                'boxShadow', 'opacity', 'visibility',
                                'width', 'height', 'margin', 'padding',
                                'display', 'position', 'top', 'left', 'right', 'bottom', 'zIndex',
                                'overflow', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'flexWrap'
                            ];

                            properties.forEach(prop => {
                                // @ts-ignore
                                const val = computed[prop];
                                if (val && val !== 'auto' && val !== 'normal' && val !== 'none' && val !== '0px') {
                                    // @ts-ignore
                                    target.style[prop] = val;
                                } else if (prop === 'display' || prop === 'position' || prop === 'width' || prop === 'height') {
                                    // Always copy layout critical props
                                    // @ts-ignore
                                    target.style[prop] = val;
                                }
                            });
                        };

                        // Recursive function to traverse and copy styles
                        const traverseAndCopy = (orig: Element, clone: Element) => {
                            if (orig instanceof HTMLElement && clone instanceof HTMLElement) {
                                copyComputedStyles(orig, clone);
                            }

                            const origChildren = Array.from(orig.children);
                            const cloneChildren = Array.from(clone.children);

                            for (let i = 0; i < origChildren.length; i++) {
                                if (cloneChildren[i]) {
                                    traverseAndCopy(origChildren[i], cloneChildren[i]);
                                }
                            }
                        };

                        // Start copying styles
                        traverseAndCopy(originalElement, clonedElement);

                        // 3. REMOVE STYLESHEETS
                        // Now that styles are inlined, remove all style tags and link tags from the CLONED document
                        // to prevent html2canvas from parsing the original CSS (which contains oklab).
                        const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                        styleTags.forEach(tag => tag.remove());
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');

            // Calculate PDF size based on aspect ratio
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Default to A4 landscape, but adjust if content is huge
            const pdf = new jsPDF({
                orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [imgWidth, imgHeight] // Use exact size of content
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(filename);
        } catch (error: any) {
            console.error('PDF Export failed:', error);
            alert(`PDF Export failed: ${error.message}`);
        }
    },

    exportToJupyter: (blocks: Block[], filename: string = 'notebook-export.ipynb') => {
        const cells = blocks.map(block => {
            if (block.type === 'script') {
                return {
                    cell_type: 'code',
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: block.content.split('\n').map(line => line + '\n')
                };
            } else if (block.type === 'table') {
                // Convert table data to a Pandas DataFrame code block
                const headers = block.content[0];
                const data = block.content.slice(1);

                // Simple CSV-like construction for the dataframe
                const dataStr = JSON.stringify(data);
                const columnsStr = JSON.stringify(headers);

                const pythonCode = [
                    `import pandas as pd\n`,
                    `# Data from Table Block (${block.variableName || 'Unnamed Table'})\n`,
                    `data = ${dataStr}\n`,
                    `columns = ${columnsStr}\n`,
                    `df_${block.variableName || block.id.replace(/-/g, '_')} = pd.DataFrame(data, columns=columns)\n`,
                    `df_${block.variableName || block.id.replace(/-/g, '_')}`
                ];

                return {
                    cell_type: 'code',
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: pythonCode
                };
            } else if (block.type === 'formula') {
                return {
                    cell_type: 'markdown',
                    metadata: {},
                    source: [`$${block.content}$`]
                };
            } else {
                // Text and others as markdown
                // Safely handle blocks that might not have content property in the same way
                const content = (block as any).content || '';
                return {
                    cell_type: 'markdown',
                    metadata: {},
                    source: typeof content === 'string' ? content.split('\n').map(line => line + '\n') : []
                };
            }
        });

        const notebook = {
            cells: cells,
            metadata: {
                kernelspec: {
                    display_name: "Python 3",
                    language: "python",
                    name: "python3"
                },
                language_info: {
                    codemirror_mode: {
                        name: "ipython",
                        version: 3
                    },
                    file_extension: ".py",
                    mimetype: "text/x-python",
                    name: "python",
                    nbconvert_exporter: "python",
                    pygments_lexer: "ipython3",
                    version: "3.8.5"
                }
            },
            nbformat: 4,
            nbformat_minor: 4
        };

        const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
        saveAs(blob, filename);
    },

    exportToExcel: (blocks: Block[], filename: string = 'notebook-export.xlsx') => {
        const wb = XLSX.utils.book_new();

        // 1. Process Tables
        const tableBlocks = blocks.filter(b => b.type === 'table');
        if (tableBlocks.length > 0) {
            tableBlocks.forEach((block, index) => {
                const sheetName = block.variableName || `Table ${index + 1}`;
                // Convert string[][] to worksheet
                // We need to handle formulas starting with '='
                const wsData = block.content.map(row =>
                    row.map(cell => {
                        if (typeof cell === 'string' && cell.startsWith('=')) {
                            return { f: cell.substring(1) }; // Excel formula object
                        }
                        return !isNaN(Number(cell)) && cell !== '' ? Number(cell) : cell;
                    })
                );

                const ws = XLSX.utils.aoa_to_sheet(wsData);
                XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Max 31 chars for sheet name
            });
        } else {
            // Create an empty sheet if no tables
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No Data']]), 'Data');
        }

        // 2. Process Scripts
        const scriptBlocks = blocks.filter(b => b.type === 'script');
        if (scriptBlocks.length > 0) {
            const scriptData = scriptBlocks.map(block => [
                `# Script (${block.language || 'python'})`,
                block.content,
                '-------------------'
            ]).flat().map(line => [line]);

            const wsScripts = XLSX.utils.aoa_to_sheet([['Scripts Export'], ...scriptData]);
            XLSX.utils.book_append_sheet(wb, wsScripts, 'Scripts');
        }

        // 3. Process Variables/Formulas Summary
        const formulaBlocks = blocks.filter(b => b.type === 'formula');
        if (formulaBlocks.length > 0) {
            const formulaData = formulaBlocks.map(block => {
                // Cast to any to access specific properties safely since we filtered by type
                const b = block as any;
                return [
                    b.variableName || 'Unnamed',
                    b.content,
                    b.output || ''
                ];
            });

            const wsFormulas = XLSX.utils.aoa_to_sheet([['Variable', 'Formula', 'Result'], ...formulaData]);
            XLSX.utils.book_append_sheet(wb, wsFormulas, 'Calculations');
        }

        XLSX.writeFile(wb, filename);
    }
};
