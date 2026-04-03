"use client";

import React from "react";
import { SmartCard } from "./ui/smart-card";
import { BookOpen, Flame, ChevronRight, Play } from "lucide-react";
import { BibleReadingPlan } from "@/types/bible";
import { cn } from "@/lib/utils";

interface WidgetPreviewProps {
    plan: BibleReadingPlan | null;
    progress: number;
    streak: number;
    type: 'ios' | 'android';
    size: 'small' | 'medium';
}

export default function WidgetPreview({ plan, progress, streak, type, size }: WidgetPreviewProps) {
    const isIOS = type === 'ios';

    // iOS Small Widget (2x2)
    if (size === 'small') {
        return (
            <div className={cn(
                "relative w-[155px] h-[155px] rounded-[28px] overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105",
                isIOS ? "bg-white dark:bg-[#1c1c1e]" : "bg-[#f8f9fa] dark:bg-[#202124] rounded-[24px]"
            )}>
                <div className="p-4 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen size={16} className="text-primary" />
                        </div>
                        <div className="flex items-center gap-0.5">
                            <Flame size={12} className="text-orange-500 fill-orange-500" />
                            <span className="text-[10px] font-black">{streak}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Today's Reading</p>
                        <h4 className="text-xs font-black leading-tight line-clamp-2">{plan?.title || "?ㅻ뒛??留먯?"}</h4>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-primary">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Medium Widget (4x2 / 4x1)
    return (
        <div className={cn(
            "relative w-[320px] h-[155px] rounded-[28px] overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105",
            isIOS ? "bg-white dark:bg-[#1c1c1e]" : "bg-[#f8f9fa] dark:bg-[#202124] rounded-[24px]"
        )}>
            <div className="flex h-full">
                {/* Left Side: Progress & Streak */}
                <div className="w-1/3 p-4 flex flex-col justify-between border-r border-border/10 bg-muted/5">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Progress</p>
                        <p className="text-2xl font-serif font-black text-primary">{progress}%</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Streak</p>
                        <div className="flex items-center gap-1">
                            <Flame size={14} className="text-orange-500 fill-orange-500" />
                            <span className="text-lg font-black">{streak}??/span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Plan Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Coming Up Next</p>
                            <h4 className="text-sm font-black leading-tight">{plan?.title || "?깃꼍 ?쎄린 ?쒖옉"}</h4>
                            <p className="text-[10px] text-muted-foreground font-medium">{plan?.verses[0] || "李쎌꽭湲?1??}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <Play size={14} fill="white" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                </div>
            </div>
        </div>
    );
}
