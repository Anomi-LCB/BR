
"use client";

import { BIBLE_BOOKS, BibleBook } from "@/lib/bible-metadata";
import { Check } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SmartCard } from "@/components/ui/smart-card";

interface BibleProgressMapProps {
    completedVerses: string[];
    onChapterClick?: (reference: string) => void;
}

interface BibleBookWithProgress extends BibleBook {
    percent: number;
    isCompleted: boolean;
}

export default function BibleProgressMap({ completedVerses, onChapterClick }: BibleProgressMapProps) {
    const [selectedBook, setSelectedBook] = useState<BibleBookWithProgress | null>(null);
    const [activeTab, setActiveTab] = useState<'OT' | 'NT'>('OT');

    // 1. Process completed verses into a Set of "BookName ChapterNumber"
    // Handles ranges like "창세기 1-3장" -> "창세기 1", "창세기 2", "창세기 3"
    const completedChapterSet = useMemo(() => {
        const set = new Set<string>();
        completedVerses.forEach(v => {
            const parts = v.trim().split(' ');
            if (parts.length < 2) return;

            const bookName = parts[0];
            const chapterPart = parts[1].replace('장', ''); // "1-3" or "1"

            if (chapterPart.includes('-')) {
                const [start, end] = chapterPart.split('-').map(n => parseInt(n));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        set.add(`${bookName} ${i}`);
                    }
                }
            } else {
                const chapter = parseInt(chapterPart);
                if (!isNaN(chapter)) {
                    set.add(`${bookName} ${chapter}`);
                }
            }
        });
        return set;
    }, [completedVerses]);

    // Calculate progress for each book based on the detailed Set
    const booksWithProgress = useMemo(() => {
        return BIBLE_BOOKS.map(book => {
            let completedCount = 0;
            for (let i = 1; i <= book.chapters; i++) {
                if (completedChapterSet.has(`${book.name} ${i}`)) {
                    completedCount++;
                }
            }
            const percent = (completedCount / book.chapters) * 100;
            return { ...book, percent, isCompleted: percent === 100 };
        });
    }, [completedChapterSet]);

    const currentBooks = useMemo(() => {
        return booksWithProgress.filter(b => b.category === activeTab);
    }, [booksWithProgress, activeTab]);

    return (
        <div className="flex flex-col h-full min-h-[400px]">
            {/* Tab Switcher */}
            <div className="flex p-1 mb-4 bg-muted/30 rounded-lg">
                <button
                    onClick={() => setActiveTab('OT')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300",
                        activeTab === 'OT'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    구약
                </button>
                <button
                    onClick={() => setActiveTab('NT')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300",
                        activeTab === 'NT'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    신약
                </button>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-4">
                    {currentBooks.map((book) => (
                        <button
                            key={book.name}
                            onClick={() => setSelectedBook(book)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 group",
                                book.isCompleted
                                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                                    : "bg-card hover:bg-muted border-border hover:border-primary/30"
                            )}
                        >
                            {/* Progress Circle / Status */}
                            <div className="relative mb-2">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                                    book.isCompleted
                                        ? "bg-primary text-primary-foreground"
                                        : book.percent > 0
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {book.isCompleted ? (
                                        <Check size={14} strokeWidth={3} />
                                    ) : (
                                        <span>{Math.round(book.percent)}%</span>
                                    )}
                                </div>

                                {/* Active Indicator Ring */}
                                {book.percent > 0 && !book.isCompleted && (
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
                                )}
                            </div>

                            {/* Book Name */}
                            <span className={cn(
                                "text-xs font-serif font-semibold text-center leading-tight transition-colors font-scalable",
                                book.isCompleted ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {book.name}
                            </span>
                        </button>
                    ))}
                </div>
            </ScrollArea>

            {/* Chapter Detail Modal (Overlay) */}
            {selectedBook && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedBook(null);
                    }}
                >
                    <div className="w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="text-center p-4 border-b bg-muted/20 shrink-0">
                            <h3 className="text-xl font-serif font-bold text-foreground">{selectedBook.name}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                {Math.round(selectedBook.percent)}% 완료 ({selectedBook.chapters}장 중)
                            </p>
                        </div>

                        {/* Native Scroll Container for reliability */}
                        <div className="flex-1 overflow-y-auto p-4 min-h-0 overscroll-contain">
                            <div className="grid grid-cols-5 gap-2 pb-2">
                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapter => {
                                    const isRead = completedChapterSet.has(`${selectedBook.name} ${chapter}`);
                                    return (
                                        <button
                                            key={chapter}
                                            onClick={() => {
                                                if (onChapterClick) {
                                                    onChapterClick(`${selectedBook.name} ${chapter}${selectedBook.name === '시편' ? '편' : '장'}`);
                                                }
                                            }}
                                            className={cn(
                                                "aspect-square rounded-md flex items-center justify-center text-xs font-medium border transition-colors",
                                                isRead
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                                            )}
                                        >
                                            {chapter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-muted/20 shrink-0">
                            <button
                                onClick={() => setSelectedBook(null)}
                                className="w-full py-3 bg-secondary hover:bg-muted rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

