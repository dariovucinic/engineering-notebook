import { initKernel } from 'forgecad/src/forge/index';
// @ts-ignore
import { runScript, shapeToGeometry, setParamOverrides } from 'forgecad/src/forge/headless';
import * as THREE from 'three';

let kernelInitialized = false;

export async function initializeForgeCAD() {
    if (kernelInitialized) return;

    try {
        // initKernel will automatically fetch '/manifold.wasm' because we put it in the public folder.
        // ForgeCAD's initKernel defaults to looking for it at the root.
        await initKernel();
        kernelInitialized = true;
    } catch (err) {
        console.error('Failed to initialize ForgeCAD kernel:', err);
        throw err;
    }
}

export interface ForgeResult {
    meshGroups: THREE.Group[];
    params: any[];
    error: string | null;
}

export async function runForgeScript(
    scriptCode: string,
    overrides: Record<string, number> = {},
    scopeVariables: Record<string, any> = {}
): Promise<ForgeResult> {
    await initializeForgeCAD();

    try {
        setParamOverrides(overrides);

        // Inject scope variables by wrapping the user script in a closure
        // that defines those variables first.
        const headerLines = Object.keys(scopeVariables)
            .filter(key => /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(key)) // Ensure valid JS identifier
            .map(key => `const ${key} = ${JSON.stringify(scopeVariables[key])};`)
            .join('\n');

        const injectedScript = `${headerLines}\n${scriptCode}`;

        const result = runScript(injectedScript, 'main.forge.js', {});

        if (result.error) {
            return { meshGroups: [], params: result.params, error: result.error };
        }

        const meshGroups: THREE.Group[] = [];

        // Convert the resulting objects to Three.js geometry directly
        for (const obj of result.objects) {
            if (obj.shape && !obj.shape.isEmpty()) {
                const { solid, edges } = shapeToGeometry(obj.shape);

                let color = 0xcccccc;
                if (obj.color && obj.color.startsWith('#')) {
                    color = parseInt(obj.color.substring(1), 16);
                }

                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.3,
                    roughness: 0.4,
                    side: THREE.DoubleSide,
                    polygonOffset: true,
                    polygonOffsetFactor: 1, // Pull faces back slightly so edge lines show clearly
                    polygonOffsetUnits: 1
                });

                const mesh = new THREE.Mesh(solid, material);
                const group = new THREE.Group();
                group.name = obj.name;
                group.add(mesh);

                // Add edges for CAD look
                if (edges) {
                    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true });
                    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
                    group.add(edgesMesh);
                }

                meshGroups.push(group);
            }
        }

        return { meshGroups, params: result.params, error: null };
    } catch (err: any) {
        return { meshGroups: [], params: [], error: err.message || String(err) };
    }
}
