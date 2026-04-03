"use client";

import { useState } from "react";
import { X, Calendar, Share, Heart } from "lucide-react";
import { JournalEntry } from "@/store/useBibleStore";
import { shareContent } from "@/lib/share-service";

interface RhemaFeedViewProps {
    journals: JournalEntry[];
    onClose: () => void;
}

export default function RhemaFeedView({ journals, onClose }: RhemaFeedViewProps) {
    // Show all journals that have some content
    const feedItems = journals.filter(j => j.content && j.content.trim().length > 0);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

    const toggleLike = (id: string) => {
        setLikedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    if (feedItems.length === 0) {
        return (
            <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col items-center justify-center animate-in fade-in duration-500">
                <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <X size={24} />
                </button>
                <div className="w-16 h-1 bg-white/20 mb-6 rounded-full" />
                <p className="font-bold">아직 돌아볼 피드가 없습니다.</p>
                <p className="text-sm text-white/60 mt-2">오늘의 말씀을 읽고 묵상을 남겨보세요.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col animate-in slide-in-from-bottom-full duration-500 will-change-transform">
            {/* Close Button overlay */}
            <button
                onClick={onClose}
                className="absolute top-8 right-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center z-50 text-white border border-white/10 active:scale-90 transition-transform"
            >
                <X size={24} />
            </button>

            {/* Snap Container */}
            <div className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
                {feedItems.map((journal, index) => {
                    const dateStr = new Date(journal.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                    });

                    // Background gradients for variety
                    const gradients = [
                        "from-slate-900 via-purple-900/40 to-slate-900",
                        "from-sky-900/60 via-slate-900 to-slate-900",
                        "from-slate-900 via-rose-900/30 to-slate-900",
                        "from-emerald-900/30 via-slate-900 to-slate-900"
                    ];
                    const bgClass = gradients[index % gradients.length];

                    return (
                        <div
                            key={journal.id}
                            className={`w-full h-full snap-start snap-always relative flex flex-col justify-center items-center p-8 bg-gradient-to-br ${bgClass}`}
                        >
                            {/* Glassmorphism Card */}
                            <div className="w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                                <div className="flex items-center gap-2 mb-6 opacity-70 border-b border-white/10 pb-4">
                                    <Calendar size={14} />
                                    <span className="text-xs font-bold tracking-widest uppercase">{dateStr}</span>
                                </div>

                                {journal.rhema_verse && (
                                    <div className="mb-6">
                                        <h2 className="text-xl md:text-2xl font-serif font-bold leading-relaxed tracking-tight text-white mb-2">
                                            "{journal.rhema_verse.split('(')[0].trim()}"
                                        </h2>
                                        <p className="text-xs font-black text-primary/80 border-l-2 border-primary/50 pl-3">
                                            {journal.rhema_verse.match(/\((.*?)\)/)?.[1] || ""}
                                        </p>
                                    </div>
                                )}

                                <p className="text-[15px] font-medium leading-loose text-white/90 whitespace-pre-wrap">
                                    {journal.content}
                                </p>

                                {/* Action Buttons Overlay */}
                                <div className="mt-10 flex gap-4 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => toggleLike(journal.id)}
                                        className={`flex items-center gap-2 text-xs font-bold transition-colors ${likedIds.has(journal.id) ? 'text-red-500' : 'text-white/60 hover:text-white'}`}
                                    >
                                        <Heart size={16} className={likedIds.has(journal.id) ? "fill-red-500 text-red-500" : ""} />
                                        <span>응원해요</span>
                                    </button>
                                    <button
                                        onClick={() => shareContent("성경 365 묵상", `${journal.rhema_verse ? `"${journal.rhema_verse}"\n\n` : ''}${journal.content}`)}
                                        className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors ml-auto"
                                    >
                                        <Share size={16} /> <span>공유</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scroll Indicator Guide */}
                            {index < feedItems.length - 1 && (
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40 animate-pulse">
                                    <span className="text-[10px] uppercase tracking-widest font-bold mb-2">다음 묵상 보기</span>
                                    <div className="w-4 h-8 rounded-full border border-white flex items-start justify-center p-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
