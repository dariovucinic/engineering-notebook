import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { useComputation } from '@/contexts/ComputationContext';
import { SceneObject, Measurement, MeasureMode } from '@/types/cad';
import { MeasurementScene } from './cad/MeasurementScene';
import { CADToolbar } from './cad/CADToolbar';
import { PropertiesPanel } from './cad/PropertiesPanel';
import { runForgeScript } from '@/lib/forgecadRunner';
import CodeEditor from '../CodeEditor';

// Inner component to trigger auto-fit when new objects appear
function BoundsRefresher({ objectCount }: { objectCount: number }) {
    const bounds = useBounds();
    useEffect(() => {
        if (objectCount > 0) {
            // Small delay so Three.js geometry is fully mounted before fitting
            const t = setTimeout(() => bounds.refresh().fit(), 100);
            return () => clearTimeout(t);
        }
    }, [objectCount]);
    return null;
}

interface CADBlockProps {
    id: string;
    content: string;
    onUpdate: (content: string) => void;
}

const CADBlock: React.FC<CADBlockProps> = ({ id, content, onUpdate }) => {
    const [objects, setObjects] = useState<SceneObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<MeasureMode>('view');
    const [showBBox, setShowBBox] = useState(false);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [forgeParams, setForgeParams] = useState<any[]>([]);
    const [paramOverrides, setParamOverrides] = useState<Record<string, number>>({});
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const controlsRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { scope, scopeVersion } = useComputation();

    const [scriptCode, setScriptCode] = useState(() => {
        try {
            if (content && content.startsWith('{')) {
                const parsed = JSON.parse(content);
                if (parsed.script) {
                    return parsed.script;
                }
            }
            return content || '// Write your ForgeCAD script here\n';
        } catch {
            return content || '// Write your ForgeCAD script here\n';
        }
    });

    useEffect(() => {
        let active = true;

        const compileCAD = async () => {
            setLoading(true);
            const res = await runForgeScript(scriptCode, paramOverrides, scope.current);
            if (!active) return;

            if (res.error) {
                setError(res.error);
            } else {
                setError(null);
                setForgeParams(res.params || []);

                const newObjects: SceneObject[] = res.meshGroups.map(group => ({
                    id: uuidv4(),
                    type: 'forge',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    color: '#cccccc',
                    name: group.name || 'Part',
                    meshGroup: group
                }));

                setObjects(newObjects);
                onUpdate(scriptCode);
            }
            setLoading(false);
        };

        const timer = setTimeout(compileCAD, 600);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [scriptCode, paramOverrides]);

    const handleResetView = () => {
        if (controlsRef.current) controlsRef.current.reset();
    };

    const handleUpdateObject = (id: string, updates: Partial<SceneObject>) => {
        const newObjects = objects.map(o => o.id === id ? { ...o, ...updates } : o);
        setObjects(newObjects);
    };

    const handleAddPrimitive = (type: 'cube' | 'sphere' | 'cylinder') => {
        const newObj: SceneObject = {
            id: uuidv4(),
            type,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            dims: [1, 1, 1]
        };
        setObjects([...objects, newObj]);
        setMode('edit');
        setSelectedId(newObj.id);
    };

    const handleDeleteSelected = () => {
        if (selectedId) {
            setObjects(objects.filter(o => o.id !== selectedId));
            setSelectedId(null);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const newObj: SceneObject = {
                    id: uuidv4(),
                    type: 'step',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    color: '#cccccc',
                    data: result
                };
                setObjects([...objects, newObj]);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            console.error('CAD Import Error:', err);
            setError(err.message || 'Failed to import file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAIGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/forgecad/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    contextOverrides: scope.current
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText);
            }

            const data = await response.json();
            if (data.code) {
                setScriptCode(data.code);
            } else if (data.error) {
                throw new Error(data.error);
            }
        } catch (err: any) {
            console.error('AI Generation failed:', err);
            setError('AI Generation Failed: ' + (err.message || 'Unknown error'));
        } finally {
            setIsGenerating(false);
            setAiPrompt('');
        }
    };

    return (
        <div className="w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden relative flex border border-white/10 shadow-2xl">
            {/* Left side: Code Editor */}
            <div className="w-1/3 border-r border-white/10 flex flex-col z-20">
                <div className="bg-slate-900 border-b border-white/5 p-2 text-xs font-mono text-slate-400 font-semibold tracking-wider flex justify-between items-center">
                    <span className="flex items-center gap-1">
                        SCRIPT.FORGE.JS
                        {isGenerating && <span className="text-[10px] text-indigo-400 ml-2 animate-pulse">✨ Generating...</span>}
                    </span>
                    {loading && <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />}
                </div>

                {/* AI Prompt Input */}
                <form onSubmit={handleAIGenerate} className="bg-slate-900 border-b border-white/5 p-2 flex gap-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="✨ Describe your 3D shape..."
                        disabled={isGenerating}
                        className="flex-1 bg-slate-800 text-white placeholder:text-slate-500 text-xs px-2 py-1.5 rounded outline-none border border-slate-700 focus:border-indigo-500 transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                    >
                        ➤
                    </button>
                </form>

                <div className="flex-1 overflow-hidden relative">
                    <CodeEditor
                        value={scriptCode}
                        onChange={setScriptCode}
                        language="javascript"
                    />
                </div>
            </div>

            {/* Right side: 3D View */}
            <div className="flex-1 relative flex flex-col">
                <CADToolbar
                    mode={mode}
                    setMode={setMode}
                    showBBox={showBBox}
                    setShowBBox={setShowBBox}
                    handleResetView={handleResetView}
                    setMeasurements={setMeasurements}
                    handleFileUpload={handleFileUpload}
                    onAddPrimitive={handleAddPrimitive}
                    handleDeleteSelected={handleDeleteSelected}
                    selectedId={selectedId}
                />

                <PropertiesPanel
                    objects={objects}
                    selectedId={selectedId}
                    handleUpdateObject={handleUpdateObject}
                    forgeParams={forgeParams}
                    paramOverrides={paramOverrides}
                    setParamOverrides={setParamOverrides}
                />

                {/* Mode Indicator */}
                <div className="absolute top-16 right-4 z-10 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white/80">
                        {mode === 'view' && 'View Mode'}
                        {mode === 'edit' && 'Editor Mode: Select objects to move'}
                        {mode === 'distance' && 'Click 2 points to measure'}
                        {mode === 'angle' && 'Click 2 faces to measure angle'}
                    </div>
                </div>

                {error && (
                    <div className="absolute top-20 left-4 right-4 z-40 bg-red-500/80 text-white px-4 py-2 rounded-md backdrop-blur-sm text-sm overflow-auto max-h-40">
                        <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
                    </div>
                )}

                <div
                    className="flex-1 cursor-crosshair"
                    onWheel={(e) => {
                        if (!e.ctrlKey) {
                            e.stopPropagation();
                        }
                    }}
                >
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
                        <color attach="background" args={['#0f172a']} />
                        <Bounds fit clip observe margin={1.2}>
                            <BoundsRefresher objectCount={objects.length} />
                            <MeasurementScene
                                objects={objects}
                                mode={mode}
                                showBBox={showBBox}
                                measurements={measurements}
                                onAddMeasurement={(m) => setMeasurements(prev => [...prev, m])}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                onUpdateObject={handleUpdateObject}
                                scope={scope}
                                scopeVersion={scopeVersion}
                            />
                        </Bounds>
                        <OrbitControls
                            makeDefault
                            ref={controlsRef}
                            mouseButtons={{
                                LEFT: THREE.MOUSE.PAN,
                                MIDDLE: THREE.MOUSE.DOLLY,
                                RIGHT: THREE.MOUSE.ROTATE
                            }}
                            enablePan={true}
                            panSpeed={1}
                            rotateSpeed={0.5}
                        />
                        <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                    </Canvas>
                </div>

                {objects.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="text-slate-500 text-center">
                            <p className="text-4xl mb-2">⌬</p>
                            <p className="text-sm">Write or prompt AI to generate geometry</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CADBlock;
