/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Html, Line, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import occtimportjs from 'occt-import-js';
import { Ruler, BoxSelect, RotateCw, MousePointer2, Trash2, Home, Box, Circle, Move, PenTool } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CADBlockProps {
    id: string;
    content: string;
    onUpdate: (content: string) => void;
}

type MeasureMode = 'view' | 'distance' | 'angle' | 'edit';

interface Measurement {
    type: 'distance' | 'angle';
    points?: THREE.Vector3[];
    value: number;
    position: THREE.Vector3;
}

interface SceneObject {
    id: string;
    type: 'step' | 'cube' | 'sphere' | 'cylinder';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    data?: string; // For STEP files, the base64 content
    dims?: [number, number, number]; // For primitives
}

const SceneObjectMesh: React.FC<{
    object: SceneObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onUpdate: (updates: Partial<SceneObject>) => void;
    mode: MeasureMode;
}> = ({ object, isSelected, onSelect, onUpdate, mode }) => {
    const [meshObj, setMeshObj] = useState<THREE.Object3D | null>(null);
    const [stepMesh, setStepMesh] = useState<THREE.Group | null>(null);

    // Load STEP file if needed
    useEffect(() => {
        if (object.type === 'step' && object.data && !stepMesh) {
            const loadStep = async () => {
                try {
                    const occt = await occtimportjs({
                        locateFile: (name: string) => name.endsWith('.wasm') ? '/occt-import-js.wasm' : name
                    });
                    // Convert base64 to buffer
                    const binaryString = window.atob(object.data!.split(',')[1]);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    const result = occt.ReadStepFile(bytes, null);
                    if (result.success) {
                        const group = new THREE.Group();
                        for (const meshData of result.meshes) {
                            const geometry = new THREE.BufferGeometry();
                            geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
                            if (meshData.attributes.normal) {
                                geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
                            }
                            if (meshData.index) {
                                geometry.setIndex(new THREE.Uint16BufferAttribute(meshData.index.array, 1));
                            }
                            const material = new THREE.MeshStandardMaterial({
                                color: new THREE.Color(meshData.color ? `rgb(${Math.round(meshData.color[0] * 255)}, ${Math.round(meshData.color[1] * 255)}, ${Math.round(meshData.color[2] * 255)})` : object.color),
                                metalness: 0.3,
                                roughness: 0.4,
                                side: THREE.DoubleSide
                            });
                            group.add(new THREE.Mesh(geometry, material));
                        }
                        // Center geometry
                        const box = new THREE.Box3().setFromObject(group);
                        const center = box.getCenter(new THREE.Vector3());
                        group.position.sub(center);
                        setStepMesh(group);
                    }
                } catch (e) {
                    console.error("Failed to load STEP", e);
                }
            };
            loadStep();
        }
    }, [object.type, object.data, stepMesh, object.color]);

    const handlePointerDown = (e: any) => {
        if (mode === 'edit') {
            e.stopPropagation();
            onSelect(object.id);
        }
    };

    const commonProps = {
        ref: setMeshObj,
        position: new THREE.Vector3(...object.position),
        rotation: new THREE.Euler(...object.rotation),
        scale: new THREE.Vector3(...object.scale),
        onClick: handlePointerDown,
    };

    return (
        <>
            {isSelected && mode === 'edit' && meshObj && (
                <TransformControls
                    object={meshObj}
                    mode="translate"
                    onObjectChange={(e: any) => {
                        if (e?.target?.object) {
                            const o = e.target.object;
                            onUpdate({
                                position: [o.position.x, o.position.y, o.position.z],
                                rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
                                scale: [o.scale.x, o.scale.y, o.scale.z]
                            });
                        }
                    }}
                />
            )}

            {object.type === 'cube' && (
                <mesh {...commonProps}>
                    <boxGeometry args={object.dims || [1, 1, 1]} />
                    <meshStandardMaterial color={object.color} />
                </mesh>
            )}
            {object.type === 'sphere' && (
                <mesh {...commonProps}>
                    <sphereGeometry args={[(object.dims?.[0] || 1) / 2, 32, 32]} />
                    <meshStandardMaterial color={object.color} />
                </mesh>
            )}
            {object.type === 'cylinder' && (
                <mesh {...commonProps}>
                    <cylinderGeometry args={[(object.dims?.[0] || 1) / 2, (object.dims?.[0] || 1) / 2, object.dims?.[1] || 1, 32]} />
                    <meshStandardMaterial color={object.color} />
                </mesh>
            )}
            {object.type === 'step' && stepMesh && (
                <primitive
                    object={stepMesh}
                    ref={setMeshObj}
                    position={new THREE.Vector3(...object.position)}
                    rotation={new THREE.Euler(...object.rotation)}
                    scale={new THREE.Vector3(...object.scale)}
                    onClick={handlePointerDown}
                />
            )}
        </>
    );
};

