"use client";

import { useMemo } from "react";
import { ArrowLeft, Leaf, Crown, BookOpen, Star, Sparkles } from "lucide-react";
import { BibleReadingPlan } from "@/types/bible";
import { getOfficialCategory } from "@/lib/bible-utils";
import { calculateStreak } from "@/lib/stats";

interface StatsTabProps {
    completedPlanIds: number[];
    allPlans: BibleReadingPlan[];
    onBack: () => void;
}

export default function StatsTab({ completedPlanIds, allPlans, onBack }: StatsTabProps) {
    const stats = useMemo(() => {
        const completedDates = allPlans
            .filter(p => completedPlanIds.includes(p.id))
            .map(p => p.date)
            .filter((d): d is string => !!d);

        const streak = calculateStreak(completedDates);

        // Calculate most read category
        const categoryCounts: Record<string, number> = {};
        allPlans
            .filter(p => completedPlanIds.includes(p.id))
            .forEach(p => {
                const cat = p.category || getOfficialCategory(p.verses);
                if (cat) {
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                }
            });

        let mostReadCat = "아직 읽은 말씀이 없습니다";
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > maxCount) {
                mostReadCat = cat;
                maxCount = count;
            }
        });

        // Determine Level
        const readCnt = completedPlanIds.length;
        let stage = 0; // Seed
        let stageName = "말씀의 씨앗";
        let nextGoal = 10;

        if (readCnt >= 300) { stage = 4; stageName = "생명 나무"; nextGoal = 365; }
        else if (readCnt >= 100) { stage = 3; stageName = "푸른 나무"; nextGoal = 300; }
        else if (readCnt >= 30) { stage = 2; stageName = "작은 묘목"; nextGoal = 100; }
        else if (readCnt >= 10) { stage = 1; stageName = "새싹"; nextGoal = 30; }

        const progressToNext = Math.min(100, Math.round((readCnt / nextGoal) * 100));

        return { streak, mostReadCat, readCnt, stage, stageName, nextGoal, progressToNext };
    }, [completedPlanIds, allPlans]);

    return (
        <div className="h-full flex flex-col bg-background/50 relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-border/50">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs tracking-wide">
                    {stats.stageName}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {/* Hero Tree Visual */}
                <div className="relative w-full h-[320px] bg-gradient-to-b from-blue-50/50 to-emerald-50/50 dark:from-blue-950/20 dark:to-emerald-950/20 overflow-hidden border-b border-border/50 shadow-sm flex flex-col justify-end pb-4 pt-10">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-3xl blend-screen" />
                    <div className="absolute top-20 right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl blend-screen" />

                    <h2 className="absolute top-8 left-0 right-0 text-center text-3xl font-serif font-black tracking-tight text-foreground/80 z-20">
                        영적 여정
                    </h2>

                    <div className="relative w-full h-[200px] z-10">
                        <SpiritualTree stage={stats.stage} />
                    </div>
                </div>

                {/* Progress Bar (Next Level) */}
                <div className="px-6 -mt-6 relative z-20">
                    <div className="bg-card p-5 rounded-3xl shadow-lg border border-border/60">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="text-sm font-bold text-foreground">성장 지표</h4>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                {stats.readCnt} / {stats.nextGoal} 일
                            </span>
                        </div>
                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${stats.progressToNext}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center text-balance font-medium">
                            말씀을 매일 읽을수록 당신의 영적 나무는 더욱 크고 아름답게 자라납니다.
                        </p>
                    </div>
                </div>

                {/* 영성의 발자취 (Insight Timeline) */}
                <div className="px-5 mt-10">
                    <h3 className="text-lg font-bold font-serif mb-5 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500 ml-1" />
                        인사이트 타임라인
                    </h3>
                    <div className="space-y-3">
                        <InsightCard
                            icon={<BookOpen className="w-5 h-5 text-blue-500" />}
                            title="가장 많이 읽은 주제/성경"
                            value={stats.mostReadCat}
                            desc="당신의 마음이 머문 곳"
                        />
                        <InsightCard
                            icon={<Crown className="w-5 h-5 text-amber-500" />}
                            title="누적 말씀 묵상"
                            value={`${stats.readCnt} 일`}
                            desc={`1독(365일)까지 ${Math.max(0, 365 - stats.readCnt)}일 남음`}
                        />
                        <InsightCard
                            icon={<Star className="w-5 h-5 text-purple-500" />}
                            title="현재 연속 묵상일"
                            value={`${stats.streak} 일`}
                            desc="꾸준함이 만드는 기적"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InsightCard({ icon, title, value, desc }: any) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border/60 shadow-sm transition-all hover:bg-secondary/50">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center shrink-0 border border-border/80 shadow-inner">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{title}</p>
                <p className="font-black text-foreground text-lg tracking-tight truncate">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{desc}</p>
            </div>
        </div>
    );
}

