'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 */

import React, { useState } from 'react';
import { useNotebook } from '@/hooks/useNotebook';
import { useComputation } from '@/contexts/ComputationContext';
import ReactMarkdown from 'react-markdown';

// Copy button used inside code blocks
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all border border-white/10"
        >
            {copied ? '✓ Copied' : 'Copy'}
        </button>
    );
}

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

            const data = await response.json();

            if (!response.ok || data.error) {
                const errMsg = data?.error || `Error ${response.status}`;
                setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
                return;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
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
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-950" />
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_0deg,transparent_0_300deg,cyan_360deg)] animate-[spin_4s_linear_infinite] opacity-40 blur-xl" />
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_90deg,transparent_0_300deg,purple_360deg)] animate-[spin_3s_linear_infinite_reverse] opacity-40 blur-xl" />
                        <div className="absolute -inset-[50%] bg-[conic-gradient(from_180deg,transparent_0_300deg,blue_360deg)] animate-[spin_5s_linear_infinite] opacity-40 blur-xl" />
                        <div className="absolute inset-1 bg-black/40 rounded-full backdrop-blur-[1px] flex items-center justify-center overflow-hidden">
                            <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(200,200,255,0.1),transparent_60%)]" />
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_25%)]" />
                        <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] rounded-full" />
                    </div>
                </button>
            )}

            {/* Chat Panel — dark glass style */}
            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 w-96 h-[520px] rounded-2xl shadow-2xl flex flex-col z-50 border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                >
                    {/* Header */}
                    <div
                        className="p-4 border-b border-white/10 flex items-center justify-between"
                        style={{ background: 'rgba(30, 41, 59, 0.6)' }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">✨</span>
                            <div>
                                <h3 className="font-semibold text-white">AI Assistant</h3>
                                <p className="text-xs text-blue-300/70">Powered by Gemini</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-white/40 text-sm mt-20">
                                <p className="text-3xl mb-2">✨</p>
                                <p>Ask me anything about your calculations!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`rounded-2xl px-4 py-2 text-sm border ${msg.role === 'user'
                                        ? 'max-w-[80%] bg-blue-600/80 text-white border-blue-500/30'
                                        : 'w-full text-white/90 border-white/10'
                                        }`}
                                    style={msg.role === 'assistant' ? { background: 'rgba(30, 41, 59, 0.7)' } : {}}
                                >
                                    <div className="prose prose-sm max-w-none prose-invert prose-p:my-1">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }: any) => <p className="mb-1 last:mb-0" {...props} />,
                                                a: ({ node, ...props }: any) => <a className="underline hover:text-blue-300" {...props} />,
                                                code: ({ node, inline, children, ...props }: any) =>
                                                    inline
                                                        ? <code className="bg-white/10 rounded px-1 py-0.5 text-xs" {...props}>{children}</code>
                                                        : <code {...props}>{children}</code>,
                                                pre: ({ node, children, ...props }: any) => {
                                                    const code = (children as any)?.props?.children ?? '';
                                                    const text = typeof code === 'string' ? code : Array.isArray(code) ? code.join('') : '';
                                                    return (
                                                        <div className="relative group/pre my-2">
                                                            <pre className="bg-black/50 text-white p-3 pr-16 rounded-lg overflow-x-auto text-xs font-mono border border-white/10" {...props}>
                                                                {children}
                                                            </pre>
                                                            <CopyButton text={text} />
                                                        </div>
                                                    );
                                                },
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
                                <div
                                    className="rounded-2xl px-4 py-2 flex gap-1 border border-white/10"
                                    style={{ background: 'rgba(30, 41, 59, 0.7)' }}
                                >
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="p-3 border-t border-white/10"
                        style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 px-4 py-2 rounded-full outline-none text-sm text-white placeholder:text-white/30 border border-white/10 focus:border-blue-500/60 transition-all"
                                style={{ background: 'rgba(30, 41, 59, 0.6)' }}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500/30"
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
