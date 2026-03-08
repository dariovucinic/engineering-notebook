import * as THREE from 'three';
import { Sketch, SketchPoint, SceneObject } from '@/types/cad';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a 3D extrusion from a closed sketch profile.
 * Assumes the sketch is on the XY plane.
 */
export function extrudeSketch(sketch: Sketch, depth: number, color?: string): SceneObject | null {
    if (sketch.segments.length < 3) {
        console.warn("Extrude requires at least 3 segments (closed loop).");
        return null;
    }

    // Build a path from segments
    // We need to order segments properly to form a closed loop
    // Simple approach: assume segments are ordered correctly (first segment start -> last segment end should close)

    const orderedPoints: SketchPoint[] = [];
    const segmentsCopy = [...sketch.segments];

    // Start from first segment
    if (segmentsCopy.length === 0) return null;

    const firstSeg = segmentsCopy.shift()!;
    const startPoint = sketch.points.find(p => p.id === firstSeg.startId);
    const nextPoint = sketch.points.find(p => p.id === firstSeg.endId);

    if (!startPoint || !nextPoint) return null;

    orderedPoints.push(startPoint, nextPoint);

    // Walk through remaining segments
    while (segmentsCopy.length > 0) {
        const lastPointId = orderedPoints[orderedPoints.length - 1].id;
        const nextSegIndex = segmentsCopy.findIndex(s => s.startId === lastPointId || s.endId === lastPointId);

        if (nextSegIndex === -1) {
            console.warn("Sketch is not a closed loop!");
            break;
        }

        const seg = segmentsCopy.splice(nextSegIndex, 1)[0];
        const ptId = seg.startId === lastPointId ? seg.endId : seg.startId;
        const pt = sketch.points.find(p => p.id === ptId);

        if (pt && pt.id !== orderedPoints[0].id) {
            orderedPoints.push(pt);
        }
    }

    // Create THREE.Shape from ordered points
    const shape = new THREE.Shape();
    shape.moveTo(orderedPoints[0].x, orderedPoints[0].y);
    for (let i = 1; i < orderedPoints.length; i++) {
        shape.lineTo(orderedPoints[i].x, orderedPoints[i].y);
    }
    shape.closePath();

    // ExtrudeGeometry
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: false
    });

    // Create SceneObject (we'll serialize the geometry data)
    const newObject: SceneObject = {
        id: uuidv4(),
        type: 'extrusion',
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0], // Rotate so extrusion is along Z -> Y up
        scale: [1, 1, 1],
        color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
        sketchId: sketch.id,
        extrudeDepth: depth
    };

    return newObject;
}
