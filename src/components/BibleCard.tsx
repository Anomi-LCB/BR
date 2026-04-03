"use client";

import { BibleReadingPlan } from "@/types/bible";
import { Check, BookOpen, Share2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { generateKeywords, generateStructuredKeywords } from "@/lib/bible-utils";
import AmenParticles from "./effects/AmenParticles";

interface BibleCardProps {
    plan: BibleReadingPlan;
    isCompleted: boolean;
    onToggle: (id: number) => void;
    onRead?: (plan: BibleReadingPlan) => void;
    onTextClick?: () => void;
    videoDuration?: number | null;
    fontSize?: 'small' | 'medium' | 'large';
    streakDisplayMode?: 'day' | 'progress';
    isFocused?: boolean;
    onFocusToggle?: () => void;
}

const FONT_SIZES = {
    small: { title: 'text-2xl', body: 'text-xs', keyword: 'text-[10px]' },
    medium: { title: 'text-3xl', body: 'text-sm', keyword: 'text-xs' },
    large: { title: 'text-4xl', body: 'text-base', keyword: 'text-sm' },
};

export default function BibleCard({ plan, isCompleted, onToggle, onRead, onTextClick, videoDuration, fontSize = 'medium', streakDisplayMode, isFocused, onFocusToggle }: BibleCardProps) {
    const fs = FONT_SIZES[fontSize];
    const [loading, setLoading] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    const handleToggle = async () => {
        if (!isCompleted) {
            setLoading(true);
            // Simulate "Amen" delay for effect
            setTimeout(async () => {
                onToggle(plan.id);
                setLoading(false);
                setShowParticles(true);
                setTimeout(() => setShowParticles(false), 2000);
            }, 600);
        } else {
            onToggle(plan.id);
        }
    };

    return (
        <div className="relative group perspective-1000 cursor-pointer" onClick={() => onRead?.(plan)}>
            {/* Card Container - The Page */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-[2rem] bg-card transition-all duration-700 p-8",
                    "border border-border/40 shadow-soft",
                    isCompleted ? "shadow-gold ring-1 ring-accent/10" : ""
                )}
            >
                {/* Decorative Binding Element */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-30" />

                <div className="flex flex-col items-center text-center gap-6 relative z-10">

                    {/* Header Badge */}
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors duration-500",
                        isCompleted
                            ? "bg-accent/10 border-accent/20 text-accent-foreground"
                            : "bg-secondary border-border text-muted-foreground"
                    )}>
                        <BookOpen size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">
                            {plan.day_of_year}일차
                        </span>
                    </div>

                    {/* Main Title - Serif & Sacred */}
                    <div className="space-y-4 py-3">
                        <h2 className={cn(
                            `font-serif ${fs.title} font-medium tracking-tight leading-tight transition-all duration-700`,
                            isCompleted ? "text-accent" : "text-foreground"
                        )}>
                            {plan.title}
                        </h2>

                        {/* Info Rows */}
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-bold text-primary dark:text-primary/90 tracking-wide px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20">
                                {plan.category || "성경 본문"}
                            </span>
                            <span className={`${fs.body} font-medium text-foreground/80 font-sans`}>
                                오늘의 읽기 • 약 {videoDuration ? videoDuration : (plan.reading_time?.replace('mins', '') || "15")}분 소요
                            </span>
                        </div>
                    </div>

                    {/* Daily Keywords */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {useMemo(() => generateStructuredKeywords(plan.verses), [plan.verses]).map((keyword, i) => (
                            <span
                                key={i}
                                className={cn(
                                    `px-3 py-1 rounded-full ${fs.keyword} font-semibold transition-colors border shadow-sm`,
                                    keyword.isPsalm
                                        ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300" // Psalms Style
                                        : "bg-orange-50/80 border-orange-100 text-orange-700 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-300" // Default Style
                                )}
                            >
                                {keyword.text}
                            </span>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-12 h-[1px] bg-border/60" />

                    <AmenParticles trigger={showParticles} />

                    {/* Actions Group */}
                    <div className="flex flex-col items-center gap-3 w-full mt-4">
                        {/* Main Action Button - The "Seal" */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle();
                            }}
                            disabled={loading}
                            className={cn(
                                "group/btn relative flex items-center justify-center gap-2 px-12 py-3 rounded-full font-bold text-sm transition-all duration-500 active:scale-95 disabled:opacity-70 w-full max-w-[200px]",
                                isCompleted
                                    ? "bg-accent text-white shadow-lg shadow-accent/30"
                                    : "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                            )}
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : isCompleted ? (
                                <>
                                    <Check size={16} strokeWidth={3} />
                                    <span className="mr-1">아멘</span>
                                </>
                            ) : (
                                <span>읽음 표시</span>
                            )}
                        </button>

                        {/* Share Button (Parity Upgrade) */}
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const shareData = {
                                    title: '성경 365 - 오늘의 말씀',
                                    text: `📗 오늘 읽은 말씀: ${plan.title}\n"${plan.verses.join(', ')}"\n\n함께 성경 일독해요!`,
                                    url: window.location.href,
                                };

                                try {
                                    if (navigator.share) {
                                        await navigator.share(shareData);
                                    } else {
                                        // Fallback: Copy to clipboard
                                        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                                        alert('클립보드에 복사되었습니다.');
                                    }
                                } catch (err) {
                                    console.error('Share failed', err);
                                }
                            }}
                            className="flex items-center gap-2 px-6 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted/50"
                        >
                            <Share2 size={14} />
                            <span>말씀 나누기</span>
                        </button>
                    </div>

                    {/* Completion Message */}
                    <p className={cn(
                        "text-[10px] font-medium text-accent uppercase tracking-widest transition-all duration-500 overflow-hidden",
                        isCompleted ? "h-auto opacity-100 mt-1" : "h-0 opacity-0"
                    )}>
                        말씀을 묵상했습니다
                    </p>
                </div>
            </div>

            {/* Background Layer (Stacked Paper Effect) */}
            <div className="absolute inset-0 bg-card rounded-[2rem] border border-border/30 translate-y-2.5 scale-[0.97] -z-10 opacity-70 shadow-sm transition-all duration-700 group-hover:translate-y-3" />
            <div className="absolute inset-0 bg-card rounded-[2rem] border border-border/20 translate-y-5 scale-[0.94] -z-20 opacity-40 shadow-sm transition-all duration-700 group-hover:translate-y-6" />
        </div>
    );
}