function SpiritualTree({ stage }: { stage: number }) {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 20 180 Q 100 170 180 180" stroke="#a3e635" strokeWidth="3" fill="none" opacity="0.4" strokeDasharray="5, 5" />
            {stage === 0 && (
                <circle cx="100" cy="175" r="5" fill="#84cc16" className="animate-pulse shadow-xl" />
            )}
            {stage >= 1 && (
                <>
                    <path d="M 100 180 Q 95 160 100 150" stroke="#65a30d" strokeWidth="6" fill="none" />
                    <path d="M 100 165 C 80 160 85 145 100 150 C 115 145 120 160 100 165" fill="#a3e635" />
                </>
            )}
            {stage >= 2 && (
                <>
                    <path d="M 100 180 Q 90 120 100 90" stroke="#4d7c0f" strokeWidth="8" fill="none" />
                    <path d="M 98 130 Q 70 110 80 90" stroke="#4d7c0f" strokeWidth="5" fill="none" />
                    <path d="M 102 140 Q 130 120 120 100" stroke="#4d7c0f" strokeWidth="5" fill="none" />
                    <circle cx="80" cy="90" r="18" fill="#65a30d" opacity="0.95" />
                    <circle cx="120" cy="100" r="16" fill="#65a30d" opacity="0.95" />
                    <circle cx="100" cy="80" r="24" fill="#a3e635" opacity="1" />
                </>
            )}
            {stage >= 3 && (
                <>
                    <path d="M 95 180 Q 80 80 100 50" stroke="#3f6212" strokeWidth="16" fill="none" />
                    <path d="M 92 120 Q 50 90 60 60" stroke="#3f6212" strokeWidth="8" fill="none" />
                    <path d="M 105 130 Q 150 100 140 70" stroke="#3f6212" strokeWidth="8" fill="none" />
                    <circle cx="60" cy="60" r="30" fill="#4d7c0f" opacity="0.9" />
                    <circle cx="140" cy="70" r="28" fill="#4d7c0f" opacity="0.9" />
                    <circle cx="95" cy="45" r="42" fill="#65a30d" opacity="0.95" />
                    <circle cx="80" cy="30" r="24" fill="#a3e635" opacity="0.8" />
                    <circle cx="120" cy="40" r="30" fill="#84cc16" opacity="0.85" />
                    <circle cx="100" cy="40" r="60" fill="#d9f99d" opacity="0.1" className="animate-pulse" />
                </>
            )}
            {stage >= 4 && (
                <>
                    <circle cx="70" cy="50" r="5" fill="#f43f5e" />
                    <circle cx="130" cy="60" r="6" fill="#f43f5e" />
                    <circle cx="100" cy="25" r="5" fill="#f43f5e" />
                    <circle cx="110" cy="80" r="6" fill="#f43f5e" />
                    <circle cx="55" cy="80" r="5" fill="#f43f5e" />
                    <circle cx="100" cy="50" r="80" fill="#fef08a" opacity="0.15" />
                </>
            )}
        </svg>
    );
}
