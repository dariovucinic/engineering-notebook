import React, { useState } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { SceneObjectMesh } from './SceneObjectMesh';
import { SceneObject, Measurement, MeasureMode } from '@/types/cad';

export const MeasurementScene: React.FC<{
    objects: SceneObject[];
    mode: MeasureMode;
    showBBox: boolean;
    measurements: Measurement[];
    onAddMeasurement: (m: Measurement) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
    onSelectFace?: (faceInfo: {
        origin: [number, number, number],
        normal: [number, number, number],
        up: [number, number, number]
    }) => void;
    scope: any;
    scopeVersion: number;
}> = ({ objects, mode, showBBox, measurements, onAddMeasurement, selectedId, onSelect, onUpdateObject, onSelectFace, scope, scopeVersion }) => {
    const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null);
    const [snapType, setSnapType] = useState<'vertex' | 'edge' | 'face' | null>(null);
    const [selectedPoints, setSelectedPoints] = useState<THREE.Vector3[]>([]);
    const [selectedNormals, setSelectedNormals] = useState<THREE.Vector3[]>([]);

    const snapToGeometry = (e: any): { point: THREE.Vector3, type: 'vertex' | 'edge' | 'face' } => {
        // 0. Handle LineSegments (Sharp Edges)
        if (e.object.type === 'LineSegments' || (e.object.userData && e.object.userData.isEdge)) {
            // We hit a sharp edge line
            // Snap to the closest point on THIS segment
            // e.index is the segment index. 
            // LineSegments geometry position buffer stores pairs of points.
            const geometry = e.object.geometry;
            const pos = geometry.attributes.position;
            const matrixWorld = e.object.matrixWorld;

            // Get start/end of the segment
            // EdgesGeometry stores unique segments? 
            // LineSegments uses index if present, or just pairs. 
            // EdgesGeometry has no index usually.
            const idx = e.index; // index of the segment? Raycaster returns primitive index.

            // LineSegments raycast returns 'index' which is the index of the segment * 2? 
            // No, Three.js raycast on LineSegments returns faceIndex? 
            // Actually it returns 'index' as the segment index.

            const a = new THREE.Vector3().fromBufferAttribute(pos, e.index * 2).applyMatrix4(matrixWorld);
            const b = new THREE.Vector3().fromBufferAttribute(pos, e.index * 2 + 1).applyMatrix4(matrixWorld);

            const line = new THREE.Line3(a, b);
            const closest = new THREE.Vector3();
            line.closestPointToPoint(e.point, true, closest);

            // Should we snap to endpoints (vertices) of this segment?
            const threshold = 0.2;
            if (a.distanceTo(closest) < threshold) return { point: a, type: 'vertex' };
            if (b.distanceTo(closest) < threshold) return { point: b, type: 'vertex' };

            return { point: closest, type: 'edge' };
        }

        if (!e.face || !e.object.geometry) return { point: e.point, type: 'face' };

        const geometry = e.object.geometry;
        const posAttribute = geometry.attributes.position;
        const matrixWorld = e.object.matrixWorld;

        const a = new THREE.Vector3().fromBufferAttribute(posAttribute, e.face.a).applyMatrix4(matrixWorld);
        const b = new THREE.Vector3().fromBufferAttribute(posAttribute, e.face.b).applyMatrix4(matrixWorld);
        const c = new THREE.Vector3().fromBufferAttribute(posAttribute, e.face.c).applyMatrix4(matrixWorld);

        const point = e.point;
        const threshold = 0.2; // Snap threshold

        // 1. Check Vertices
        const verts = [a, b, c];
        for (const v of verts) {
            if (v.distanceTo(point) < threshold) {
                return { point: v, type: 'vertex' };
            }
        }

        // 2. Check Edges
        const edges = [[a, b], [b, c], [c, a]];
        for (const [start, end] of edges) {
            const line = new THREE.Line3(start, end);
            const closest = new THREE.Vector3();
            line.closestPointToPoint(point, true, closest);
            if (closest.distanceTo(point) < threshold) {
                return { point: closest, type: 'edge' };
            }
        }

        // 3. Fallback to Face
        return { point: e.point, type: 'face' };
    };

    const handlePointerMove = (e: any) => {
        if (mode === 'view' || mode === 'edit') return;
        e.stopPropagation();

        if (mode === 'distance') {
            const { point, type } = snapToGeometry(e);
            setHoveredPoint(point);
            setSnapType(type);
        } else {
            setHoveredPoint(e.point);
            setSnapType(null);
        }
    };

    const handleClick = (e: any) => {
        if (mode === 'edit' || mode === 'view') {
            if (mode === 'view') onSelect(null);
            return;
        }
        e.stopPropagation();

        if (mode === 'distance') {
            const { point: snapped, type } = snapToGeometry(e);

            // Smart Entity Selection: Face -> Area
            if (type === 'face' && e.face && e.object.geometry) {
                const geometry = e.object.geometry;
                const pos = geometry.attributes.position;
                const index = geometry.index;

                let totalArea = 0;
                if (index) {
                    for (let i = 0; i < index.count; i += 3) {
                        const a = new THREE.Vector3().fromBufferAttribute(pos, index.getX(i));
                        const b = new THREE.Vector3().fromBufferAttribute(pos, index.getX(i + 1));
                        const c = new THREE.Vector3().fromBufferAttribute(pos, index.getX(i + 2));
                        const triangle = new THREE.Triangle(a, b, c);
                        totalArea += triangle.getArea();
                    }
                } else {
                    for (let i = 0; i < pos.count; i += 3) {
                        const a = new THREE.Vector3().fromBufferAttribute(pos, i);
                        const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
                        const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
                        const triangle = new THREE.Triangle(a, b, c);
                        totalArea += triangle.getArea();
                    }
                }

                onAddMeasurement({
                    type: 'area',
                    value: totalArea,
                    position: snapped
                });
                return;
            }

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
        } else if (mode === 'sketch-face') {
            if (!e.face || !onSelectFace) return;

            const normal = e.face.normal.clone().applyQuaternion(e.object.quaternion).normalize();
            const origin = e.point.clone();

            const up = new THREE.Vector3(0, 1, 0);
            if (Math.abs(normal.dot(up)) > 0.9) {
                up.set(1, 0, 0);
            }
            const right = new THREE.Vector3().crossVectors(up, normal).normalize();
            const actualUp = new THREE.Vector3().crossVectors(normal, right).normalize();

            onSelectFace({
                origin: [origin.x, origin.y, origin.z],
                normal: [normal.x, normal.y, normal.z],
                up: [actualUp.x, actualUp.y, actualUp.z]
            });
        }
    };

    const handleBackgroundHover = (e: any) => {
        if (mode === 'distance' || mode === 'angle') {
            setHoveredPoint(null);
        }
    };

    return (
        <>
            {/* Manual lighting — no HDR fetch needed */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
            <directionalLight position={[-10, -5, -10]} intensity={0.3} />
            <group>
                {objects.map(obj => (
                    <SceneObjectMesh
                        key={obj.id}
                        object={obj}
                        isSelected={obj.id === selectedId}
                        onSelect={onSelect}
                        onUpdate={(updates) => onUpdateObject(obj.id, updates)}
                        mode={mode}
                        onMeasureClick={handleClick}
                        onMeasureHover={handlePointerMove}
                        scope={scope}
                        scopeVersion={scopeVersion}
                    />
                ))}

                {/* Invisible plane for catching clicks in empty space */}
                <mesh visible={false} onClick={() => onSelect(null)} onPointerMove={handleBackgroundHover}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial />
                </mesh>
            </group>

            {/* Active Selection Points */}
            {selectedPoints.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[1.0]} />
                    <meshBasicMaterial color="red" depthTest={false} />
                </mesh>
            ))}

            {/* Hover Indicator */}
            {hoveredPoint && mode !== 'view' && mode !== 'edit' && (
                <mesh position={hoveredPoint}>
                    <sphereGeometry args={[1.2]} /> {/* Slightly larger for better visibility */}
                    <meshBasicMaterial color="yellow" transparent opacity={0.6} depthTest={false} />
                    {mode === 'distance' && snapType && (
                        <Html position={[0, 0.1, 0]}>
                            <div className={`text-[10px] px-1 rounded pointer-events-none capitalize ${snapType === 'vertex' ? 'bg-red-500/80 text-white font-bold' :
                                snapType === 'edge' ? 'bg-yellow-500/80 text-black font-bold' :
                                    'bg-black/50 text-white'
                                }`}>
                                {snapType} Snap
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
                            <mesh position={m.points[0]}><sphereGeometry args={[0.8]} /><meshBasicMaterial color="cyan" /></mesh>
                            <mesh position={m.points[1]}><sphereGeometry args={[0.8]} /><meshBasicMaterial color="cyan" /></mesh>
                        </>
                    )}
                    <Html position={m.position}>
                        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
                            {m.type === 'distance' ? `${m.value.toFixed(3)} mm` :
                                m.type === 'area' ? `${m.value.toFixed(2)} mm²` :
                                    `${m.value.toFixed(1)}°`}
                        </div>
                    </Html>
                </group>
            ))}
        </>
    );
};
