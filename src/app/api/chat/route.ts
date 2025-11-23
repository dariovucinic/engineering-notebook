import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Build prompt from chat history
        const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
        const systemContext = messages.find((m: any) => m.role === 'system');
        const prompt = systemContext
            ? `${systemContext.content}\n\nUser: ${lastUserMessage?.content}`
            : lastUserMessage?.content || '';

        // Call Gemini API directly (v1beta endpoint, gemini-2.0-flash model)
        // We found that gemini-2.0-flash is available for this key
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        console.log('Calling Gemini API:', url.replace(apiKey, '***'));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return NextResponse.json({ error: `Gemini API error ${response.status}: ${errorText}` }, { status: 500 });
        }

        const data = await response.json();
        const assistantMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return NextResponse.json({ response: assistantMessage });
    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
