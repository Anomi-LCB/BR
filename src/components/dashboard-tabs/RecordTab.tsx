"use client";

import { useState } from "react";
import { BookOpen, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProgress, BibleReadingPlan } from "@/types/bible";
import BibleProgressMap from "../BibleProgressMap";
import dynamic from "next/dynamic";

const YearlyProgressView = dynamic(() => import("../YearlyProgressView"), {
    loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
});

interface RecordTabProps {
    completedVerses: string[];
    completedPlanIds: number[];
    allPlans: BibleReadingPlan[];
    currentDate: string;
    onChapterClick?: (reference: string) => void;
}

export default function RecordTab({ completedVerses, completedPlanIds, allPlans, currentDate, onChapterClick }: RecordTabProps) {
    const [subTab, setSubTab] = useState<'bible' | 'calendar'>('bible');

    const progress = completedPlanIds.map(id => ({
        plan_id: id,
        reading_plan: allPlans.find(p => p.id === id)
    } as UserProgress)).filter(p => !!p.reading_plan);

    return (
        <div className="animate-in fade-in duration-300 pt-12 pb-8">
            {/* Sub-Tab Switcher */}
            <div className="flex items-center gap-1.5 px-2 mb-5">
                <button
                    onClick={() => setSubTab('bible')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all",
                        subTab === 'bible'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                >
                    <BookOpen size={13} />
                    성경 여정
                </button>
                <button
                    onClick={() => setSubTab('calendar')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all",
                        subTab === 'calendar'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                >
                    <Calendar size={13} />
                    날짜 여정
                </button>
            </div>

            {/* Content */}
            {subTab === 'bible' ? (
                <div className="px-1">
                    <BibleProgressMap completedVerses={completedVerses} onChapterClick={onChapterClick} />
                </div>
            ) : (
                <div className="overflow-y-auto hidden-scrollbar">
                    <YearlyProgressView progress={progress} allPlans={allPlans} currentDate={currentDate} />
                </div>
            )}
        </div>
    );
}
