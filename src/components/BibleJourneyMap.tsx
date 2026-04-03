"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "./ui/glass-panel";
import { MapPin, CheckCircle2, ChevronRight, Book } from "lucide-react";

const BIBLE_BOOKS = [
    { title: "모세오경", range: "창세기-신명기", count: 5, color: "from-amber-500/20 to-orange-500/20" },
    { title: "역사항", range: "여호수아-에스더", count: 12, color: "from-blue-500/20 to-indigo-500/20" },
    { title: "시가서", range: "욥기-아가", count: 5, color: "from-emerald-500/20 to-teal-500/20" },
    { title: "대예언서", range: "이사야-다니엘", count: 5, color: "from-purple-500/20 to-pink-500/20" },
    { title: "소예언서", range: "호세아-말라기", count: 12, color: "from-rose-500/20 to-red-500/20" },
    { title: "복음서", range: "마태복음-요한복음", count: 4, color: "from-cyan-500/20 to-sky-500/20" },
    { title: "초대교회", range: "사도행전", count: 1, color: "from-violet-500/20 to-fuchsia-500/20" },
    { title: "바울서신", range: "로마서-빌레몬서", count: 13, color: "from-lime-500/20 to-green-500/20" },
    { title: "일반서신", range: "히브리서-유다서", count: 8, color: "from-orange-500/20 to-amber-500/20" },
    { title: "예언서", range: "요한계시록", count: 1, color: "from-indigo-600/30 to-blue-600/30" }
];

export default function BibleJourneyMap() {
    // In a real app, we'd calculate current position based on progress
    const currentBookIndex = 2; // Demo: Currently at "Poetry" (시가서)

    return (
        <div className="space-y-6 py-4">
            <div className="flex flex-col gap-1 px-1">
                <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    성경 완독 여정 지도
                </h3>
                <p className="text-[11px] text-muted-foreground">창세기부터 요한계시록까지, 당신의 영적 발자취를 따라갑니다.</p>
            </div>

            <div className="relative pl-4 space-y-4">
                {/* Vertical Path Line */}
                <div className="absolute left-[30px] top-4 bottom-4 w-0.5 bg-border/40" />

                {BIBLE_BOOKS.map((book, idx) => {
                    const isCompleted = idx < currentBookIndex;
                    const isCurrent = idx === currentBookIndex;

                    return (
                        <motion.div
                            key={book.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative flex items-center gap-6 group"
                        >
                            {/* Node Icon */}
                            <div className={cn(
                                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                                isCompleted ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" : 
                                isCurrent ? "bg-white dark:bg-black border-2 border-primary animate-pulse" : 
                                "bg-muted text-muted-foreground border border-border"
                            )}>
                                {isCompleted ? <CheckCircle2 size={16} /> : 
                                 isCurrent ? <MapPin size={16} className="text-primary" /> : 
                                 <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>

                            {/* Card Content */}
                            <GlassPanel 
                                intensity="low" 
                                className={cn(
                                    "flex-1 p-3 border transition-all duration-300",
                                    isCurrent ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/50",
                                    !isCompleted && !isCurrent && "opacity-60 grayscale-[0.5]"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xs font-bold flex items-center gap-1.5">
                                            {book.title}
                                            {isCurrent && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full uppercase">Current</span>}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{book.range} ({book.count}권)</p>
                                    </div>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                        book.color
                                    )}>
                                        <Book size={14} className={cn(isCompleted || isCurrent ? "text-foreground/70" : "text-muted-foreground/50")} />
                                    </div>
                                </div>

                                {isCurrent && (
                                    <div className="mt-2.5 pt-2 border-t border-primary/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-bold text-primary/80">현재 진행도</span>
                                            <span className="text-[9px] font-bold">42%</span>
                                        </div>
                                        <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "42%" }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                )}
                            </GlassPanel>
                        </motion.div>
                    );
                })}
            </div>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground italic font-serif">
                    "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라" (잠 3:5)
                </p>
            </div>
        </div>
    );
}
