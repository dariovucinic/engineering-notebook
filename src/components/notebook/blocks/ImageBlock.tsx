'use client';

import React from 'react';
import { ImageBlock as ImageBlockType } from '@/types/block';

interface ImageBlockProps {
    block: ImageBlockType;
    onChange: (updates: Partial<ImageBlockType>) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block, onChange }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ content: e.target.value });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange({ content: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded overflow-hidden group">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />
            {block.content ? (
                <div className="relative flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={block.content}
                        alt="Block content"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="bg-white/90 p-1.5 rounded shadow-sm hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            title="Replace Image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                        <button
                            className="bg-white/90 p-1.5 rounded shadow-sm hover:bg-white text-slate-600 hover:text-red-600 transition-colors"
                            onClick={() => onChange({ content: '' })}
                            title="Remove Image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 gap-4">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Add an Image</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            Upload from PC
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-50 px-2 text-slate-400">Or via URL</span>
                            </div>
                        </div>

                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
                            placeholder="https://example.com/image.png"
                            onBlur={handleUrlChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUrlChange(e as any);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageBlock;
