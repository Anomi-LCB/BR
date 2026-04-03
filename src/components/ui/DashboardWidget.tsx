"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "./glass-panel";
import { Flame, Trophy, Calendar, BookOpen, ChevronRight, Activity } from "lucide-react";
import { useBibleStore } from "@/store/useBibleStore";

interface DashboardWidgetProps {
    streak: number;
    progress: number;
    nextReading: string;
    onTabChange: (tab: any) => void;
}

export default function DashboardWidget({ streak, progress, nextReading, onTabChange }: DashboardWidgetProps) {
    const activityLog = useBibleStore(state => state.activityLog);
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = activityLog[today] || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            <GlassPanel intensity="low" className="p-4 border-primary/20 bg-primary/5 relative overflow-hidden group">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-110 duration-1000" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                <div className="relative z-10 flex items-center justify-between">
                    {/* Left: Quick Stats */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">연속 읽기</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Flame size={18} className="text-orange-500 fill-orange-500/20" />
                                    <span className="text-xl font-display font-black">{streak}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground mt-1">일째</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">오늘 활동</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Activity size={18} className={cn(
                                        "transition-colors",
                                        todayActivity === 3 ? "text-primary" : 
                                        todayActivity === 2 ? "text-emerald-500" :
                                        todayActivity === 1 ? "text-blue-500" : "text-muted-foreground"
                                    )} />
                                    <span className="text-xl font-display font-black">
                                        {todayActivity === 3 ? "PERFECT" : todayActivity === 2 ? "GOOD" : todayActivity === 1 ? "ACTIVE" : "START"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                            <BookOpen size={14} className="text-primary" />
                            <span>다음: {nextReading}</span>
                        </div>
                    </div>

                    {/* Right: Circle Progress */}
                    <div className="relative w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" onClick={() => onTabChange("bible")}>
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-muted/20"
                            />
                            <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={176}
                                initial={{ strokeDashoffset: 176 }}
                                animate={{ strokeDashoffset: 176 - (176 * progress) / 100 }}
                                className="text-primary transition-all duration-1000"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-black leading-none">{progress}%</span>
                        </div>
                    </div>
                </div>

                {/* Bottom interactive link */}
                <button 
                   onClick={() => onTabChange("streak")}
                   className="mt-4 w-full py-1.5 px-3 rounded-full bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 border border-white/20 dark:border-white/5 flex items-center justify-between text-[10px] font-bold tracking-tight transition-all"
                >
                    <span className="flex items-center gap-1.5">
                        <Trophy size={12} className="text-amber-500" />
                        상세 통계 및 히트맵 확인하기
                    </span>
                    <ChevronRight size={12} className="text-muted-foreground" />
                </button>
            </GlassPanel>
        </motion.div>
    );
}
