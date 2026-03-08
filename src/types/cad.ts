import * as THREE from 'three';

export type MeasureMode = 'view' | 'distance' | 'angle' | 'edit' | 'sketch' | 'sketch-face';

export interface Measurement {
    type: 'distance' | 'angle' | 'area';
    points?: THREE.Vector3[];
    value: number;
    position: THREE.Vector3;
}

export interface SceneObject {
    id: string;
    type: 'step' | 'cube' | 'sphere' | 'cylinder' | 'extrusion' | 'forge';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    data?: string; // For STEP files (base64) or Extrusion path (JSON)
    dims?: [number, number, number]; // For primitives
    dimBindings?: [string?, string?, string?]; // Variable names for [x, y, z]
    sketchId?: string; // For extrusions
    extrudeDepth?: number;
    extrudeBinding?: string;
    name?: string;
    meshGroup?: THREE.Group;
}

export interface SketchPoint {
    id: string;
    x: number;
    y: number;
}

export interface SketchSegment {
    id: string;
    type: 'line' | 'arc';
    startId: string;
    endId: string;
}

export interface Sketch {
    id: string;
    name: string;
    plane: 'xy' | 'xz' | 'yz' | 'face';
    points: SketchPoint[];
    segments: SketchSegment[];
    // For face-based sketches
    faceId?: string;
    origin?: [number, number, number];
    normal?: [number, number, number];
    up?: [number, number, number];
}
