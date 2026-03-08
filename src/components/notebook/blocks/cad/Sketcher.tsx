import React, { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { Sketch, SketchPoint, SketchSegment } from '@/types/cad';
import { v4 as uuidv4 } from 'uuid';

interface SketcherProps {
    activeSketch: Sketch;
    onUpdateSketch: (sketch: Sketch) => void;
    onExtrude?: (sketchId: string, depth: number) => void;
}

export const Sketcher: React.FC<SketcherProps> = ({ activeSketch, onUpdateSketch, onExtrude }) => {
    console.log('[Sketcher] Rendering...', activeSketch.id, activeSketch.plane);
    const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
    const [snapPoint, setSnapPoint] = useState<SketchPoint | null>(null);

    // Compute transformation matrices for face-based sketching
    const { matrix, inverseMatrix } = useMemo(() => {
        if (activeSketch.plane !== 'face' || !activeSketch.origin || !activeSketch.normal || !activeSketch.up) {
            return { matrix: new THREE.Matrix4(), inverseMatrix: new THREE.Matrix4() };
        }

        const origin = new THREE.Vector3(...activeSketch.origin);
        const normal = new THREE.Vector3(...activeSketch.normal);
        const up = new THREE.Vector3(...activeSketch.up);
        const right = new THREE.Vector3().crossVectors(up, normal).normalize();

        const m = new THREE.Matrix4().makeBasis(right, up, normal);
        m.setPosition(origin);

        const inv = m.clone().invert();
        return { matrix: m, inverseMatrix: inv };
    }, [activeSketch.plane, activeSketch.origin, activeSketch.normal, activeSketch.up]);

    const handlePointerMove = (e: any) => {
        e.stopPropagation();
        let point = e.point.clone();

        // If sketching on face, transform world point to local plane space (where z=0)
        if (activeSketch.plane === 'face') {
            point.applyMatrix4(inverseMatrix);
            // Snap in local space
            point.x = Math.round(point.x * 2) / 2;
            point.y = Math.round(point.y * 2) / 2;
            point.z = 0;
            // Back to world for hover visualization
            point.applyMatrix4(matrix);
        } else if (activeSketch.plane === 'xy') {
            point.x = Math.round(point.x * 2) / 2;
            point.y = Math.round(point.y * 2) / 2;
            point.z = 0;
        } else if (activeSketch.plane === 'xz') {
            point.x = Math.round(point.x * 2) / 2;
            point.z = Math.round(point.z * 2) / 2;
            point.y = 0;
        } else if (activeSketch.plane === 'yz') {
            point.y = Math.round(point.y * 2) / 2;
            point.z = Math.round(point.z * 2) / 2;
            point.x = 0;
        }

        // Check snap to existing points (using 3D distance)
        let closest: SketchPoint | null = null;
        let minDist = 0.2;

        for (const p of activeSketch.points) {
            let pVec: THREE.Vector3;
            if (activeSketch.plane === 'face') {
                pVec = new THREE.Vector3(p.x, p.y, 0).applyMatrix4(matrix);
            } else if (activeSketch.plane === 'xy') {
                pVec = new THREE.Vector3(p.x, p.y, 0);
            } else if (activeSketch.plane === 'xz') {
                pVec = new THREE.Vector3(p.x, 0, p.y);
            } else {
                pVec = new THREE.Vector3(0, p.x, p.y);
            }

            const dist = pVec.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                closest = p;
            }
        }

        if (closest) {
            setSnapPoint(closest);
            const cp = activeSketch.plane === 'face' ? new THREE.Vector3(closest.x, closest.y, 0).applyMatrix4(matrix) :
                activeSketch.plane === 'xy' ? new THREE.Vector3(closest.x, closest.y, 0) :
                    activeSketch.plane === 'xz' ? new THREE.Vector3(closest.x, 0, closest.y) :
                        new THREE.Vector3(0, closest.x, closest.y);
            setHoverPoint(cp);
        } else {
            setSnapPoint(null);
            setHoverPoint(point);
        }
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        if (!hoverPoint) return;

        let newPoint: SketchPoint;
        if (snapPoint) {
            newPoint = snapPoint;
        } else {
            let x, y;
            if (activeSketch.plane === 'face') {
                const local = hoverPoint.clone().applyMatrix4(inverseMatrix);
                x = local.x;
                y = local.y;
            } else {
                x = activeSketch.plane === 'xy' || activeSketch.plane === 'xz' ? hoverPoint.x : hoverPoint.y;
                y = activeSketch.plane === 'xy' ? hoverPoint.y : hoverPoint.z;
            }

            newPoint = {
                id: uuidv4(),
                x,
                y
            };
        }

        const newPoints = snapPoint ? activeSketch.points : [...activeSketch.points, newPoint];
        const newSegments = [...activeSketch.segments];

        if (activeSketch.points.length > 0) {
            const lastPoint = activeSketch.points[activeSketch.points.length - 1];
            if (lastPoint.id !== newPoint.id) {
                newSegments.push({
                    id: uuidv4(),
                    type: 'line',
                    startId: lastPoint.id,
                    endId: newPoint.id
                });
            }
        }

        onUpdateSketch({
            ...activeSketch,
            points: newPoints,
            segments: newSegments
        });
    };

    // Convert segments to line points for rendering
    const linePoints = activeSketch.segments.map(seg => {
        const start = activeSketch.points.find(p => p.id === seg.startId);
        const end = activeSketch.points.find(p => p.id === seg.endId);
        if (start && end) {
            if (activeSketch.plane === 'face') {
                return [
                    new THREE.Vector3(start.x, start.y, 0).applyMatrix4(matrix),
                    new THREE.Vector3(end.x, end.y, 0).applyMatrix4(matrix)
                ];
            } else if (activeSketch.plane === 'xy') {
                return [new THREE.Vector3(start.x, start.y, 0), new THREE.Vector3(end.x, end.y, 0)];
            } else if (activeSketch.plane === 'xz') {
                return [new THREE.Vector3(start.x, 0, start.y), new THREE.Vector3(end.x, 0, end.y)];
            } else {
                return [new THREE.Vector3(0, start.x, start.y), new THREE.Vector3(0, end.x, end.y)];
            }
        }
        return null;
    }).filter(Boolean) as [THREE.Vector3, THREE.Vector3][];

    return (
        <group>
            {/* Drawing Plane */}
            <mesh
                visible={false}
                onPointerMove={handlePointerMove}
                onClick={handleClick}
                rotation={
                    activeSketch.plane === 'face' ? [0, 0, 0] :
                        activeSketch.plane === 'xy' ? [0, 0, 0] :
                            activeSketch.plane === 'xz' ? [-Math.PI / 2, 0, 0] :
                                [0, Math.PI / 2, 0]
                }
                position={activeSketch.plane === 'face' ? new THREE.Vector3(...activeSketch.origin!) : [0, 0, 0]}
                onUpdate={(self) => {
                    if (activeSketch.plane === 'face') {
                        self.setRotationFromMatrix(matrix);
                    }
                }}
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial />
            </mesh>

            {/* Grid for Sketching */}
            {activeSketch.plane === 'face' ? (
                <group position={new THREE.Vector3(...activeSketch.origin!)} quaternion={new THREE.Quaternion().setFromRotationMatrix(matrix)}>
                    <gridHelper args={[10, 10, 0x00ffff, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />
                </group>
            ) : (
                <gridHelper
                    args={[20, 20, 0x444444, 0x222222]}
                    rotation={
                        activeSketch.plane === 'xy' ? [Math.PI / 2, 0, 0] :
                            activeSketch.plane === 'xz' ? [0, 0, 0] :
                                [0, 0, Math.PI / 2]
                    }
                />
            )}

            {/* Render Segments */}
            {linePoints.map((points, i) => (
                <Line
                    key={i}
                    points={points}
                    color="white"
                    lineWidth={2}
                />
            ))}

            {/* Render Points */}
            {activeSketch.points.map(p => (
                <mesh key={p.id} position={
                    activeSketch.plane === 'face' ? new THREE.Vector3(p.x, p.y, 0).applyMatrix4(matrix) :
                        activeSketch.plane === 'xy' ? [p.x, p.y, 0] :
                            activeSketch.plane === 'xz' ? [p.x, 0, p.y] :
                                [0, p.x, p.y]
                }>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="lime" />
                </mesh>
            ))}

            {/* Cursor / Rubber band line */}
            {hoverPoint && activeSketch.points.length > 0 && (
                <Line
                    points={[
                        activeSketch.plane === 'face' ? new THREE.Vector3(activeSketch.points[activeSketch.points.length - 1].x, activeSketch.points[activeSketch.points.length - 1].y, 0).applyMatrix4(matrix) :
                            activeSketch.plane === 'xy' ? new THREE.Vector3(activeSketch.points[activeSketch.points.length - 1].x, activeSketch.points[activeSketch.points.length - 1].y, 0) :
                                activeSketch.plane === 'xz' ? new THREE.Vector3(activeSketch.points[activeSketch.points.length - 1].x, 0, activeSketch.points[activeSketch.points.length - 1].y) :
                                    new THREE.Vector3(0, activeSketch.points[activeSketch.points.length - 1].x, activeSketch.points[activeSketch.points.length - 1].y),
                        hoverPoint
                    ]}
                    color="lime"
                    lineWidth={1}
                    dashed
                />
            )}

            {hoverPoint && (
                <mesh position={hoverPoint}>
                    <ringGeometry args={[0.08, 0.1, 32]} />
                    <meshBasicMaterial color={snapPoint ? "cyan" : "lime"} />
                </mesh>
            )}
        </group>
    );
};
