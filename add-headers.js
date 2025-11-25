/**
 * Script to add copyright headers to source files
 * Usage: node add-headers.js
 */

const fs = require('fs');
const path = require('path');

const COPYRIGHT_HEADER = `/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

`;

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];

function hasHeader(content) {
    return content.includes('Copyright (c) 2025 Dario Vucinic - FlowSheet');
}

function addHeader(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (hasHeader(content)) {
        console.log(`⏭️  Skipped (already has header): ${filePath}`);
        return;
    }

    let newContent;

    // Check if file starts with 'use client' or 'use server'
    if (content.startsWith("'use client'") || content.startsWith('"use client"') ||
        content.startsWith("'use server'") || content.startsWith('"use server"')) {
        const lines = content.split('\n');
        const directive = lines[0];
        const rest = lines.slice(1).join('\n');
        newContent = `${directive}\n\n${COPYRIGHT_HEADER}${rest}`;
    } else {
        newContent = COPYRIGHT_HEADER + content;
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added header: ${filePath}`);
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(entry.name)) {
                processDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (EXTENSIONS.includes(ext)) {
                addHeader(fullPath);
            }
        }
    }
}

// Start from src directory
const srcDir = path.join(__dirname, 'src');
console.log('🚀 Adding copyright headers to source files...\n');
processDirectory(srcDir);
console.log('\n✨ Done!');
