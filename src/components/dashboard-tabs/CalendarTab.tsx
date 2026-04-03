"use client";

import dynamic from 'next/dynamic';
import { UserProgress, BibleReadingPlan } from "@/types/bible";

const YearlyProgressView = dynamic(() => import("../YearlyProgressView"), {
    loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded-xl" />,
    ssr: false
});

interface CalendarTabProps {
    completedPlanIds: number[];
    allPlans: BibleReadingPlan[];
    currentDate: string;
}

export default function CalendarTab({ completedPlanIds, allPlans, currentDate }: CalendarTabProps) {
    const progress = completedPlanIds.map(id => ({
        plan_id: id,
        reading_plan: allPlans.find(p => p.id === id)
    } as UserProgress)).filter(p => !!p.reading_plan);

    return (
        <div className="h-full flex flex-col bg-background pt-12">
            <div className="flex-1 overflow-y-auto hidden-scrollbar pb-24">
                <YearlyProgressView progress={progress} allPlans={allPlans} currentDate={currentDate} />
            </div>
        </div>
    );
}
