import React, { useState, useRef, useEffect } from 'react';
import { useNotebookContext } from '@/contexts/NotebookContext';
import Logo from '../ui/Logo';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import { Box } from 'lucide-react';

interface HeaderProps {
    onRunAll: () => void;
    isRunningAll: boolean;
    showDependencies: boolean;
    onToggleDependencies: () => void;
    showSidebar: boolean;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
    onRunAll,
    isRunningAll,
    showDependencies,
    onToggleDependencies,
    showSidebar,
    onToggleSidebar
}) => {
    const { projectName, setProjectName } = useNotebookContext();
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(projectName);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync temp name if project name changes externally
    useEffect(() => {
        setTempName(projectName);
    }, [projectName]);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditingName]);

    const handleRenameSubmit = () => {
        if (tempName.trim()) {
            setProjectName(tempName.trim());
        } else {
            setTempName(projectName); // Revert if empty
        }
        setIsEditingName(false);
    };

    return (
        <header className="h-16 w-full flex items-center justify-between px-6 z-40 border-b glass-heavy"
            style={{ borderColor: 'var(--border-color)' }}>

            {/* Left: Branding */}
            <div className="flex items-center gap-4">
                <Logo showText={true} size={28} />
                <div className="h-6 w-px bg-white/10 mx-2" />
                <div
                    className="flex flex-col justify-center cursor-pointer group"
                    onDoubleClick={() => {
                        setTempName(projectName);
                        setIsEditingName(true);
                    }}
                    title="Double click to rename project"
                >
                    <span className="text-[10px] uppercase opacity-50 font-bold tracking-widest leading-none mb-0.5" style={{ color: 'var(--text-secondary-color)' }}>Project</span>

                    {isEditingName ? (
                        <input
                            ref={inputRef}
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') {
                                    setTempName(projectName);
                                    setIsEditingName(false);
                                }
                            }}
                            className="bg-transparent outline-none border-b border-cyan-500 text-sm font-light tracking-wider uppercase w-32"
                            style={{ color: 'var(--text-color)' }}
                        />
                    ) : (
                        <span className="text-sm font-light tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-secondary-color)' }}>
                            {projectName}
                        </span>
                    )}
                </div>
            </div>

            {/* Center: Tabs or Title (Placeholder for now) */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-full glass" style={{ borderColor: 'var(--border-color)' }}>
                {/* Could put Notebook Tabs here later, for now we keep them in Canvas */}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">

                <button
                    onClick={onRunAll}
                    disabled={isRunningAll}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${isRunningAll ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
                        }`}
                    style={{
                        color: isRunningAll ? 'var(--text-secondary-color)' : 'var(--accent-color)',
                        borderColor: isRunningAll ? 'transparent' : 'var(--accent-color)',
                        boxShadow: isRunningAll ? 'none' : '0 0 10px -2px var(--accent-color)'
                    }}
                >
                    {isRunningAll ? 'Processing...' : 'Run All'}
                </button>

                <div className="h-4 w-px bg-white/10 mx-1" />

                <button
                    onClick={onToggleDependencies}
                    className={`p-2 rounded-md transition-all ${showDependencies ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    title="Toggle Dependencies"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </button>

                <button
                    onClick={onToggleSidebar}
                    className={`p-2 rounded-md transition-all ${showSidebar ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    title="Toggle Variables"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                </button>

                <button
                    onClick={async () => {
                        // @ts-ignore
                        const result = await window.electronAPI?.freecadCheck();
                        if (result?.success) {
                            alert(`FreeCAD Found! Version: ${result.version}\nPath: ${result.path}`);
                        } else {
                            alert(`FreeCAD Not Found: ${result?.error || 'Unknown error'}`);
                        }
                    }}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Check FreeCAD Status"
                >
                    <Box size={20} />
                </button>

                <div className="h-6 w-px bg-white/10 mx-2" />

                <ThemeSwitcher />
            </div>
        </header>
    );
};

export default Header;
