"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Scroll, X, Share2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { SmartCard } from "./ui/smart-card";
import { LiturgyCard } from "./LiturgyCard";
import { useChat } from '@ai-sdk/react';
import { createClient } from '@/lib/supabase-client';

interface RhemaInsightProps {
    onClose: () => void;
}

export default function RhemaInsight({ onClose }: RhemaInsightProps) {
    const [step, setStep] = useState<'intro' | 'generating' | 'result'>('intro');
    const [insight, setInsight] = useState<{
        theme: string;
        context: string;
        prayer: string;
    } | null>(null);

    // AI Integration
    const { append, messages, isLoading } = useChat({
        api: '/api/chat',
        onFinish: (message: any) => {
            try {
                // Parse the structured response
                const content = message.content;
                const themeMatch = content.match(/THEME:\s*(.*?)(\n|$)/);
                const contextMatch = content.match(/CONTEXT:\s*([\s\S]*?)(\n|$)/); // Replaced s flag with [\s\S]
                const prayerMatch = content.match(/PRAYER:\s*([\s\S]*)/);      // Replaced s flag

                // Fallback parsing if structure fails
                setInsight({
                    theme: themeMatch ? themeMatch[1] : "오늘의 은혜",
                    context: contextMatch ? contextMatch[1].split('PRAYER:')[0].trim() : content.slice(0, 100) + "...",
                    prayer: prayerMatch ? prayerMatch[1].trim() : "주님, 오늘 말씀 안에 머물게 하소서."
                });
                setStep('result');
            } catch (e) {
                console.error("Parsing failed", e);
                setStep('result'); // Show raw content as fallback if needed
            }
        }
    } as any) as any;

    const handleGenerate = () => {
        setStep('generating');
        // Trigger AI with a specific prompt for the day's reading
        // Imagine we pass the current reading plan here. For now, we simulate "Today's Word".
        append({
            role: 'user',
            content: "Generate a spiritual insight for today's Bible reading. Format strictly as:\nTHEME: [One short phrase]\nCONTEXT: [2-3 sentences historical background]\nPRAYER: [A short, personal liturgy]"
        });
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
            {/* Background Ambient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                        <Sparkles className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-xl text-foreground">
                            Rhema Insight
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">오늘의 말씀 깊이 보기</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                    <X size={20} />
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center space-y-8 max-w-sm"
                        >
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                    말씀의 깊이를 더하세요
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    오늘 읽은 말씀의 역사적 배경과 <br />
                                    핵심 주제, 그리고 당신을 위한 기도를 <br />
                                    AI가 묵상하여 드립니다.
                                </p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                size="lg"
                                className="w-full rounded-2xl h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Sparkles className="mr-2 w-5 h-5 animate-pulse" />
                                인사이트 열기
                            </Button>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-muted/30 border-t-indigo-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <BookOpen className="text-indigo-500 w-8 h-8 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                                말씀을 묵상하고 있습니다...
                            </p>
                        </motion.div>
                    )}

                    {step === 'result' && insight && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto space-y-4 pb-4 no-scrollbar">
                                {/* Theme Card */}
                                <SmartCard variant="elevated" className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <BookOpen size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Core Theme</span>
                                        </div>
                                        <p className="text-lg font-bold text-foreground leading-relaxed">
                                            "{insight.theme}"
                                        </p>
                                    </div>
                                </SmartCard>

                                {/* Context Card */}
                                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Scroll size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Context</span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {insight.context}
                                    </p>
                                </div>

                                {/* Prayer Card (Liturgy) */}
                                <LiturgyCard
                                    date={new Date().toLocaleDateString('ko-KR')}
                                    content={insight.prayer}
                                    theme="dawn" // or dynamic based on time
                                />
                            </div>

                            <div className="pt-4 mt-auto">
                                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold" onClick={onClose}>
                                    아멘, 감사합니다.
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
