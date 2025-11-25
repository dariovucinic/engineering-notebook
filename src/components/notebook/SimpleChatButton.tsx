'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


import React, { useState } from 'react';
import { useNotebook } from '@/hooks/useNotebook';
import { useComputation } from '@/contexts/ComputationContext';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SimpleChatButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { blocks } = useNotebook();
    const { scope } = useComputation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare context
            const context = {
                blocks: blocks.map(b => ({
                    type: b.type,
                    content: 'content' in b ? String(b.content).substring(0, 200) : '',
                    variableName: 'variableName' in b ? b.variableName : undefined
                })),
                variables: Object.fromEntries(
                    Object.entries(scope.current).map(([k, v]) => [k, String(v).substring(0, 50)])
                )
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...messages,
                        userMessage,
                        {
                            role: 'system',
                            content: `Context: ${JSON.stringify(context)}`
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
            }

            // Parse JSON response
            const data = await response.json();
            const assistantMessage = data.response;
            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all z-50 group"
                    title="AI Assistant"
                >
                    <div className="absolute inset-0 bg-black rounded-full border border-white/10 overflow-hidden shadow-[0_0_20px_rgba(120,100,255,0.3)]">
                        {/* Orb Background / Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-950" />

                        {/* Moving Waves (Simulated with rotating gradients) */}
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_0deg,transparent_0_300deg,cyan_360deg)] animate-[spin_4s_linear_infinite] opacity-40 blur-xl" />
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_90deg,transparent_0_300deg,purple_360deg)] animate-[spin_3s_linear_infinite_reverse] opacity-40 blur-xl" />
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_180deg,transparent_0_300deg,blue_360deg)] animate-[spin_5s_linear_infinite] opacity-40 blur-xl" />

                        {/* Inner Core */}
                        <div className="absolute inset-1 bg-black/40 rounded-full backdrop-blur-[1px] flex items-center justify-center overflow-hidden">
                            {/* Central Light */}
                            <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(200,200,255,0.1),transparent_60%)]" />
                        </div>

                        {/* Glass Reflection */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_25%)]" />
                        <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] rounded-full" />
                    </div>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">✨</span>
                            <div>
                                <h3 className="font-semibold text-slate-800">AI Assistant</h3>
                                <p className="text-xs text-slate-500">Powered by Gemini</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 text-sm mt-20">
                                <p className="text-3xl mb-2">👋</p>
                                <p>Ask me anything about your calculations!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-800'
                                        }`}
                                >
                                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-slate-800 prose-pre:text-white prose-pre:p-2 prose-pre:rounded-lg">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }: any) => <p className="mb-1 last:mb-0" {...props} />,
                                                a: ({ node, ...props }: any) => <a className="underline hover:text-indigo-500" {...props} />,
                                                code: ({ node, ...props }: any) => <code className="bg-black/10 rounded px-1 py-0.5" {...props} />,
                                                pre: ({ node, ...props }: any) => <pre className="bg-slate-800 text-white p-2 rounded-lg overflow-x-auto my-2" {...props} />,
                                                ul: ({ node, ...props }: any) => <ul className="list-disc list-inside my-1" {...props} />,
                                                ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside my-1" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 rounded-2xl px-4 py-2 flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-full outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default SimpleChatButton;