const MeasurementScene: React.FC<{
    objects: SceneObject[];
    mode: MeasureMode;
    showBBox: boolean;
    measurements: Measurement[];
    onAddMeasurement: (m: Measurement) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
}> = ({ objects, mode, showBBox, measurements, onAddMeasurement, selectedId, onSelect, onUpdateObject }) => {
    const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null);
    const [selectedPoints, setSelectedPoints] = useState<THREE.Vector3[]>([]);
    const [selectedNormals, setSelectedNormals] = useState<THREE.Vector3[]>([]);

    const snapToVertex = (e: any): THREE.Vector3 => {
        if (!e.face || !e.object.geometry) return e.point;

        const geometry = e.object.geometry;
        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Get vertices of the intersected face
        const indices = [e.face.a, e.face.b, e.face.c];
        let closestVertex = e.point;
        let minDistance = 0.2; // Snapping threshold

        indices.forEach(index => {
            vertex.fromBufferAttribute(posAttribute, index);
            vertex.applyMatrix4(e.object.matrixWorld); // Transform to world space

            const distance = vertex.distanceTo(e.point);
            if (distance < minDistance) {
                minDistance = distance;
                closestVertex = vertex.clone();
            }
        });

        return closestVertex;
    };

    const handlePointerMove = (e: any) => {
        if (mode === 'view' || mode === 'edit') return;
        e.stopPropagation();

        if (mode === 'distance') {
            const snapped = snapToVertex(e);
            setHoveredPoint(snapped);
        } else {
            setHoveredPoint(e.point);
        }
    };

    const handleClick = (e: any) => {
        if (mode === 'edit') {
            // Selection handled in SceneObjectMesh
            return;
        }
        if (mode === 'view') {
            onSelect(null);
            return;
        }
        e.stopPropagation();

        if (mode === 'distance') {
            const snapped = snapToVertex(e);
            const newPoints = [...selectedPoints, snapped];

            if (newPoints.length === 2) {
                const dist = newPoints[0].distanceTo(newPoints[1]);
                const midPoint = newPoints[0].clone().add(newPoints[1]).multiplyScalar(0.5);
                onAddMeasurement({
                    type: 'distance',
                    points: newPoints,
                    value: dist,
                    position: midPoint
                });
                setSelectedPoints([]);
            } else {
                setSelectedPoints(newPoints);
            }
        } else if (mode === 'angle') {
            if (!e.face) return;
            const normal = e.face.normal.clone().applyQuaternion(e.object.quaternion);
            const newNormals = [...selectedNormals, normal];

            if (newNormals.length === 2) {
                const angle = newNormals[0].angleTo(newNormals[1]) * (180 / Math.PI);
                onAddMeasurement({
                    type: 'angle',
                    value: angle,
                    position: e.point.clone().add(normal.multiplyScalar(0.2))
                });
                setSelectedNormals([]);
            } else {
                setSelectedNormals(newNormals);
            }
        }
    };

    return (
        <>
            <Stage environment="city" intensity={0.6} adjustCamera={false}>
                {objects.map(obj => (
                    <SceneObjectMesh
                        key={obj.id}
                        object={obj}
                        isSelected={obj.id === selectedId}
                        onSelect={onSelect}
                        onUpdate={(updates) => onUpdateObject(obj.id, updates)}
                        mode={mode}
                    />
                ))}

                {/* Invisible plane for catching clicks in empty space */}
                <mesh visible={false} onClick={() => onSelect(null)} onPointerMove={handlePointerMove}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial />
                </mesh>
            </Stage>

            {/* Active Selection Points */}
            {selectedPoints.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="red" depthTest={false} />
                </mesh>
            ))}

            {/* Hover Indicator */}
            {hoveredPoint && mode !== 'view' && mode !== 'edit' && (
                <mesh position={hoveredPoint}>
                    <sphereGeometry args={[0.03]} />
                    <meshBasicMaterial color="yellow" transparent opacity={0.5} depthTest={false} />
                    {mode === 'distance' && (
                        <Html position={[0, 0.1, 0]}>
                            <div className="bg-black/50 text-white text-[10px] px-1 rounded pointer-events-none">
                                Snap
                            </div>
                        </Html>
                    )}
                </mesh>
            )}

            {/* Measurements */}
            {measurements.map((m, i) => (
                <group key={i}>
                    {m.type === 'distance' && m.points && (
                        <>
                            <Line points={m.points} color="cyan" lineWidth={2} />
                            <mesh position={m.points[0]}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="cyan" /></mesh>
                            <mesh position={m.points[1]}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="cyan" /></mesh>
                        </>
                    )}
                    <Html position={m.position}>
                        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
                            {m.type === 'distance' ? `${m.value.toFixed(3)} mm` : `${m.value.toFixed(1)}°`}
                        </div>
                    </Html>
                </group>
            ))}
        </>
    );
};

