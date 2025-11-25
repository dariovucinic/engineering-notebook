/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import occtimportjs from 'occt-import-js';
import { Ruler, BoxSelect, RotateCw, MousePointer2, Trash2, Home } from 'lucide-react';

interface CADBlockProps {
    id: string;
    content: string;
    onUpdate: (content: string) => void;
}

type MeasureMode = 'view' | 'distance' | 'angle';

interface Measurement {
    type: 'distance' | 'angle';
    points?: THREE.Vector3[];
    value: number;
    position: THREE.Vector3;
}

const MeasurementScene: React.FC<{
    mesh: THREE.Group | null;
    mode: MeasureMode;
    showBBox: boolean;
    measurements: Measurement[];
    onAddMeasurement: (m: Measurement) => void;
    controlsRef: React.RefObject<any>;
}> = ({ mesh, mode, showBBox, measurements, onAddMeasurement, controlsRef }) => {
    const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null);
    const [selectedPoints, setSelectedPoints] = useState<THREE.Vector3[]>([]);
    const [selectedNormals, setSelectedNormals] = useState<THREE.Vector3[]>([]);
    const { camera, scene } = useThree();

    // Bounding Box Calculation
    const bbox = useMemo(() => {
        if (!mesh) return null;
        return new THREE.Box3().setFromObject(mesh);
    }, [mesh]);

    const bboxDims = useMemo(() => {
        if (!bbox) return null;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        return size;
    }, [bbox]);

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
        if (mode === 'view') return;
        e.stopPropagation();

        if (mode === 'distance') {
            const snapped = snapToVertex(e);
            setHoveredPoint(snapped);
        } else {
            setHoveredPoint(e.point);
        }
    };

    const handleClick = (e: any) => {
        if (mode === 'view') return;
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
            <Stage environment="city" intensity={0.6}>
                {mesh && (
                    <primitive
                        object={mesh}
                        onPointerMove={handlePointerMove}
                        onClick={handleClick}
                    />
                )}
            </Stage>

            {/* Bounding Box */}
            {showBBox && bbox && bboxDims && (
                <group>
                    <boxHelper args={[mesh as any, 0xffff00]} />
                    <Html position={[bbox.max.x, bbox.max.y, bbox.max.z]}>
                        <div className="bg-black/80 text-white text-xs p-1 rounded whitespace-nowrap">
                            {bboxDims.x.toFixed(2)} x {bboxDims.y.toFixed(2)} x {bboxDims.z.toFixed(2)}
                        </div>
                    </Html>
                </group>
            )}

            {/* Active Selection Points */}
            {selectedPoints.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="red" depthTest={false} />
                </mesh>
            ))}

            {/* Hover Indicator */}
            {hoveredPoint && mode !== 'view' && (
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
    const [mesh, setMesh] = useState<THREE.Group | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<MeasureMode>('view');
    const [showBBox, setShowBBox] = useState(false);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const controlsRef = useRef<any>(null);

    const handleResetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setMeasurements([]);

        try {
            const buffer = await file.arrayBuffer();
            const occt = await occtimportjs({
                locateFile: (name: string) => name.endsWith('.wasm') ? '/occt-import-js.wasm' : name
            });
            const result = occt.ReadStepFile(new Uint8Array(buffer), null);

            if (!result.success) throw new Error('Failed to read STEP file');

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
                    color: new THREE.Color(meshData.color ? `rgb(${Math.round(meshData.color[0] * 255)}, ${Math.round(meshData.color[1] * 255)}, ${Math.round(meshData.color[2] * 255)})` : '#cccccc'),
                    metalness: 0.3,
                    roughness: 0.4,
                    side: THREE.DoubleSide
                });
                group.add(new THREE.Mesh(geometry, material));
            }

            // Center and scale
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;

            group.position.sub(center);
            group.scale.setScalar(scale);

            setMesh(group);
        } catch (err: any) {
            console.error('CAD Import Error:', err);
            setError(err.message || 'Failed to import file');
        } finally {
            setLoading(false);
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
                        mesh={mesh}
                        mode={mode}
                        showBBox={showBBox}
                        measurements={measurements}
                        onAddMeasurement={(m) => setMeasurements(prev => [...prev, m])}
                        controlsRef={controlsRef}
                    />
                    <OrbitControls makeDefault ref={controlsRef} enabled={mode === 'view'} />
                    <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                </Canvas>
            </div>

            {!mesh && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-slate-500 text-center">
                        <p className="text-4xl mb-2">🧊</p>
                        <p>Drop a STEP file here or click Import</p>
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
