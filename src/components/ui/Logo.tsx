'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 32 }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                <Image
                    src="/logo.png"
                    alt="FlowSheet Logo"
                    fill
                    className="object-contain"
                />
            </div>
            {showText && (
                <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>
                    FlowSheet
                </h1>
            )}
        </div>
    );
};

export default Logo;
