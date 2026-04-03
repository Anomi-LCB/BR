"use client";

import { useState } from "react";
import { Search, Music, ArrowLeft } from "lucide-react";
import { hymnsList, Hymn } from "@/data/hymns";

export default function HymnsTab() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);

    const filteredHymns = hymnsList.filter(
        (h) => h.title.includes(searchQuery) || h.id.toString().includes(searchQuery)
    );

    const parseLyrics = (lyrics: string) => {
        const lines = lyrics.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;

            // N절 매칭 (예: (1) 또는 1)
            const verseMatch = trimmed.match(/^[(]?(\d+)[)]?\s*(.*)/);
            if (verseMatch) {
                return (
                    <div key={idx} className="mt-8 first:mt-2 text-left leading-[2.2]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-2 text-xl">{verseMatch[1]}절</span>
                        <span>{verseMatch[2]}</span>
                    </div>
                );
            }

            // 후렴 매칭 (예: [후렴], (후렴), 후렴: 등)
            const chorusMatch = trimmed.match(/^(?:\[?후렴\]?|\(후렴\)|후렴\s*:?-?\s*)(.*)/i);
            if (chorusMatch) {
                return (
                    <div key={idx} className="mt-6 mb-4 p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 text-left leading-[2.2]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-2 italic">후렴</span>
                        <span className="italic opacity-90">{chorusMatch[1]}</span>
                    </div>
                );
            }

            // 일반 줄바꿈인 경우
            return (
                <div key={idx} className="text-left leading-[2.2]">
                    {trimmed}
                </div>
            );
        });
    };

    if (selectedHymn) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden relative max-w-md mx-auto w-full border-x border-border/10 shadow-sm">
                <div className="sticky top-0 left-0 right-0 z-10 bg-white/90 dark:bg-black/85 backdrop-blur-xl border-b border-border/50 px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => setSelectedHymn(null)}
                        className="p-2 -ml-2 rounded-full hover:bg-secondary/80 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <div>
                        <h2 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">찬송가 {selectedHymn.id}장</h2>
                        <h1 className="text-xl font-bold font-serif">{selectedHymn.title}</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                    <div className="max-w-md mx-auto font-serif text-lg text-foreground">
                        {parseLyrics(selectedHymn.lyrics)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50 max-w-md mx-auto w-full border-x border-border/10 shadow-sm">
            {/* Header section */}
            <div className="px-5 pt-6 pb-4 bg-background w-full">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-4 font-serif">
                    <Music className="w-6 h-6 text-emerald-500" />
                    찬송가
                </h1>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="장 번호 또는 제목 검색.."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary/80 border-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow transition-colors placeholder:text-muted-foreground/60 shadow-sm text-base font-medium"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 pt-2">
                <div className="grid gap-3 w-full">
                    {filteredHymns.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                            검색 결과가 없습니다.
                        </div>
                    ) : (
                        filteredHymns.map((hymn) => (
                            <button
                                key={hymn.id}
                                onClick={() => setSelectedHymn(hymn)}
                                className="w-full text-left bg-card p-4 rounded-3xl border border-border/50 shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-serif text-lg">{hymn.id}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-card-foreground font-serif truncate">{hymn.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 truncate font-medium">
                                        {hymn.lyrics.split('\n').find(l => l.trim().length > 5) || "가사 보기"}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
