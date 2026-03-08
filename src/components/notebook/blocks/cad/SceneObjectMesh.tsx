import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
// @ts-ignore
import occtimportjs from 'occt-import-js';
import { STLLoader } from 'three-stdlib';
import { SceneObject, MeasureMode } from '@/types/cad';

// Simple component to render extrusion geometry
const ExtrusionMesh: React.FC<{
    object: SceneObject;
    commonProps: any;
}> = ({ object, commonProps }) => {
    // For now, render a placeholder box. The actual extrusion geometry
    // should be generated from the sketch data stored in the object.
    // This is a simplification - a full implementation would reconstruct the shape.
    const depth = object.extrudeDepth || 1;
    return (
        <mesh {...commonProps}>
            <boxGeometry args={[1, 1, depth]} />
            <meshStandardMaterial color={object.color} />
        </mesh>
    );
};

export const SceneObjectMesh: React.FC<{
    object: SceneObject;
    isSelected: boolean;
    onSelect: (e: any) => void;
    onUpdate: (updates: Partial<SceneObject>) => void;
    mode: MeasureMode;
    onMeasureClick?: (e: any) => void;
    onMeasureHover?: (e: any) => void;
    scope: any;
    scopeVersion: number;
}> = ({ object, isSelected, onSelect, onUpdate, mode, onMeasureClick, onMeasureHover, scope, scopeVersion }) => {
    const [meshObj, setMeshObj] = useState<THREE.Object3D | null>(null);
    const [stepMesh, setStepMesh] = useState<THREE.Group | null>(null);

    // Load geometry (STEP or STL) if needed
    useEffect(() => {
        if (object.type === 'step' && object.data && !stepMesh) {
            const loadGeometry = async () => {
                try {
                    const dataStr = object.data!;
                    const isSTL = dataStr.includes('model/stl');
                    const base64Content = dataStr.split(',')[1];
                    const binaryString = window.atob(base64Content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    if (isSTL) {
                        console.log('[SceneObjectMesh] Detected STL, parsing with STLLoader...');
                        const loader = new STLLoader();
                        const geometry = loader.parse(bytes.buffer);
                        console.log('[SceneObjectMesh] STL Geometry parsed:', geometry.attributes.position.count, 'vertices');
                        const material = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(object.color),
                            metalness: 0.3,
                            roughness: 0.4,
                            side: THREE.DoubleSide
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        const group = new THREE.Group();
                        group.add(mesh);

                        // Let's NOT auto-center FreeCAD geometry by default, 
                        // because we want Sketch -> 3D alignment.
                        // However, FreeCAD returns relative coordinates if extruded from face.
                        // For a simple world-sketch, they match.

                        setStepMesh(group);
                    } else {
                        const occt = await occtimportjs({
                            locateFile: (name: string) => name.endsWith('.wasm') ? '/occt-import-js.wasm' : name
                        });

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
                                const mesh = new THREE.Mesh(geometry, material);
                                group.add(mesh);

                                // Generate specific EdgesGeometry for snapping
                                const edges = new THREE.EdgesGeometry(geometry, 15); // Threshold angle
                                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, visible: false })); // Invisible but raycastable? No, needs to be visible for raycast or we use custom logic.
                                // Actually, let's make it visible but transparent so we can debug, or just rely on 'mesh' for raycast and calculate edges?
                                // Better: Raycast directly against LineSegments.
                                line.userData = { isEdge: true, parentMesh: mesh };
                                group.add(line);
                            }
                            // Center geometry for general STEP imports
                            const box = new THREE.Box3().setFromObject(group);
                            const center = box.getCenter(new THREE.Vector3());
                            group.position.sub(center);
                            setStepMesh(group);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load geometry", e);
                }
            };
            loadGeometry();
        }
    }, [object.type, object.data, stepMesh, object.color]);

    const handlePointerDown = (e: any) => {
        // console.log('[SceneObjectMesh] PointerDown', object.id, mode);
        if (mode === 'edit') {
            e.stopPropagation();
            onSelect(object.id);
        } else if (mode === 'distance' || mode === 'angle') {
            // Forward to measurement handler
            if (onMeasureClick) {
                onMeasureClick(e);
            }
        }
    };

    const handlePointerMove = (e: any) => {
        if ((mode === 'distance' || mode === 'angle') && onMeasureHover) {
            onMeasureHover(e);
        }
    };

    // Calculate effective dimensions based on bindings
    const effectiveDims = useMemo(() => {
        const currentDims = [...(object.dims || [1, 1, 1])] as [number, number, number];
        if (object.dimBindings) {
            object.dimBindings.forEach((binding, i) => {
                if (binding && scope.current[binding] !== undefined) {
                    const val = Number(scope.current[binding]);
                    if (!isNaN(val)) {
                        currentDims[i] = val;
                    }
                }
            });
        }
        return currentDims;
    }, [object.dims, object.dimBindings, scopeVersion, scope]); // scopeVersion triggers update

    const commonProps = {
        ref: setMeshObj,
        position: new THREE.Vector3(...object.position),
        rotation: new THREE.Euler(...object.rotation),
        scale: new THREE.Vector3(...object.scale),
        onClick: handlePointerDown,
        onPointerMove: handlePointerMove,
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
                    <boxGeometry args={effectiveDims} />
                    <meshStandardMaterial color={object.color} />
                </mesh>
            )}
            {object.type === 'sphere' && (
                <mesh {...commonProps}>
                    <sphereGeometry args={[effectiveDims[0] / 2, 32, 32]} />
                    <meshStandardMaterial color={object.color} />
                </mesh>
            )}
            {object.type === 'cylinder' && (
                <mesh {...commonProps}>
                    <cylinderGeometry args={[effectiveDims[0] / 2, effectiveDims[0] / 2, effectiveDims[1], 32]} />
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
                    onPointerMove={handlePointerMove}
                />
            )}
            {object.type === 'extrusion' && (
                <ExtrusionMesh
                    object={object}
                    commonProps={commonProps}
                />
            )}
            {object.type === 'forge' && object.meshGroup && (
                <primitive
                    object={object.meshGroup}
                    ref={setMeshObj}
                    position={new THREE.Vector3(...object.position)}
                    rotation={new THREE.Euler(...object.rotation)}
                    scale={new THREE.Vector3(...object.scale)}
                    onClick={handlePointerDown}
                    onPointerMove={handlePointerMove}
                />
            )}
        </>
    );
};
