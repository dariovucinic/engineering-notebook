/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

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
        // Gemini API expects alternating user/model turns or starting with user.
        // System instructions are best handled by prepending to the first user message or using the systemInstruction field (beta).
        // Here we map our roles to Gemini roles and merge system context.

        let history: any[] = [];
        let systemContent = '';

        for (const m of messages) {
            if (m.role === 'system') {
                systemContent += m.content + '\n\n';
            } else {
                const role = m.role === 'assistant' ? 'model' : 'user';
                // If it's the first user message, prepend system context
                let text = m.content;
                if (role === 'user' && systemContent) {
                    text = systemContent + text;
                    systemContent = ''; // Clear it so we don't add it again
                }
                history.push({
                    role: role,
                    parts: [{ text }]
                });
            }
        }

        // If system content is still there (e.g. no user message yet?), force a user message
        if (systemContent && history.length === 0) {
            history.push({ role: 'user', parts: [{ text: systemContent }] });
        }

        // Call Gemini API directly 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        console.log('Calling Gemini API:', url.replace(apiKey, '***'));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: history
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);

            // Parse rate-limit errors to give a friendly message
            if (response.status === 429) {
                let retrySeconds = 60;
                try {
                    const errJson = JSON.parse(errorText);
                    const retryInfo = errJson?.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
                    if (retryInfo?.retryDelay) {
                        retrySeconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10) || 60;
                    }
                } catch { }
                return NextResponse.json({
                    error: `Rate limit reached — please wait ${retrySeconds} seconds before trying again. (Free tier: 20 requests/day on gemini-2.5-flash)`
                }, { status: 429 });
            }

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
