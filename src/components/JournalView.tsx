"use client";

import { useState, useEffect, useRef } from "react";
import { SmartCard } from "./ui/smart-card";
import { PenLine, Sparkles, History, Send, Quote, MessageSquareHeart, Check, Mic, Tag, X, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BibleReadingPlan } from "@/types/bible";
import { useBibleStore } from "@/store/useBibleStore";
import { BibleService, BibleVerse } from "@/lib/bible-service";
import RhemaFeedView from "./RhemaFeedView";

interface JournalViewProps {
    plan?: BibleReadingPlan | null;
    defaultView?: 'write' | 'history';
}

export default function JournalView({ plan, defaultView = 'write' }: JournalViewProps) {
    const [content, setContent] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [view, setView] = useState<'write' | 'history'>(defaultView);
    const [showToast, setShowToast] = useState(false);

    // Voice Recording (STT) State
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const recognitionRef = useRef<any>(null);

    // Rhema (Bible Verse Tagging) State
    const [showRhemaPicker, setShowRhemaPicker] = useState(false);
    const [selectedRhema, setSelectedRhema] = useState<BibleVerse | null>(null);
    const [planVerses, setPlanVerses] = useState<BibleVerse[]>([]);

    // Global Store
    const { journals, addJournal } = useBibleStore();

    // Feed State
    const [showFeed, setShowFeed] = useState(false);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const interimRef = useRef("");

    // Korean Spacing Algorithm
    const formatKoreanText = (text: string) => {
        if (!text) return text;
        // ?대?/議곗궗 ???꾩뼱?곌린 媛뺤젣 ?쎌엯 (媛꾨떒 ?대━?ㅽ떛)
        let formatted = text.replace(/(?듬땲???⑸땲???낅땲???덉뒿?덈떎|??/g, '$1 ') // Wait wait, regex error fixing
            .replace(/(?듬땲???⑸땲???낅땲???덉뒿?덈떎|?댁슂|?꾩슂|?곗슂|?ㅼ슂|?�|????媛�|??瑜????먭쾶|?먯꽌|濡??쇰줈)(?![\s.,!?])/g, '$1 ');
        return formatted.replace(/\s+/g, ' ').trim();
    };

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ko-KR';

            // Auto-commit helper
            const commitInterim = () => {
                if (interimRef.current) {
                    setContent(prev => {
                        const spaced = formatKoreanText(interimRef.current);
                        const addSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
                        return prev + (addSpace ? ' ' : '') + spaced;
                    });
                    interimRef.current = "";
                    setInterimText("");
                }
            };

            recognitionRef.current.onresult = (event: any) => {
                let currentInterim = '';
                let finalTranscript = '';

                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setContent(prev => {
                        const spaced = formatKoreanText(finalTranscript);
                        const addSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
                        return prev + (addSpace ? ' ' : '') + spaced + " ";
                    });
                }

                interimRef.current = currentInterim;
                setInterimText(currentInterim);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                commitInterim();
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                commitInterim();
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = async () => {
        if (!recognitionRef.current) {
            alert("?대떦 湲곌린/釉뚮씪?곗????뚯꽦 ?몄떇??吏�?먰븯吏� ?딆뒿?덈떎.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                // Trigger native microphone permission prompt for Android/iOS WebViews
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop()); // close stream immediately
                }
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Microphone permission denied or error:", error);
                alert("留덉씠???묎렐 沅뚰븳???꾩슂?⑸땲?? 湲곌린 ?ㅼ젙?먯꽌 沅뚰븳???덉슜?댁＜?몄슂.");
            }
        }
    };

    const applyVoiceText = () => {
        if (!interimText) return;
        setContent(prev => {
            const spaced = formatKoreanText(interimText);
            const addSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
            return prev + (addSpace ? ' ' : '') + spaced;
        });
        interimRef.current = "";
        setInterimText("");
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
    };

    // Fetch chapters for Rhema Picker
    const fetchPlanVerses = async () => {
        if (!plan?.verses || planVerses.length > 0) return;

        let allVerses: BibleVerse[] = [];
        for (const ref of plan.verses) {
            // Re-use logic: parse "李?1" or "李?1-2" correctly by the service
            // Note: service expects specific formats but getChapterContent expects "李쎌꽭湲?1"
            // To be entirely accurate, we might need a proper parser. 
            // In our case, plan.verses has full names like "?щТ?섏긽 24"
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


    const saveJournal = async () => {
        let finalContent = content;
        if (interimText) {
            const spaced = formatKoreanText(interimText);
            const addSpace = finalContent.length > 0 && !finalContent.endsWith(' ') && !finalContent.endsWith('\n');
            finalContent = finalContent + (addSpace ? ' ' : '') + spaced;
            interimRef.current = "";
            setInterimText("");
        }

        if (!finalContent.trim()) return;

        setIsAnalyzing(true);
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        try {
            const mockFeedback = "?ㅻ뒛??留먯? ?덉뿉??源딆? 臾듭긽???섎늻??二쇱뀛??媛먯궗?⑸땲?? 湲곕줉??怨좊갚?ㅼ씠 ?뱀떊???띠뿉 ?대ℓ濡?留블엳湲?異뺣났?⑸땲??";

            const rhemaPayload = selectedRhema
                ? `${selectedRhema.text} (${selectedRhema.book} ${selectedRhema.chapter}:${selectedRhema.verse})`
                : undefined;

            await addJournal({
                plan_id: plan?.id ?? null,
                content: finalContent,
                mood: 'prayer',
                rhema_verse: rhemaPayload,
                ai_feedback: mockFeedback
            });

            setContent("");
            setSelectedRhema(null);
            setView('history');
            setShowToast(true);
        } catch (error) {
            console.error("AI Analysis/Save failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-4 pt-0 pb-6 animate-in fade-in duration-700 relative">
            {/* Sticky Top Tab & Feed Section */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 pb-2 pt-1 -mx-2 px-2 border-b border-border/40 space-y-2">
                <div className="flex bg-muted/40 p-1 rounded-xl w-full shadow-inner">
                    <button
                        onClick={() => setView('history')}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex justify-center items-center gap-1.5",
                            view === 'history' ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/60"
                        )}
                    >
                        <History size={14} />
                        吏�??湲곕줉
                    </button>
                    <button
                        onClick={() => setView('write')}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5",
                            view === 'write' ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/60"
                        )}
                    >
                        <Plus size={16} />
                        臾듭긽?섍린
                    </button>
                </div>

                {/* Enter Feed Button */}
                {journals.length > 0 && (
                    <button
                        onClick={() => setShowFeed(true)}
                        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-primary to-accent rounded-xl text-white shadow-sm active:scale-[0.98] transition-all hover:opacity-90"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <MessageSquareHeart size={16} className="text-white" />
                            </div>
                            <div className="text-left leading-tight">
                                <h4 className="font-serif font-black text-xs">?섏쓽 ?곸쟻 ?쇰뱶</h4>
                                <p className="text-[9px] font-bold text-white/80">?덈쭏 留먯?怨?臾듭긽 紐⑥븘蹂닿린</p>
                            </div>
                        </div>
                        <div className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 backdrop-blur-md border border-white/10">
                            ?닿린 <ChevronRight size={10} />
                        </div>
                    </button>
                )}
            </div>

            {view === 'write' ? (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-500 relative">
                    <SmartCard variant="elevated" className="bg-card border-primary/10 overflow-visible">
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col gap-2 pb-2">
                                <h3 className="text-lg font-serif font-black">{plan?.title || '?ㅻ뒛??留먯?'}</h3>
                                {plan && (
                                    <button
                                        onClick={() => setShowRhemaPicker(true)}
                                        className="w-full px-4 py-2 flex flex-row items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all hover:bg-amber-500/20 active:scale-[0.98] shadow-sm border border-amber-500/30 whitespace-nowrap overflow-hidden text-ellipsis"
                                    >
                                        <Tag size={12} className={cn("shrink-0", selectedRhema ? "text-amber-500" : "")} />
                                        <span className="truncate">
                                            {selectedRhema ? '留먯? 蹂�寃? : '留먯? ?쒓렇?섍린'}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Applied Rhema Quote */}
                            {selectedRhema && (
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 relative group transition-all animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm font-medium leading-relaxed italic text-foreground/80 break-keep">
                                        &quot;{selectedRhema.text}&quot;
                                    </p>
                                    <p className="text-xs font-bold text-primary mt-2 flex justify-end">
                                        - {selectedRhema.book} {selectedRhema.chapter}:{selectedRhema.verse}
                                    </p>
                                    <button
                                        onClick={() => setSelectedRhema(null)}
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden"
                                    >
                                        <X size={12} />
                                    </button>
                                    {/* Mobile clear button since group-hover doesn't work well */}
                                    <button
                                        onClick={() => setSelectedRhema(null)}
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center md:hidden"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <div className="relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={isListening ? "?ｊ퀬 ?덉뒿?덈떎... 臾듭긽???명븯寃?留먯??댁＜?몄슂." : "蹂몃Ц???듯빐 ?먮? ?먯씠???띠뿉 ?곸슜???댁슜???먯쑀濡?쾶 湲곕줉?대낫?몄슂..."}
                                    className="w-full min-h-[200px] bg-transparent border-none outline-none text-sm leading-relaxed resize-none font-medium placeholder:text-muted-foreground/40 z-10 relative"
                                />
                                {interimText && (
                                    <div className="absolute top-0 left-0 w-full min-h-[200px] text-sm leading-relaxed resize-none font-medium pointer-events-none break-all whitespace-pre-wrap">
                                        <span className="opacity-0">{content}{content && ' '}</span>
                                        <span className="text-primary/70 animate-pulse">{interimText}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                                {interimText && (
                                    <button
                                        onClick={applyVoiceText}
                                        className="w-full flex flex-row items-center justify-center gap-2 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs transition-colors"
                                    >
                                        <Mic size={14} /> ?띿뒪??蹂�?섑븯湲?
                                    </button>
                                )}
                                <div className="flex flex-row items-center justify-center gap-2 pt-2">
                                    <button
                                        onClick={toggleListening}
                                        className={cn(
                                            "h-12 w-16 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg",
                                            isListening
                                                ? "bg-red-500 text-white animate-pulse shadow-red-500/30"
                                                : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 hover:bg-rose-200"
                                        )}
                                        title="?뚯꽦?쇰줈 ?깅줉?섍린"
                                    >
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        onClick={saveJournal}
                                        disabled={(!content.trim() && !interimText.trim()) || isAnalyzing}
                                        className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 px-4"
                                    >
                                        {isAnalyzing ? "AI 遺꾩꽍 以?.." : "湲곕줉 ?꾨즺"}
                                        {!isAnalyzing && <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SmartCard>

                    <div className="px-2">
                        <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
                            &quot;?ы샇?�???⑤쾿??利먭굅?뚰븯??洹몄쓽 ?⑤쾿??二쇱빞濡?臾듭긽?섎뒗?꾨떎&quot; (?쒗렪 1:2)
                        </p>
                    </div>

                    {/* Rhema Picker Bottom Sheet */}
                    {showRhemaPicker && (
                        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRhemaPicker(false)} />
                            <div className="relative bg-background rounded-t-[2rem] w-full h-[75vh] flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black font-serif text-primary">?섏쓽 ?덈쭏 (Rhema)</h3>
                                        <p className="text-xs font-bold text-muted-foreground mt-1">?ㅻ뒛 ?쎌? 蹂몃Ц 以?留덉쓬???⑤뒗 援ъ젅??怨좊Ⅴ?몄슂</p>
                                    </div>
                                    <button onClick={() => setShowRhemaPicker(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-colors active:scale-90">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 space-y-3 pr-2 no-scrollbar pb-10">
                                    {planVerses.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                                            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                            <p className="text-sm font-bold text-muted-foreground animate-pulse">蹂몃Ц??遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
                                        </div>
                                    ) : (
                                        planVerses.map((v, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setSelectedRhema(v);
                                                    setShowRhemaPicker(false);
                                                }}
                                                className="p-5 rounded-2xl border-2 border-transparent bg-muted/40 hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-all active:scale-[0.98] group"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-black text-primary/70 group-hover:text-primary transition-colors">{v.book} {v.chapter}:{v.verse}</p>
                                                    <Tag size={12} className="text-primary/20 group-hover:text-primary/60 transition-colors" />
                                                </div>
                                                <p className="text-[15px] font-medium leading-relaxed break-keep group-hover:text-foreground transition-colors text-foreground/80">{v.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                    {journals.length === 0 ? (
                        <div className="py-20 text-center space-y-3 opacity-30">
                            <PenLine size={40} className="mx-auto" />
                            <p className="text-sm font-bold">?꾩쭅 湲곕줉??臾듭긽???놁뒿?덈떎.<br />泥?臾듭긽???④꺼蹂댁꽭??</p>
                        </div>
                    ) : (
                        journals.map((journal) => (
                            <SmartCard key={journal.id} variant="default" className="bg-card/50 border-border/30">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                                                {new Date(journal.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <h4 className="text-sm font-black">{!journal.plan_id ? '?먯쑀 臾듭긽' : (plan ? `${BibleService.getAbbreviatedTitle(plan.verses)} 臾듭긽` : `臾듭긽 湲곕줉 ${journal.plan_id}`)}</h4>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // TODO: Implement real edit mode
                                                setContent(journal.content);
                                                setView('write');
                                            }}
                                            className="text-muted-foreground hover:text-primary transition-colors p-1 bg-muted/30 rounded-full"
                                            title="?몄쭛?쇰줈 遺덈윭?ㅺ린"
                                        >
                                            <PenLine size={14} />
                                        </button>
                                    </div>

                                    {/* History Rhema Tag */}
                                    {journal.rhema_verse && (
                                        <div className="p-4 mb-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                                            <p className="text-[13px] italic font-medium leading-relaxed text-foreground/90 break-keep">
                                                &quot;{journal.rhema_verse.split('(')[0].trim()}&quot;
                                            </p>
                                            <p className="text-[10px] font-black text-primary mt-2">
                                                - {journal.rhema_verse.match(/\((.*?)\)/)?.[1] || "留먯?"}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                                        {journal.content}
                                    </p>
                                </div>
                            </SmartCard>
                        ))
                    )}
                </div>
            )}

            {/* Bottom Section Removed, moved to Top Sticky Navbar */}

            {/* Simple Toast Notification */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-foreground/90 text-background px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 flex items-center gap-2">
                    <Check size={14} />
                    臾듭긽 湲곕줉???�?λ릺?덉뒿?덈떎
                </div>
            )}

            {/* Rhema Feed Full Screen Overlay */}
            {showFeed && (
                <RhemaFeedView journals={journals} onClose={() => setShowFeed(false)} />
            )}
        </div>
    );
}
