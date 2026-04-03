"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { BibleService, BibleVerse } from "@/lib/bible-service";

interface ReflectionModalProps {
    planReferences: string[];
    onComplete: (answer: string, rhemaVerse?: string) => void;
    onClose: () => void;
}

const QUESTIONS = [
    "오늘 읽은 말씀 중 마음에 와닿은 한 구절은 무엇인가요?",
    "오늘 본문을 읽으며 새롭게 깨달은 하나님의 성품은 무엇인가요?",
    "이 말씀이 오늘 나의 삶에 어떤 의미를 주나요?",
    "말씀을 읽으며 나에게 주신 위로나 권면이 있었다면 적어보세요.",
    "오늘 본문에 비추어 보았을 때 내가 내일 실천해야 할 한 가지는 무엇인가요?",
    "읽은 말씀 중 가장 기억에 남는 단어 하나와 그 이유는 무엇인가요?"
];

export default function ReflectionModal({ planReferences, onComplete, onClose }: ReflectionModalProps) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showRhemaPicker, setShowRhemaPicker] = useState(false);
    const [selectedRhema, setSelectedRhema] = useState<BibleVerse | null>(null);
    const [planVerses, setPlanVerses] = useState<BibleVerse[]>([]);

    useEffect(() => {
        // Pick a random question
        const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        setQuestion(q);
    }, []);

    const fetchPlanVerses = async () => {
        if (!planReferences || planVerses.length > 0) return;
        let allVerses: BibleVerse[] = [];
        for (const ref of planReferences) {
            try {
                const chapterData = await BibleService.getChapterContent(ref);
                allVerses = [...allVerses, ...chapterData.verses];
            } catch (e) {
                console.warn("Failed to fetch verses for Rhema picker", e);
            }
        }
        setPlanVerses(allVerses);
    };

    useEffect(() => {
        if (showRhemaPicker) {
            fetchPlanVerses();
        }
    }, [showRhemaPicker]);

    const handleSubmit = () => {
        if (!answer.trim()) return;
        setIsSubmitting(true);
        const rhemaPayload = selectedRhema
            ? `${selectedRhema.text} (${selectedRhema.book} ${selectedRhema.chapter}:${selectedRhema.verse})`
            : undefined;

        setTimeout(() => {
            onComplete(answer.trim(), rhemaPayload);
        }, 400);
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[410] bg-background border rounded-3xl shadow-2xl p-6 sm:max-w-xl sm:mx-auto animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-4 pt-2">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3">
                        완료 챌린지
                    </span>
                    <h3 className="text-lg font-bold leading-snug break-keep text-foreground mb-4">
                        {question}
                    </h3>

                    <button
                        onClick={() => setShowRhemaPicker(true)}
                        className="w-full flex flex-row items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold transition-all hover:opacity-80 active:scale-95 shadow-sm border border-border/40"
                    >
                        <span className={selectedRhema ? "text-primary" : ""}>레마</span>
                        {selectedRhema ? '말씀 변경' : '말씀 태그'}
                    </button>

                    {selectedRhema && (
                        <div className="p-3 mt-3 rounded-xl bg-primary/5 border border-primary/20 relative group transition-all animate-in fade-in slide-in-from-top-2">
                            <p className="text-sm font-medium leading-relaxed italic text-foreground/80 break-keep">
                                &quot;{selectedRhema.text}&quot;
                            </p>
                            <p className="text-xs font-bold text-primary mt-2 flex justify-end">
                                - {selectedRhema.book} {selectedRhema.chapter}:{selectedRhema.verse}
                            </p>
                            <button
                                onClick={() => setSelectedRhema(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="짧게 한 문장 또는 단어로 적어보세요..."
                        className="w-full h-24 p-4 border rounded-2xl bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-medium"
                        maxLength={100}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || isSubmitting}
                        className={cn(
                            "w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            answer.trim() && !isSubmitting
                                ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={18} />
                                기록하기
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground font-medium">
                        (5초만 고민해도 말씀이 마음에 깊이 남겨집니다)
                    </p>
                </div>
            </div>

            {/* Rhema Picker Bottom Sheet inside Modal */}
            {showRhemaPicker && (
                <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRhemaPicker(false)} />
                    <div className="relative bg-background rounded-t-[2rem] w-full h-[75vh] flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black font-serif text-primary">나의 레마 (Rhema)</h3>
                                <p className="text-xs font-bold text-muted-foreground mt-1">오늘 읽은 본문 중 마음에 남는 구절을 고르세요</p>
                            </div>
                            <button onClick={() => setShowRhemaPicker(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-colors active:scale-90">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-3 pr-2 no-scrollbar pb-10">
                            {planVerses.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                    <p className="text-sm font-bold text-muted-foreground animate-pulse">본문을 불러오는 중입니다...</p>
                                </div>
                            ) : (
                                planVerses.map((v, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setSelectedRhema(v);
                                            setShowRhemaPicker(false);
                                        }}
                                        className="p-4 rounded-2xl border-2 border-transparent bg-muted/40 hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-all active:scale-[0.98] group"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-black text-primary/70 group-hover:text-primary transition-colors">{v.book} {v.chapter}:{v.verse}</p>
                                        </div>
                                        <p className="text-[15px] font-medium leading-relaxed break-keep group-hover:text-foreground transition-colors text-foreground/80">{v.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
