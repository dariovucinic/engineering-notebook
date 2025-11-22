import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface TextBlockProps {
    id: string;
    initialContent: string;
}

const TextBlock: React.FC<TextBlockProps> = ({ id, initialContent }) => {
    const updateBlock = useStore((state) => state.updateBlock);
    const [content, setContent] = useState(initialContent);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const newContent = e.currentTarget.innerText;
        setContent(newContent);
        updateBlock(id, newContent);
    };

    return (
        <div
            className="w-full outline-none text-gray-800 text-lg leading-relaxed empty:before:content-['Type_something...'] empty:before:text-gray-300"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
        >
            {initialContent}
        </div>
    );
};

export default TextBlock;
