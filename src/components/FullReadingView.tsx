"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Type, Check, Moon, Sun, Monitor, AlignLeft, AlignJustify, Minus, Plus, Search, BookOpen } from "lucide-react";
import { BibleReadingPlan } from "@/types/bible";
import { cn } from "@/lib/utils";
import { BibleService, BibleVerse, BIBLE_BOOKS, BIBLE_ABBR_MAP } from "@/lib/bible-service";
import { useBibleSettings } from "@/hooks/useBibleSettings";
import { LivingTypography } from "@/lib/bible-typography";
import { BIBLE_BOOKS as METADATA_BOOKS } from "@/lib/bible-metadata";

interface FullReadingViewProps {
    plan?: BibleReadingPlan;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

type BibleVersion = 'KRV' | 'RNKSV' | 'NIV' | 'NLT';
type ViewMode = 'inline' | 'split' | 'none';

const VERSIONS: { id: BibleVersion, label: string }[] = [
    { id: 'KRV', label: '개역개정' },
    { id: 'RNKSV', label: '새번역' },
    { id: 'NIV', label: 'NIV' },
    { id: 'NLT', label: 'NLT' },
];

export default function FullReadingView({ plan, onClose, onNext, onPrev }: FullReadingViewProps) {
    // ---- State & Hooks ----
    const { settings, updateSettings, isLoaded } = useBibleSettings();
    const [version, setVersion] = useState<BibleVersion>('KRV');
    const [compareVersion] = useState<BibleVersion>('NIV');
    const [compareMode] = useState<ViewMode>('none');

    // UI Visibility States
    const [showControls, setShowControls] = useState(true);
    const [showNavModal, setShowNavModal] = useState(false);

    const [showTypographyPanel, setShowTypographyPanel] = useState(false);
    const [showVersionSelector, setShowVersionSelector] = useState(false);

    // Data States
    const [currentReferences, setCurrentReferences] = useState<string[]>(plan?.verses || ["창세기 1장"]);
    const [textData, setTextData] = useState<BibleVerse[]>([]);
    const [contrastData, setContrastData] = useState<BibleVerse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Nav Modal States
    const [selectedBookIndex, setSelectedBookIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);

    // Extract current book name for dynamic category
    const currentBookMatch = currentReferences?.[0]?.match(/^([가-힣0-9a-zA-Z\s]+?)\s*\d+/);
    const currentBookName = currentBookMatch ? currentBookMatch[1].trim() : '';
    const dynamicCategory = METADATA_BOOKS.find(b => b.name === currentBookName)?.subCategory;
    const categoryToShow = isManualMode ? dynamicCategory : (plan?.category || dynamicCategory);

    const contentRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef(0);

    // Dynamic Title based on current text
    const displayTitle = useMemo(() => {
        if (!textData.length) return "로딩 중...";

        const chaptersMap = new Map<string, Set<number>>();

        for (const v of textData) {
            if (!chaptersMap.has(v.book)) {
                chaptersMap.set(v.book, new Set<number>());
            }
            chaptersMap.get(v.book)!.add(v.chapter);
        }

        const parts: string[] = [];

        for (const [book, chaptersSet] of Array.from(chaptersMap.entries())) {
            const abbr = BIBLE_ABBR_MAP[book] || book.substring(0, 1);
            const chapters = Array.from(chaptersSet).sort((a, b) => a - b);

            const ranges: string[] = [];
            let rangeStart = chapters[0];
            let prev = chapters[0];

            for (let i = 1; i < chapters.length; i++) {
                if (chapters[i] === prev + 1) {
                    prev = chapters[i];
                } else {
                    ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);
                    rangeStart = chapters[i];
                    prev = chapters[i];
                }
            }
            ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);

            parts.push(`${abbr} ${ranges.join(', ')}`);
        }

        return parts.join(', ');
    }, [textData]);

    // ---- Effects ----

    // Sync initial Plan reference
    useEffect(() => {
        if (plan && plan.verses.length > 0) {
            setCurrentReferences(plan.verses);
        }
    }, [plan]);

    // Load API Data
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const allVerses: BibleVerse[] = [];
                const allContrastVerses: BibleVerse[] = [];

                for (const reference of currentReferences) {
                    const mainText = await BibleService.getChapterContent(reference, version);
                    allVerses.push(...mainText.verses);

                    if (compareMode !== 'none') {
                        const subText = await BibleService.getChapterContent(reference, compareVersion);
                        allContrastVerses.push(...subText.verses);
                    }
                }

                setTextData(allVerses);
                setContrastData(allContrastVerses);

                // Pre-fetch adjacent if it's a single chapter
                if (currentReferences.length === 1 && allVerses.length > 0) {
                    const book = allVerses[0].book;
                    const chapter = allVerses[0].chapter;
                    BibleService.prefetchAdjacent(book, chapter, version);
                }

                // Scroll reset
                if (contentRef.current) {
                    contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                console.error("Failed to load bible verses:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [currentReferences, version, compareMode, compareVersion]);

    // Zero-Distraction Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;
            const currentScrollY = contentRef.current.scrollTop;

            // Hide on scroll down, show on scroll up (or near top)
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                if (!showTypographyPanel && !showNavModal && !showVersionSelector) {
                    setShowControls(false);
                }
            } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 100) {
                setShowControls(true);
            }
            lastScrollY.current = currentScrollY;
        };
        const element = contentRef.current;
        element?.addEventListener('scroll', handleScroll, { passive: true });
        return () => element?.removeEventListener('scroll', handleScroll);
    }, [showTypographyPanel, showNavModal, showVersionSelector]);

    // Auto Theme Logic based on settings
    useEffect(() => {
        if (!isLoaded) return;
        const root = window.document.documentElement;
        if (settings.theme === 'system') {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.remove("light", "dark", "sepia");
            root.classList.add(systemTheme);
        } else {
            root.classList.remove("light", "dark", "sepia");
            root.classList.add(settings.theme);
        }
    }, [settings.theme, isLoaded]);

    const navigateToChapter = (bookName: string, chapter: number) => {
        const label = bookName === '시편' ? '편' : '장';
        setCurrentReferences([`${bookName} ${chapter}${label}`]);
        setIsManualMode(true);
        setShowNavModal(false);
    };

    const bookFiltered = useMemo(() => {
        if (!searchQuery) return BIBLE_BOOKS;
        return BIBLE_BOOKS.filter(b => b.name.includes(searchQuery));
    }, [searchQuery]);

    if (!isLoaded) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col font-sans transition-colors duration-500 animate-in slide-in-from-bottom-4">

            {/* ---- 1. Header Sticky Nav (Smart Navigation) ---- */}
            <div className={cn(
                "absolute top-0 left-0 right-0 z-30 flex flex-col pt-10 pb-4 px-4 bg-background/90 backdrop-blur-xl border-b border-border/30 transition-all duration-500 ease-in-out",
                showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
            )}>
                <div className="flex items-center justify-between">
                    {/* Close Area */}
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted/80 transition-colors">
                        <X size={24} className="text-muted-foreground" />
                    </button>

                    <button
                        onClick={() => setShowNavModal(true)}
                        className="flex flex-col items-center px-4 py-1.5 hover:bg-muted/50 rounded-2xl transition-colors"
                    >
                        {categoryToShow && (
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                                {categoryToShow}
                            </span>
                        )}
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-lg font-serif font-bold whitespace-nowrap">{displayTitle}</h2>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                        </div>
                    </button>

                    {/* Right Tools (Version & Typo) */}
                    <div className="flex items-center gap-1 relative">
                        {/* Typography */}
                        <button
                            onClick={() => setShowTypographyPanel(!showTypographyPanel)}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                showTypographyPanel ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <Type size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header: Version & Compare Selectors */}
                <div className="flex justify-between items-center mt-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowVersionSelector(!showVersionSelector)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 hover:bg-muted/80 rounded-full text-xs font-bold transition-colors"
                        >
                            {VERSIONS.find(v => v.id === version)?.label}
                            <span className="text-[10px] border-l border-border/50 pl-2">변경</span>
                        </button>

                        {/* Version Dropdown */}
                        {showVersionSelector && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowVersionSelector(false)} />
                                <div className="absolute top-full left-0 mt-2 w-36 bg-popover rounded-xl border shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {VERSIONS.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => { setVersion(v.id); setShowVersionSelector(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 text-xs font-semibold"
                                        >
                                            {v.label}
                                            {version === v.id && <Check size={14} className="text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex bg-muted/30 rounded-full p-1 border">
                        <button
                            onClick={() => updateSettings({ livingTypography: true })}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", settings.livingTypography ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50")}
                        >
                            감성읽기 on
                        </button>
                        <button
                            onClick={() => updateSettings({ livingTypography: false })}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", !settings.livingTypography ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50")}
                        >
                            감성읽기 off
                        </button>
                    </div>
                </div>
            </div>

            {/* ---- 2. Main Reading Canvas (Zero-Distraction) ---- */}
            <div
                ref={contentRef}
                className={cn(
                    "flex-1 overflow-y-auto w-full flex flex-col pt-[8.5rem] pb-32 transition-colors duration-500",
                    settings.theme === 'sepia' ? 'bg-[#f4ecd8] text-[#433422]' : 'bg-background text-foreground'
                )}
            >
                {isLoading ? (
                    <div className="max-w-3xl mx-auto w-full px-6 space-y-6 pt-10">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-4 bg-muted/40 rounded w-full animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
                        ))}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full px-6 md:px-12">
                        {textData.map((v, i) => {
                            const isTitleRow = i === 0 || textData[i - 1].chapter !== v.chapter || textData[i - 1].book !== v.book;

                            return (
                                <React.Fragment key={`${v.book}-${v.chapter}-${v.verse}`}>
                                    {isTitleRow && (
                                        <div className="text-center pt-8 pb-6">
                                            <h3 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-primary">
                                                {v.book} {v.chapter}{v.book === '시편' ? '편' : '장'}
                                            </h3>
                                        </div>
                                    )}
                                    <div className="flex gap-3 md:gap-5 group mb-3 relative">
                                        {/* Verse Number Ribbon */}
                                        <span className={cn(
                                            "min-w-6 text-right text-xs md:text-sm font-sans font-bold pt-1.5 select-none transition-colors",
                                            compareMode !== 'none' ? "text-primary/70" : "text-muted-foreground/30 group-hover:text-primary"
                                        )}>
                                            {v.verse}
                                        </span>

                                        {/* Text Engine */}
                                        <div className="flex-1 space-y-1.5">
                                            {/* Primary Text */}
                                            {settings.livingTypography ? (
                                                <LivingTypography
                                                    text={v.text}
                                                    className={cn(
                                                        "leading-relaxed transition-all duration-300 antialiased block",
                                                        settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                                    )}
                                                    style={{
                                                        fontSize: `${settings.fontSize}px`,
                                                        lineHeight: settings.lineHeight
                                                    }}
                                                />
                                            ) : (
                                                <p
                                                    className={cn(
                                                        "leading-relaxed transition-all duration-300 antialiased block",
                                                        settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                                    )}
                                                    style={{
                                                        fontSize: `${settings.fontSize}px`,
                                                        lineHeight: settings.lineHeight
                                                    }}
                                                >
                                                    {v.text}
                                                </p>
                                            )}

                                            {/* Compare Inline Data */}
                                            {compareMode === 'inline' && contrastData[i] && (
                                                <p
                                                    className="font-sans text-blue-600/90 dark:text-blue-400 border-l-[3px] border-blue-500/30 pl-4 py-1.5 italic"
                                                    style={{
                                                        fontSize: `${settings.fontSize * 0.85}px`,
                                                        lineHeight: settings.lineHeight * 0.9
                                                    }}
                                                >
                                                    {contrastData[i].text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}

                        {/* EOF Spacer */}
                        <div className="h-20 w-full border-b border-border/20 mb-8 mt-12 flex justify-center items-end pb-2">
                            <div className="w-2 h-2 rounded-full bg-border" />
                        </div>
                    </div>
                )}
            </div>

            {/* ---- 3. Bottom Action Nav (Shown when controls are visible) ---- */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent flex justify-between items-end h-32 z-20 pointer-events-none transition-all duration-500 ease-in-out",
                showControls && !showTypographyPanel ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            )}>
                {onPrev && (
                    <button onClick={onPrev} className="pointer-events-auto flex items-center gap-2 mb-2 px-6 py-3 rounded-full bg-background/80 shadow-lg border border-border/40 text-foreground hover:bg-muted font-bold text-sm transition-transform active:scale-95">
                        <ChevronLeft size={18} /> 이전
                    </button>
                )}
                {onNext && (
                    <button onClick={onNext} className="pointer-events-auto flex items-center gap-2 mb-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-lg font-bold text-sm transition-transform active:scale-95 ml-auto">
                        다음 <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* ---- 4. Typography & Display Settings (Bottom Sheet) ---- */}
            {showTypographyPanel && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" onClick={() => setShowTypographyPanel(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-background border-t shadow-2xl z-50 rounded-t-3xl pt-2 pb-10 px-6 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-muted mx-auto rounded-full mb-6" />

                        <div className="space-y-8 max-w-sm mx-auto">
                            {/* Font Size */}
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">글자 크기</h4>
                                <div className="flex items-center gap-4 p-1 bg-muted/40 rounded-2xl border">
                                    <button
                                        onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) })}
                                        className="p-3 hover:bg-background rounded-xl text-muted-foreground transition-all flex-1 flex justify-center"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <span className="font-bold font-mono w-8 text-center">{settings.fontSize}</span>
                                    <button
                                        onClick={() => updateSettings({ fontSize: Math.min(36, settings.fontSize + 2) })}
                                        className="p-3 hover:bg-background rounded-xl text-foreground transition-all flex-1 flex justify-center"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Theme options */}
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">테마</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'system', icon: Monitor, label: '시스템' },
                                        { id: 'light', icon: Sun, label: '라이트' },
                                        { id: 'dark', icon: Moon, label: '다크' },
                                        { id: 'sepia', icon: BookOpen, label: '세피아' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => updateSettings({ theme: t.id as "system" | "light" | "dark" | "sepia" })}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all",
                                                settings.theme === t.id ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border/50 hover:bg-muted"
                                            )}
                                        >
                                            <t.icon size={18} />
                                            <span className="text-[10px] font-bold">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Line Height & Font Family */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">글꼴</h4>
                                    <div className="flex bg-muted/40 p-1 rounded-2xl border">
                                        <button
                                            onClick={() => updateSettings({ fontFamily: 'serif' })}
                                            className={cn("flex-1 py-2 text-sm font-serif font-bold rounded-xl transition-all", settings.fontFamily === 'serif' ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                                        >
                                            명조
                                        </button>
                                        <button
                                            onClick={() => updateSettings({ fontFamily: 'sans' })}
                                            className={cn("flex-1 py-2 text-sm font-sans font-bold rounded-xl transition-all", settings.fontFamily === 'sans' ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                                        >
                                            고딕
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">행간</h4>
                                    <div className="flex bg-muted/40 p-1 rounded-2xl border items-center">
                                        <button
                                            onClick={() => updateSettings({ lineHeight: Math.max(1.4, settings.lineHeight - 0.2) })}
                                            className="p-2 hover:bg-background rounded-xl text-muted-foreground flex-1 flex justify-center"
                                        >
                                            <AlignJustify size={16} />
                                        </button>
                                        <span className="text-xs font-bold w-6 text-center">{settings.lineHeight.toFixed(1)}</span>
                                        <button
                                            onClick={() => updateSettings({ lineHeight: Math.min(3.0, settings.lineHeight + 0.2) })}
                                            className="p-2 hover:bg-background rounded-xl text-foreground flex-1 flex justify-center"
                                        >
                                            <AlignLeft size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Living Typography Toggle */}
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">감성 읽기 모드 (Living Typography)</h4>
                                <div className="flex bg-muted/40 p-1 rounded-2xl border">
                                    <button
                                        onClick={() => updateSettings({ livingTypography: true })}
                                        className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", settings.livingTypography ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground")}
                                    >
                                        켜기
                                    </button>
                                    <button
                                        onClick={() => updateSettings({ livingTypography: false })}
                                        className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", !settings.livingTypography ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                                    >
                                        끄기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ---- 5. Smart Navigator Modal (Full Screen Index) ---- */}
            {showNavModal && (
                <div className="fixed inset-0 bg-background z-[200] flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 pt-12 border-b border-border/40">
                        <h2 className="text-lg font-bold">성경 검색</h2>
                        <button onClick={() => setShowNavModal(false)} className="p-2 rounded-full bg-muted">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 bg-muted/20">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="성경책 검색 (예: 창세기, 마태)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Book List */}
                        <div className="w-1/3 border-r overflow-y-auto no-scrollbar pb-10 bg-muted/5">
                            {bookFiltered.map((book) => {
                                const realIdx = BIBLE_BOOKS.findIndex(b => b.name === book.name);
                                return (
                                    <button
                                        key={book.name}
                                        onClick={() => setSelectedBookIndex(realIdx)}
                                        className={cn(
                                            "w-full text-left px-4 py-3.5 text-sm font-bold transition-all border-b border-border/30",
                                            selectedBookIndex === realIdx
                                                ? "bg-primary/10 text-primary border-r-2 border-r-primary"
                                                : "text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {book.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Chapter List */}
                        <div className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar bg-card">
                            <h3 className="text-base font-bold mb-4 font-serif text-primary sticky top-0 bg-card py-2 border-b">
                                {BIBLE_BOOKS[selectedBookIndex].name} 몇 장을 읽으시겠어요?
                            </h3>
                            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                                {Array.from({ length: BIBLE_BOOKS[selectedBookIndex].chapters }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigateToChapter(BIBLE_BOOKS[selectedBookIndex].name, i + 1)}
                                        className="h-10 flex items-center justify-center bg-muted/30 hover:bg-primary hover:text-primary-foreground border rounded-lg transition-colors active:scale-95"
                                    >
                                        <span className="text-sm font-bold font-sans">{i + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
