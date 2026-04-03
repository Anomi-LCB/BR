"use client";

import { BookOpen } from "lucide-react";
import { SmartCard } from "../ui/smart-card";
import BibleProgressMap from "../BibleProgressMap";

interface BibleTabProps {
    completedVerses: string[];
    onChapterClick?: (reference: string) => void;
}

export default function BibleTab({ completedVerses, onChapterClick }: BibleTabProps) {
    return (
        <div className="animate-in fade-in duration-300 pt-12">
            <div className="flex items-center gap-3 mb-6 px-2">
                <div className="p-2 rounded-full bg-primary/10">
                    <BookOpen size={20} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-serif font-bold">성경 읽기 여정</h2>
                    <p className="text-xs text-muted-foreground">66권의 모든 기록</p>
                </div>
            </div>
            <SmartCard variant="default" padding="none" className="bg-card/30 border border-border/50 dark:border-white/15">
                <div className="p-4">
                    <BibleProgressMap completedVerses={completedVerses} onChapterClick={onChapterClick} />
                </div>
            </SmartCard>
        </div>
    );
}