const CADBlock: React.FC<CADBlockProps> = ({ id, content, onUpdate }) => {
    const [objects, setObjects] = useState<SceneObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<MeasureMode>('view');
    const [showBBox, setShowBBox] = useState(false);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const controlsRef = useRef<any>(null);

    // Parse content on mount
    useEffect(() => {
        try {
            if (content.startsWith('{')) {
                const parsed = JSON.parse(content);
                if (parsed.objects) {
                    setObjects(parsed.objects);
                    return;
                }
            }
            // Legacy support: treat as single STEP file URL/Base64
            if (content && content.length > 0) {
                setObjects([{
                    id: 'legacy-obj',
                    type: 'step',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    color: '#cccccc',
                    data: content
                }]);
            }
        } catch (e) {
            console.error("Failed to parse CAD content", e);
        }
    }, []);

    // Save content when objects change
    useEffect(() => {
        if (objects.length > 0) {
            const json = JSON.stringify({ objects });
            // Only update if different to avoid loops
            if (json !== content) {
                // Debounce or just update? For now just update, but be careful
                // onUpdate(json); 
                // Actually, let's update only on explicit actions to avoid perf issues
            }
        }
    }, [objects]); // Be careful with this dependency

    const saveScene = (newObjects: SceneObject[]) => {
        setObjects(newObjects);
        onUpdate(JSON.stringify({ objects: newObjects }));
    };

    const handleResetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
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
        saveScene([...objects, newObj]);
        setMode('edit');
        setSelectedId(newObj.id);
    };

    const handleDeleteSelected = () => {
        if (selectedId) {
            saveScene(objects.filter(o => o.id !== selectedId));
            setSelectedId(null);
        }
    };

    const handleUpdateObject = (id: string, updates: Partial<SceneObject>) => {
        const newObjects = objects.map(o => o.id === id ? { ...o, ...updates } : o);
        saveScene(newObjects);
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
                saveScene([...objects, newObj]);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            console.error('CAD Import Error:', err);
            setError(err.message || 'Failed to import file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden relative flex flex-col border border-white/10 shadow-2xl">
            {/* Toolbar */}
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
                    <div className="flex gap-1 bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10 animate-in slide-in-from-left-2">
                        <button onClick={() => handleAddPrimitive('cube')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Cube"><Box size={18} /></button>
                        <button onClick={() => handleAddPrimitive('sphere')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Sphere"><Circle size={18} /></button>
                        <button onClick={() => handleAddPrimitive('cylinder')} className="p-2 hover:bg-white/10 text-white/80 rounded-md" title="Add Cylinder"><div className="w-4 h-4 border-2 border-white/80 rounded-sm" /></button>
                        <div className="w-px bg-white/10 mx-1" />
                        <button
                            onClick={handleDeleteSelected}
                            disabled={!selectedId}
                            className="p-2 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-md"
                        >
                            <Trash2 size={18} />
                        </button>
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

            {/* Mode Indicator */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white/80">
                    {mode === 'view' && 'View Mode'}
                    {mode === 'edit' && 'Editor Mode: Select objects to move/rotate'}
                    {mode === 'distance' && 'Click 2 points to measure (Snaps to vertices)'}
                    {mode === 'angle' && 'Click 2 faces to measure angle'}
                </div>
            </div>

            {error && (
                <div className="absolute top-20 left-4 z-10 bg-red-500/80 text-white px-4 py-2 rounded-md backdrop-blur-sm text-sm">
                    {error}
                </div>
            )}

            {/* 3D Canvas */}
            <div className="flex-1 cursor-crosshair">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
                    <color attach="background" args={['#0f172a']} />
                    <MeasurementScene
                        objects={objects}
                        mode={mode}
                        showBBox={showBBox}
                        measurements={measurements}
                        onAddMeasurement={(m) => setMeasurements(prev => [...prev, m])}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onUpdateObject={handleUpdateObject}
                    />
                    <OrbitControls makeDefault ref={controlsRef} enabled={mode !== 'edit' || !selectedId} />
                    <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                </Canvas>
            </div>

            {objects.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-slate-500 text-center">
                        <p className="text-4xl mb-2">🧊</p>
                        <p>Drop a STEP file here or use Editor Mode</p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-sm">Processing Geometry...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CADBlock;
