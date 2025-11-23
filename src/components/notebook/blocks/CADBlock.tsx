import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import occtimportjs from 'occt-import-js';

interface CADBlockProps {
    id: string;
    content: string; // Base64 encoded file content or URL (for now we'll just store local state)
    onUpdate: (content: string) => void;
}

const CADBlock: React.FC<CADBlockProps> = ({ id, content, onUpdate }) => {
    const [mesh, setMesh] = useState<THREE.Group | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();

            // Initialize OCCT
            const occt = await occtimportjs({
                locateFile: (name: string) => {
                    if (name.endsWith('.wasm')) {
                        return '/occt-import-js.wasm';
                    }
                    return name;
                }
            });

            // Read file
            const result = occt.ReadStepFile(new Uint8Array(buffer), null);

            if (!result.success) {
                throw new Error('Failed to read STEP file');
            }

            // Process meshes
            const group = new THREE.Group();

            for (const meshData of result.meshes) {
                const geometry = new THREE.BufferGeometry();

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
                if (meshData.attributes.normal) {
                    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
                }

                // Create index if available
                if (meshData.index) {
                    geometry.setIndex(new THREE.Uint16BufferAttribute(meshData.index.array, 1));
                }

                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(meshData.color ? `rgb(${Math.round(meshData.color[0] * 255)}, ${Math.round(meshData.color[1] * 255)}, ${Math.round(meshData.color[2] * 255)})` : '#cccccc'),
                    metalness: 0.3,
                    roughness: 0.4,
                });

                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);
            }

            // Center and scale
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim; // Normalize to reasonable size

            group.position.sub(center); // Center at origin
            group.scale.setScalar(scale);

            setMesh(group);

            // In a real app we'd save the file content or upload it
            // onUpdate(base64Content); 

        } catch (err: any) {
            console.error('CAD Import Error:', err);
            setError(err.message || 'Failed to import file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-[500px] bg-slate-900 rounded-lg overflow-hidden relative flex flex-col">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm backdrop-blur-sm transition-colors border border-white/10"
                >
                    📂 Import STEP
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".stp,.step"
                    className="hidden"
                />
                {loading && <span className="text-white/70 text-sm flex items-center">Loading...</span>}
            </div>

            {error && (
                <div className="absolute top-16 left-4 z-10 bg-red-500/80 text-white px-4 py-2 rounded-md backdrop-blur-sm text-sm">
                    {error}
                </div>
            )}

            {/* 3D Canvas */}
            <div className="flex-1">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
                    <color attach="background" args={['#0f172a']} />
                    <Stage environment="city" intensity={0.6}>
                        {mesh && <primitive object={mesh} />}
                    </Stage>
                    <OrbitControls makeDefault />
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
        </div>
    );
};

export default CADBlock;
