"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "../ThemeToggle";
import { GlassPanel } from "../ui/glass-panel";
import { Youtube } from "lucide-react";

interface HeaderIslandProps {
    title?: string;
    subtitle?: string;
    onLogoClick?: () => void;
}

export default function HeaderIsland({ title = "성경 365", subtitle, onLogoClick }: HeaderIslandProps) {
    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center pointer-events-none"
        )}>
            {/* Left: Static Title Area */}
            <div className="flex flex-col pointer-events-auto">
                <div className="flex items-center gap-2">
                    <h1
                        className="font-serif font-black text-foreground text-2xl tracking-tighter leading-none cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={onLogoClick}
                    >
                        {title}
                    </h1>
                </div>
                {subtitle && (
                    <p className="text-xs font-bold text-muted-foreground mt-1 ml-1 animate-in fade-in slide-in-from-left-2 duration-700">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right: Controls */}
            <div className="pointer-events-auto flex items-center gap-2">
                {/* Guide Buttons */}
                <div className="flex gap-2 mr-2">
                    <a
                        href="https://www.youtube.com/playlist?list=PLVcVykBcFZTRw1ZxIhIQ9uuAU6lU_PvDB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-black/5 dark:border-white/10 transition-all hover:scale-105"
                    >
                        <Youtube size={14} className="text-red-600 dark:text-red-500" />
                        <span className="text-[10px] font-bold text-foreground/80">구약 길라잡이</span>
                    </a>
                    <a
                        href="https://www.youtube.com/playlist?list=PLVcVykBcFZTSM0ueQRAzrlRw42mmaUL6U"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-black/5 dark:border-white/10 transition-all hover:scale-105"
                    >
                        <Youtube size={14} className="text-red-600 dark:text-red-500" />
                        <span className="text-[10px] font-bold text-foreground/80">신약 길라잡이</span>
                    </a>
                </div>

                <GlassPanel intensity="low" radius="full" className="p-1">
                    <ThemeToggle />
                </GlassPanel>
            </div>
        </header>
    );
}
