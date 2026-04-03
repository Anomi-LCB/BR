"use client";

import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/bible-service";

interface BibleSearchTabProps {
    onSelect: (reference: string) => void;
}

export default function BibleSearchTab({ onSelect }: BibleSearchTabProps) {
    const [selectedBookIndex, setSelectedBookIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const bookFiltered = useMemo(() => {
        if (!searchQuery) return BIBLE_BOOKS;
        return BIBLE_BOOKS.filter(b => b.name.includes(searchQuery));
    }, [searchQuery]);

    const handleChapterSelect = (bookName: string, chapter: number) => {
        const label = bookName === '시편' ? '편' : '장';
        onSelect(`${bookName} ${chapter}${label}`);
    };

    return (
        <div className="flex flex-col h-full bg-background/50 max-w-md mx-auto w-full border-x border-border/10 shadow-sm relative pt-4 pb-[88px] z-50">
            {/* Header section */}
            <div className="px-5 pt-4 pb-4 bg-background w-full">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-4 font-serif">
                    <Search className="w-6 h-6 text-emerald-500" />
                    성경 찾기
                </h1>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="성경책 검색 (예: 창세기, 마태)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary/80 border-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow transition-colors placeholder:text-muted-foreground/60 shadow-sm text-base font-medium"
                        autoFocus
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden border-t border-border/30 bg-background">
                {/* Book List */}
                <div className="w-[38%] overflow-y-auto no-scrollbar bg-muted/5 pb-24 border-r border-border/20">
                    {bookFiltered.map((book) => {
                        const realIdx = BIBLE_BOOKS.findIndex(b => b.name === book.name);
                        return (
                            <button
                                key={book.name}
                                onClick={() => setSelectedBookIndex(realIdx)}
                                className={cn(
                                    "w-full text-left px-4 py-4 text-sm font-medium transition-all border-b border-border/20",
                                    selectedBookIndex === realIdx
                                        ? "bg-primary/8 text-primary font-bold border-r-4 border-r-primary"
                                        : "text-foreground hover:bg-muted/30"
                                )}
                            >
                                {book.name}
                            </button>
                        );
                    })}
                </div>

                {/* Chapter Grid */}
                <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
                    <h3 className="text-sm font-bold mb-4 text-muted-foreground sticky top-0 bg-background py-2">
                        {bookFiltered.length > 0 ? BIBLE_BOOKS[selectedBookIndex]?.name : ''}
                    </h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {bookFiltered.length > 0 && Array.from({ length: BIBLE_BOOKS[selectedBookIndex]?.chapters || 0 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handleChapterSelect(BIBLE_BOOKS[selectedBookIndex].name, i + 1)}
                                className="aspect-square flex items-center justify-center bg-muted/20 hover:bg-primary hover:text-primary-foreground rounded-xl transition-colors active:scale-95 text-sm font-bold border border-border/30"
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
