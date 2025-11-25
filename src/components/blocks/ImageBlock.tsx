/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageBlockProps {
    id: string;
    initialContent: string | null;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ id, initialContent }) => {
    const updateBlock = useStore((state) => state.updateBlock);
    const [imageSrc, setImageSrc] = useState<string | null>(initialContent);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImageSrc(result);
                updateBlock(id, result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (imageSrc) {
        return (
            <div className="relative group">
                <img src={imageSrc} alt="Uploaded" className="max-w-full rounded-lg shadow-sm" />
                <button
                    onClick={() => { setImageSrc(null); updateBlock(id, null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Upload size={14} className="rotate-45" /> {/* Using rotate to simulate X/Remove if needed, or just re-upload */}
                </button>
            </div>
        );
    }

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer relative">
            <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
            />
            <ImageIcon size={32} className="mb-2" />
            <span className="text-sm font-medium">Click to upload image</span>
        </div>
    );
};

export default ImageBlock;
