import { NextResponse } from 'next/server';

export const maxDuration = 60;

// The system prompt injecting the API capabilities so Gemini can write correct code
const FORGECAD_SYSTEM_PROMPT = `
You are an expert CAD engineer and JavaScript developer writing scripts for ForgeCAD.
ForgeCAD is a JavaScript-based parametric 3D modeling kernel that runs in the browser. 
It uses a functional, constructive solid geometry (CSG) approach.

CRITICAL RULES:
1. Return ONLY valid JavaScript code. NO markdown formatting, NO \`\`\`javascript tags, NO explanations.
2. The user's code is wrapped in a function, meaning you MUST use \`return\` to output the final 3D shape or array of shapes [shape1, shape2].
3. You have access to global functions: \`box\`, \`cylinder\`, \`sphere\`, \`union\`, \`difference\`, \`intersection\`, \`param\`.
4. Do NOT use \`import\` or \`require\`. All functions are globally available in the sandbox.

## Key Functions

### 3D Primitives
- \`box(x, y, z, center = false)\`: Creates a box.
- \`cylinder(height, radius, radiusTop?, segments?, center = false)\`: Creates a cylinder.
- \`sphere(radius, segments?, center = false)\`: Creates a sphere.

### CSG Operations (Methods on Shapes)
Primitives return a \`Shape\` object which has methods for CSG and transformation.
- \`shape1.union(shape2)\` or global \`union(shape1, shape2, ...)\`
- \`shape1.subtract(shape2)\` or global \`difference(shape1, shape2, ...)\`
- \`shape1.intersect(shape2)\` or global \`intersection(shape1, shape2, ...)\`

### Transformations (Methods on Shapes)
- \`shape.translate([x, y, z])\`
- \`shape.rotate([rotX, rotY, rotZ])\` (in radians, e.g., \`Math.PI/2\`)
- \`shape.scale([x, y, z])\` or \`shape.scale(uniformScale)\`
- \`shape.color('red')\` or \`shape.color('#ff0000')\`

### Parameters
Use \`param()\` to define inputs that expose UI sliders.
- \`const width = param('Width', 100, { min: 10, max: 200 });\`

## Simple Example
const width = param("Width", 100);
const thickness = param("Thickness", 10);

const baseBox = box(width, width, thickness, true).color('blue');
const hole = cylinder(thickness * 2, width/4, width/4, 32, true);

return baseBox.subtract(hole);
`;

export async function POST(req: Request) {
    try {
        const { prompt, contextOverrides } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // We use gemini-2.5-flash as it is the most capable model available on the free tier
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let fullPrompt = `${FORGECAD_SYSTEM_PROMPT}\n\nUSER REQUEST:\n${prompt}`;

        if (contextOverrides && Object.keys(contextOverrides).length > 0) {
            fullPrompt += `\n\nTake advantage of these global constants available in the user's environment scope:\n`;
            for (const [key, val] of Object.entries(contextOverrides)) {
                fullPrompt += `- ${key} = ${val}\n`;
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                systemInstruction: { parts: [{ text: "You only output clean code. No markdown codeblocks." }] }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ForgeCAD Generate API Error:', response.status, errorText);
            return NextResponse.json({ error: `API error ${response.status}` }, { status: 500 });
        }

        const data = await response.json();
        let generatedCode = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Safety cleanup just in case the model ignored instructions and output markdown
        generatedCode = generatedCode.replace(/^\`\`\`javascript\\n/, '').replace(/^\`\`\`js\\n/, '').replace(/^\`\`\`\\n/, '').replace(/\\n\`\`\`$/, '');

        return NextResponse.json({ code: generatedCode });
    } catch (error: any) {
        console.error('ForgeCAD Generate API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
