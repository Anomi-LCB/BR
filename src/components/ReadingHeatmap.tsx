"use client";

import { useMemo } from "react";
import {
    startOfYear,
    endOfYear,
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    eachWeekOfInterval
} from "date-fns";
import { cn } from "@/lib/utils";
import { UserProgress, BibleReadingPlan } from "@/types/bible";
import { useBibleStore } from "@/store/useBibleStore";

interface ReadingHeatmapProps {
    progress: UserProgress[];
    allPlans: BibleReadingPlan[];
    currentDate: string;
}

export default function ReadingHeatmap({ progress, allPlans, currentDate }: ReadingHeatmapProps) {
    const yearStart = startOfYear(new Date(currentDate));
    const yearEnd = endOfYear(new Date(currentDate));

    // We want to show a grid of 53 weeks
    const weeks = useMemo(() => {
        const start = startOfWeek(yearStart, { weekStartsOn: 0 }); // Sunday
        const end = endOfWeek(yearEnd, { weekStartsOn: 0 });
        const allWeeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });

        return allWeeks.map(weekStart => {
            return Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i);
                const dateStr = format(day, "yyyy-MM-dd");
                const plan = allPlans.find(p => p.date === dateStr);
                const isCompleted = plan && progress.some(prog => prog.plan_id === plan.id);
                const isThisYear = day.getFullYear() === yearStart.getFullYear();

                return {
                    date: day,
                    dateStr,
                    isCompleted,
                    isThisYear,
                    planTitle: plan?.title
                };
            });
        });
    }, [allPlans, progress, yearStart, yearEnd]);

    const months = useMemo(() => {
        const labels: { month: string; startIndex: number }[] = [];
        let lastMonth = -1;

        weeks.forEach((week, i) => {
            const firstDayOfWeek = week[0].date;
            const currentMonth = firstDayOfWeek.getMonth();
            if (currentMonth !== lastMonth) {
                // Fix for the first label showing 12??
                let labelText = format(firstDayOfWeek, "M??);
                if (labels.length === 0 && labelText === "12??) {
                    labelText = "1??;
                }
                labels.push({ month: labelText, startIndex: i });
                lastMonth = currentMonth;
            }
        });
        return labels;
    }, [weeks]);

    // Summary stats
    const stats = useMemo(() => {
        const completed = progress.filter(p => {
            const plan = allPlans.find(ap => ap.id === p.plan_id);
            if (!plan) return false;
            return new Date(plan.date).getFullYear() === yearStart.getFullYear();
        }).length;

        const total = allPlans.filter(p => new Date(p.date).getFullYear() === yearStart.getFullYear()).length;
        return { completed, total };
    }, [progress, allPlans, yearStart]);

    // Activity Log from Store
    // We assume the parent passes this or we access it directly if we refactor. 
    // For now, let's treat `activityLog` as an optional prop or fetch from store if needed.
    // However, to keep it pure, we'll verify if we need to change Props.
    // The user request said "Visual Data Pipeline" and "Activity Log System".
    // I will assume the parent component passes `activityLog` or I will use the store hook here if allowed.
    // Let's stick to Props for now, but since I can't easily change the parent `BibleDashboard.tsx` right this second without a separate call,
    // I will import the store hook directly here for the "High-End" look.
    // Actually, let's update the component to use the store directly for activityLog to be self-contained for this visual upgrade.

    // BUT, the file provided had props. Let's start by modifying the component to use the store for activityLog.

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                    올해 {stats.completed}회 말씀 읽음
                </span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <span className="opacity-60">낮음</span>
                    <div className="flex gap-[3.5px]">
                        <div className="w-[11px] h-[11px] rounded-[3px] bg-black/5 dark:bg-white/10" />
                        <div className="w-[11px] h-[11px] rounded-[3px] bg-primary/20" />
                        <div className="w-[11px] h-[11px] rounded-[3px] bg-primary/50" />
                        <div className="w-[11px] h-[11px] rounded-[3px] bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)] ring-1 ring-primary/40" />
                    </div>
                    <span className="opacity-60">높음</span>
                </div>
            </div>

            <div className="w-full overflow-x-auto no-scrollbar pb-1">
                <div
                    className="min-w-[650px] flex flex-col gap-2"
                >
                    {/* Month Labels */}
                    <div className="flex text-[10px] text-muted-foreground relative h-4">
                        {months.map((label, i) => (
                            <div
                                key={i}
                                className="absolute font-bold whitespace-nowrap"
                                style={{
                                    left: `${label.startIndex * 12.5 + 28}px`,
                                    // Fix for Dec/Jan overlap: Hide January if it's too close to end (or handled by logic)
                                    // But actually, the issue is usually Dec overlapping Jan of next year or similar.
                                    display: (label.month === '1?? && i > 0) ? 'none' : 'block' // Simple fix: Hide 2nd Jan if it appears
                                }}
                            >
                                {label.month}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-[6px]">
                        {/* Day Labels */}
                        <div className="flex flex-col justify-between py-[2px] w-6 text-[9px] text-muted-foreground font-bold leading-none select-none">
                            <span>??/span>
                            <span>??/span>
                            <span>??/span>
                            <span>??/span>
                            <span>紐?/span>
                            <span>湲?/span>
                            <span>??/span>
                        </div>

                        {/* The Grid */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIdx) => (
                                        <HeatmapCell
                                            key={day.dateStr}
                                            day={day}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for better performance & clean logic

function HeatmapCell({ day }: { day: any }) {
    const activityLevel = useBibleStore(state => state.activityLog[day.dateStr] || 0);

    // Determine color based on completion OR activity level
    // Priority: Completed (Level 3) > Play (Level 2) > Visit (Level 1)

    // If completed in plan logic (from props), it's Level 3.
    // But we should sync the store's activityLog with completion too.
    // For now, we trust `day.isCompleted` for Level 3 rendering if the log hasn't updated yet,
    // but strictly we should use activityLog.
    // Let's use a hybrid:

    const isCompleted = day.isCompleted || activityLevel === 3;
    const level = isCompleted ? 3 : activityLevel;

    let style: React.CSSProperties = {};
    let bgClass = "bg-black/5 dark:bg-white/10";

    if (day.isThisYear) {
        if (level === 3) {
            bgClass = "bg-primary ring-1 ring-primary/50 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] animate-pulse-subtle";
        } else if (level === 2) {
            bgClass = "bg-primary/60";
        } else if (level === 1) {
            bgClass = "bg-primary/25";
        }
    } else {
        bgClass = "bg-transparent opacity-0 pointer-events-none";
    }

    return (
        <div
            title={`${day.dateStr}${day.planTitle ? `: ${day.planTitle}` : ''}`}
            className={cn(
                "w-[11px] h-[11px] rounded-[3px] transition-all duration-700 ease-out cursor-default relative group",
                bgClass
            )}
            style={style}
        >
            {/* Tooltip on hover - Premium Style */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[9px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 font-medium">
                {day.dateStr} {day.planTitle && `· ${day.planTitle}`}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
            </div>
        </div>
    );
}
