"use client";

import { useState } from "react";
import { Flame, Trophy, Share2 } from "lucide-react";
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";
import DashboardGrid, { GridCell } from "../layout/DashboardGrid";
import { SmartCard } from "../ui/smart-card";
import DateNavigator from "../DateNavigator";
import BibleCard from "../BibleCard";
import { EncouragementBanner } from "../EncouragementBanner";
import { BibleReadingPlan } from "@/types/bible";

const YoutubePlayer = dynamic(() => import("../YoutubePlayer"), {
    loading: () => <div className="h-48 w-full bg-muted/20 animate-pulse rounded-3xl" />,
    ssr: false
});

interface HomeTabProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    onShare: () => void;
    onTextClick?: () => void;
    targetPlan: BibleReadingPlan | null;
    isCompleted: boolean;
    onTogglePlan: (id: number) => void;
    videoDuration: number | null;
    fontSize: 'small' | 'medium' | 'large';
    streak: number;
    progressPercent: number;
    daysLeft: number;
    autoPlay: boolean;
    showEncouragement: boolean;
    onTabChange: (tab: any) => void;
    streakDisplayMode?: 'day' | 'progress';
}

export default function HomeTab({
    selectedDate,
    onDateChange,
    onShare,
    onTextClick,
    targetPlan,
    isCompleted,
    onTogglePlan,
    videoDuration,
    fontSize,
    streak,
    progressPercent,
    daysLeft,
    autoPlay,
    showEncouragement,
    onTabChange,
    streakDisplayMode = 'day'
}: HomeTabProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative min-h-[85vh] animate-in fade-in duration-500 overflow-visible">
            {/* Aurora Background */}
            <div className={cn(
                "fixed inset-0 pointer-events-none transition-opacity duration-1000 z-0",
                isFocused ? "opacity-100" : "opacity-30"
            )}>
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 max-w-[500px] max-h-[500px] blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-all duration-&lsqb;3s&rsqb; animate-pulse" />
                <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-400/20 max-w-[400px] max-h-[400px] blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-all duration-&lsqb;4s&rsqb; animate-pulse delay-75" />
                <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-purple-400/20 max-w-[600px] max-h-[600px] blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-all duration-&lsqb;5s&rsqb; animate-pulse delay-150" />
            </div>

            <div className={cn(
                "relative z-10 transition-all duration-700 ease-&lsqb;cubic-bezier(0.23,1,0.32,1)&rsqb;",
                isFocused ? "-translate-y-2 lg:-translate-y-6" : ""
            )}>
                {/* Absolute Backdrop for Focus Mode to hide GridCell content behind BibleCard */}
                {isFocused && (
                    <div
                        className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 transition-opacity duration-700 opacity-100"
                        onClick={() => setIsFocused(false)}
                    />
                )}

                <DashboardGrid>

                    {/* Date Navigation */}
                    <GridCell span="3" className={cn("transition-all duration-500", isFocused ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-2")}>
                        <DateNavigator
                            currentDate={selectedDate}
                            onDateChange={onDateChange}
                        />
                    </GridCell>

                    <GridCell span="3" className="relative z-50">
                        {targetPlan ? (
                            <BibleCard
                                plan={targetPlan}
                                isCompleted={isCompleted}
                                onToggle={() => onTogglePlan(targetPlan.id)}
                                onTextClick={onTextClick}
                                videoDuration={videoDuration}
                                fontSize={fontSize}
                                streakDisplayMode={streakDisplayMode}
                                isFocused={isFocused}
                                onFocusToggle={() => setIsFocused(!isFocused)}
                            />
                        ) : (
                            <SmartCard variant="outline" className="p-12 text-center text-muted-foreground shadow-sm">
                                오늘의 읽기 일정이 없습니다.
                            </SmartCard>
                        )}
                    </GridCell>

                    {/* Audio Bible */}
                    <GridCell span="3" className={cn("space-y-4 transition-all duration-700", isFocused ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shadow-lg">
                                <Flame className="w-3 h-3 text-white fill-current" />
                            </div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">오늘의 말씀 영상</h3>
                        </div>
                        <YoutubePlayer selectedDate={selectedDate} autoPlay={autoPlay} />
                    </GridCell>

                    {/* Stats Slider */}
                    <GridCell span="3" className={cn("overflow-hidden transition-all duration-700", isFocused ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
                        <div
                            className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar"
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                        >
                            {/* Streak Card */}
                            <div className="min-w-[30%] flex-1 snap-start" onClick={() => onTabChange("streak")}>
                                <SmartCard
                                    variant="elevated"
                                    className="h-full flex flex-col justify-between cursor-pointer hover:border-orange-500/30 transition-colors group p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-orange-500 transition-colors">연속 읽기</span>
                                        <Flame size={14} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <span className="text-xl font-display font-medium">{streak}</span>
                                        <span className="text-[10px] text-muted-foreground ml-1">
                                            {streakDisplayMode === 'progress' ? '/ 365일' : '일차'}
                                        </span>
                                    </div>
                                </SmartCard>
                            </div>

                            {/* Progress Card */}
                            <div className="min-w-[30%] flex-1 snap-start" onClick={() => onTabChange("record")}>
                                <SmartCard
                                    variant="elevated"
                                    className="h-full flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors group p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">진행률</span>
                                        <Trophy size={14} className="text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-xl font-display font-medium">{progressPercent}%</span>
                                        <span className="text-[10px] text-muted-foreground ml-1">완료</span>
                                    </div>
                                </SmartCard>
                            </div>

                            {/* Remaining Days Card */}
                            <div className="min-w-[30%] flex-1 snap-start" onClick={() => onTabChange("record")}>
                                <SmartCard
                                    variant="elevated"
                                    className="h-full flex flex-col justify-between cursor-pointer hover:border-primary/30 transition-colors group p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">남은 기간</span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-display font-medium">{daysLeft}</span>
                                        <span className="text-[10px] text-muted-foreground ml-1">일</span>
                                    </div>
                                </SmartCard>
                            </div>
                        </div>
                    </GridCell>

                    {/* Encouragement */}
                    {showEncouragement && (
                        <GridCell span="3" className={cn("transition-all duration-700", isFocused ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
                            <EncouragementBanner
                                streak={streak}
                                progressPercent={progressPercent}
                                dayOfYear={targetPlan?.day_of_year || 1}
                            />
                        </GridCell>
                    )}
                </DashboardGrid>
            </div>
        </div>
    );
}
