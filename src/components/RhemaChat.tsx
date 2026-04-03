"use client";

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import { Send, User as UserIcon, Sparkles, Loader2, X, Mic, MicOff } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createClient } from '@/lib/supabase-client';
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { LiturgyCard } from './LiturgyCard';

interface RhemaChatProps {
    onClose: () => void;
}

export default function RhemaChat({ onClose }: RhemaChatProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [generatedLiturgy, setGeneratedLiturgy] = useState<string | null>(null);

    // Get User ID for RAG context
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: { userId },
        onFinish: (message: any) => {
            // Simple heuristic to detect if AI generated a liturgy
            if (message.content.includes("기도문")) {
                const parts = message.content.split("기도문");
                if (parts.length > 1) {
                    setGeneratedLiturgy(parts[1].trim());
                }
            }
        }
    } as any) as any;

    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechToText({
        onResult: (text) => setInput(text)
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, generatedLiturgy]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-inner">
                        <Sparkles className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
                            Rhema AI
                        </h3>
                        <p className="text-xs text-muted-foreground">당신의 영적 동반자</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                    <X size={20} />
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                {messages.length === 0 && !generatedLiturgy && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                        <Sparkles className="w-12 h-12 text-muted-foreground/50" />
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                오늘 묵상한 내용이나 <br />
                                기도가 필요한 제목을 나누어보세요.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                            {["오늘 말씀이 이해가 안돼", "기도 부탁해", "불안한 마음이 들어"].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                                    className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m: any) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md'
                                }`}>
                                {m.role === 'user' ? <UserIcon size={14} /> : <Sparkles size={14} />}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-card border border-border/50 text-card-foreground rounded-tl-sm backdrop-blur-sm'
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Sparkles size={14} className="text-white animate-pulse" />
                            </div>
                            <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Generated Liturgy Card (if valid) */}
                <AnimatePresence>
                    {generatedLiturgy && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-4 px-2"
                        >
                            <LiturgyCard
                                date={new Date().toLocaleDateString('ko-KR')}
                                content={generatedLiturgy}
                                theme="dusk"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                <div className="relative flex items-center gap-2">
                    {isSupported && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleMicClick}
                            className={`shrink-0 transition-colors ${isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </Button>
                    )}
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={isListening ? "말씀해 세요..." : "메시지를 입력하세요..."}
                        className="flex-1 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-full pl-4 pr-12 text-sm h-11 backdrop-blur-sm"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-1 top-1 h-9 w-9 rounded-full transition-all ${input.trim()
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/20'
                            }`}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
