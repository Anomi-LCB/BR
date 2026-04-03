"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SmartCard } from "@/components/ui/smart-card";
import {
    ALL_BADGES, CATEGORY_INFO, TIER_STYLES, LEVELS,
    calculateXP, getLevelFromXP, getXPProgress, checkBadgeUnlocked,
    type AchievementCategory, type Badge, type BadgeTier
} from "@/lib/achievement-service";
import { useThemeStore } from "@/store/useThemeStore";

interface AchievementTabProps {
    streak: number;
    totalRead: number;
    progressPercent: number;
    completedPlanIds: number[];
    allPlans: any[];
}

export default function AchievementTab({ streak, totalRead, progressPercent, completedPlanIds, allPlans }: AchievementTabProps) {
    const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
    const { activeTheme, activeFont, setTheme, setFont } = useThemeStore();

    // Calculate XP and level
    const journalCount = useMemo(() => {
        try { return parseInt(localStorage.getItem('journal_count') || '0', 10); } catch { return 0; }
    }, []);
    const shareCount = useMemo(() => {
        try { return parseInt(localStorage.getItem('share_count') || '0', 10); } catch { return 0; }
    }, []);

    const xp = useMemo(() => calculateXP(totalRead, streak, journalCount, shareCount), [totalRead, streak, journalCount, shareCount]);
    const level = useMemo(() => getLevelFromXP(xp), [xp]);
    const xpProgress = useMemo(() => getXPProgress(xp), [xp]);
    const nextLevel = useMemo(() => LEVELS.find(l => l.level === level.level + 1), [level]);

    const stats = { streak, totalRead, journalCount, shareCount, completedPlanIds, allPlans };

    const enrichedBadges = useMemo(() => {
        return ALL_BADGES.map(badge => {
            const { unlocked, current } = checkBadgeUnlocked(badge, stats);
            return {
                ...badge,
                unlocked,
                current,
                progress: Math.min(100, (current / badge.requirement) * 100),
            };
        });
    }, [stats]);

    const filtered = selectedCategory === 'all'
        ? enrichedBadges
        : enrichedBadges.filter(b => b.category === selectedCategory);

    const unlockedCount = enrichedBadges.filter(b => b.unlocked).length;
    const totalCount = enrichedBadges.length;
    const totalXPFromBadges = enrichedBadges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpReward, 0);
    const hiddenUnlocked = enrichedBadges.filter(b => b.category === 'hidden' && b.unlocked).length;
    const hiddenTotal = enrichedBadges.filter(b => b.category === 'hidden').length;

    return (
        <div className="animate-in fade-in duration-300 pt-12 pb-8 space-y-5">
            {/* XP & Level Header */}
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary/10 via-background to-amber-500/5 border border-primary/20 p-5">
                <div className="flex items-center gap-4">
                    {/* Level Badge */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/30 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl">{level.emoji}</span>
                            <span className="text-[9px] font-bold text-primary">Lv.{level.level}</span>
                        </div>
                    </div>

                    {/* Level Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-serif font-bold truncate">{level.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-primary whitespace-nowrap">{xp} XP</span>
                        </div>
                        {nextLevel && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                                다음 레벨까지 {nextLevel.minXP - xp} XP 남음 ✨ {nextLevel.emoji} {nextLevel.title}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center bg-background/50 rounded-xl py-2">
                        <p className="text-base font-bold">{unlockedCount}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">배지 획득</p>
                    </div>
                    <div className="text-center bg-background/50 rounded-xl py-2">
                        <p className="text-base font-bold">{totalXPFromBadges}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">배지 XP</p>
                    </div>
                    <div className="text-center bg-background/50 rounded-xl py-2">
                        <p className="text-base font-bold">{hiddenUnlocked}/{hiddenTotal}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">히든 발견</p>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div
                className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                <FilterButton
                    active={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                    label={`전체 (${unlockedCount}/${totalCount})`}
                />
                {(Object.entries(CATEGORY_INFO) as [AchievementCategory, typeof CATEGORY_INFO[AchievementCategory]][]).map(([key, info]) => {
                    const count = enrichedBadges.filter(b => b.category === key).length;
                    const unlocked = enrichedBadges.filter(b => b.category === key && b.unlocked).length;
                    return (
                        <FilterButton
                            key={key}
                            active={selectedCategory === key}
                            onClick={() => setSelectedCategory(key)}
                            label={`${info.emoji} ${info.label} (${unlocked}/${count})`}
                        />
                    );
                })}
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filtered.map((badge) => {
                    const tierStyle = TIER_STYLES[badge.tier];
                    const isHiddenLocked = badge.isHidden && !badge.unlocked;

                    return (
                        <SmartCard
                            key={badge.id}
                            variant="elevated"
                            className={cn(
                                "border transition-all duration-300 relative overflow-hidden",
                                badge.unlocked
                                    ? `${tierStyle.ring} ring-1 ${tierStyle.glow} shadow-lg`
                                    : "border-border/20 dark:border-white/5",
                                !badge.unlocked && !isHiddenLocked && "opacity-60 grayscale"
                            )}
                        >
                            <div className="flex flex-col items-center text-center gap-2 py-2 relative">
                                {/* Tier Label */}
                                {badge.unlocked && (
                                    <div className="absolute -top-0.5 -right-0.5 text-[10px]">
                                        {tierStyle.label}
                                    </div>
                                )}

                                {/* Seasonal Sparkle */}
                                {badge.seasonal && (
                                    <div className="absolute top-0 left-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                        시즌
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                    badge.unlocked
                                        ? `bg-gradient-to-br ${tierStyle.bg}`
                                        : isHiddenLocked
                                            ? "bg-gradient-to-br from-purple-500/10 to-indigo-500/5"
                                            : "bg-muted/20"
                                )}>
                                    <span className="text-2xl">
                                        {isHiddenLocked ? '🔒' : badge.icon}
                                    </span>
                                </div>

                                {/* Label */}
                                <div>
                                    <p className={cn(
                                        "text-[12px] font-bold leading-tight",
                                        badge.unlocked ? "text-foreground" : "text-muted-foreground/60"
                                    )}>
                                        {isHiddenLocked ? '???' : badge.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                        {isHiddenLocked
                                            ? (badge.hiddenHint || '비밀 조건을 달성하면 해제됩니다')
                                            : badge.description
                                        }
                                    </p>
                                </div>

                                {/* XP Reward */}
                                <span className={cn(
                                    "text-[9px] font-bold px-2 py-0.5 rounded-full",
                                    badge.unlocked
                                        ? `${tierStyle.color} bg-current/10`
                                        : "text-muted-foreground/40"
                                )}>
                                    +{badge.xpReward} XP
                                </span>

                                {/* Progress or Achieved */}
                                {badge.unlocked ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                            달성완료
                                        </span>
                                        {badge.reward && (
                                            <div className="flex flex-col items-center gap-1.5 mt-0.5 w-full">
                                                <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-full max-w-full truncate text-center">
                                                    🎁 {badge.reward} 획득
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (badge.rewardType === 'theme') {
                                                            setTheme(activeTheme === badge.reward ? null : badge.reward || null);
                                                        } else if (badge.rewardType === 'font') {
                                                            setFont(activeFont === badge.reward ? null : badge.reward || null);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "text-[9px] font-bold px-3 py-1 rounded-full border transition-all active:scale-95 shadow-sm whitespace-nowrap",
                                                        (badge.rewardType === 'theme' && activeTheme === badge.reward) || (badge.rewardType === 'font' && activeFont === badge.reward)
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-card text-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    {(badge.rewardType === 'theme' && activeTheme === badge.reward) || (badge.rewardType === 'font' && activeFont === badge.reward)
                                                        ? "적용 해제"
                                                        : "적용하기"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : !isHiddenLocked ? (
                                    <div className="w-full px-2 space-y-0.5">
                                        <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary/50 to-primary/30 rounded-full transition-all duration-700"
                                                style={{ width: `${badge.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground font-medium">
                                            {badge.current}/{badge.requirement}
                                        </p>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-purple-500/50">
                                        비밀 미스터리
                                    </span>
                                )}
                            </div>
                        </SmartCard>
                    );
                })}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="py-16 text-center text-muted-foreground/60">
                    <span className="text-4xl block mb-3">🍃</span>
                    <p className="text-sm font-medium">해당 카테고리에 해당하는 업적이 없습니다.</p>
                </div>
            )}
        </div>
    );
}

// === Filter Button ===
function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap",
                active
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
            )}
        >
            {label}
        </button>
    );
}
