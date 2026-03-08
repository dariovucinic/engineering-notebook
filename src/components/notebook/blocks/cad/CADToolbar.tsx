import React, { useRef } from 'react';
import { Ruler, BoxSelect, RotateCw, MousePointer2, Trash2, Home, Box, Circle, PenTool } from 'lucide-react';
import { MeasureMode } from '@/types/cad';

interface CADToolbarProps {
    mode: MeasureMode;
    setMode: (mode: MeasureMode) => void;
    showBBox: boolean;
    setShowBBox: (show: boolean) => void;
    handleResetView: () => void;
    setMeasurements: (m: any[]) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddPrimitive: (type: 'cube' | 'sphere' | 'cylinder') => void;
    handleDeleteSelected: () => void;
    selectedId: string | null;
}

export const CADToolbar: React.FC<CADToolbarProps> = ({
    mode, setMode, showBBox, setShowBBox, handleResetView, setMeasurements, handleFileUpload, onAddPrimitive, handleDeleteSelected, selectedId
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex gap-1 bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-md text-white/80 transition-colors"
                    title="Import STEP"
                >
                    📂
                </button>
                <div className="w-px bg-white/10 mx-1" />
                <button
                    onClick={() => setMode('view')}
                    className={`p-2 rounded-md transition-colors ${mode === 'view' ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    title="View Mode"
                >
                    <MousePointer2 size={18} />
                </button>
                <button
                    onClick={() => setMode('edit')}
                    className={`p-2 rounded-md transition-colors ${mode === 'edit' ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    title="Editor Mode"
                >
                    <PenTool size={18} />
                </button>
                <div className="w-px bg-white/10 mx-1" />
                <button
                    onClick={() => setMode('distance')}
                    className={`p-2 rounded-md transition-colors ${mode === 'distance' ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    title="Measure Distance"
                >
                    <Ruler size={18} />
                </button>
                <button
                    onClick={() => setMode('angle')}
                    className={`p-2 rounded-md transition-colors ${mode === 'angle' ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    title="Measure Angle"
                >
                    <RotateCw size={18} />
                </button>
                <button
                    onClick={() => setShowBBox(!showBBox)}
                    className={`p-2 rounded-md transition-colors ${showBBox ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/10'}`}
                    title="Toggle Dimensions"
                >
                    <BoxSelect size={18} />
                </button>
                <div className="w-px bg-white/10 mx-1" />
                <button
                    onClick={handleResetView}
                    className="p-2 hover:bg-white/10 text-white/80 rounded-md transition-colors"
                    title="Reset View"
                >
                    <Home size={18} />
                </button>
                <button
                    onClick={() => setMeasurements([])}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                    title="Clear Measurements"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Editor Tools */}
            {mode === 'edit' && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-left-2 items-start">
                    <div className="flex gap-1 bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10">
                        <button onClick={() => onAddPrimitive('cube')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Cube"><Box size={18} /></button>
                        <button onClick={() => onAddPrimitive('sphere')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Sphere"><Circle size={18} /></button>
                        <button onClick={() => onAddPrimitive('cylinder')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Cylinder"><div className="w-4 h-4 border-2 border-white/80 rounded-sm" /></button>
                        <div className="w-px bg-white/10 mx-1" />
                        <button
                            onClick={handleDeleteSelected}
                            disabled={!selectedId}
                            className="p-2 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-md"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".stp,.step"
                className="hidden"
            />
        </div>
    );
};
