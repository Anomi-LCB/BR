"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/types/bible";
import { Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeOverlayProps {
    badge: Badge | null;
    onClose: () => void;
}

export default function BadgeOverlay({ badge, onClose }: BadgeOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for animation
    }, [onClose]);

    useEffect(() => {
        if (badge) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(true);
            // Auto close after 7 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [badge, handleClose]);

    if (!badge && !isVisible) return null;

    const rarityColors = {
        common: "from-slate-400 to-slate-500 shadow-slate-500/20",
        rare: "from-blue-400 to-indigo-500 shadow-indigo-500/20",
        epic: "from-purple-400 to-pink-600 shadow-pink-500/20",
        legendary: "from-amber-300 via-orange-400 to-red-600 shadow-orange-500/30"
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-500 px-4",
            isVisible ? "bg-background/40 backdrop-blur-md opacity-100" : "bg-transparent backdrop-blur-0 opacity-0 pointer-events-none"
        )}>
            <div className={cn(
                "relative w-full max-w-sm overflow-hidden rounded-[40px] bg-card border border-border/50 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isVisible ? "scale-100 translate-y-0" : "scale-50 translate-y-32 rotate-6"
            )}>
                {/* Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden pointer-events-none">
                    <Sparkles className="absolute top-8 left-8 text-primary/30 animate-pulse" size={40} />
                    <Star className="absolute bottom-12 right-12 text-primary/20 animate-bounce" size={60} />
                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                </div>

                <div className="p-10 flex flex-col items-center text-center">
                    {/* Badge Icon Container with Glow */}
                    <div className="relative mb-8 group">
                        <div className={cn(
                            "absolute inset-0 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full",
                            badge ? rarityColors[badge.rarity] : ""
                        )} />
                        <div className={cn(
                            "relative w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br shadow-2xl transform transition-transform duration-1000",
                            badge ? rarityColors[badge.rarity] : "",
                            isVisible ? "scale-100 rotate-0" : "scale-0 -rotate-45"
                        )}>
                            <div className="text-7xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none">
                                {badge?.icon}
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "space-y-3 transition-all duration-1000 delay-300",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}>
                        <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-muted/50 text-muted-foreground border border-border/50",
                            badge?.rarity === 'legendary' && "bg-orange-500 text-white border-none shadow-lg shadow-orange-500/30"
                        )}>
                            Achievement Unlocked
                        </span>
                        <h2 className="text-3xl font-serif font-black text-foreground pt-3 tracking-tight">
                            {badge?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed px-2 font-medium">
                            {badge?.description}
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className={cn(
                            "mt-10 w-full py-4.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300",
                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 delay-500"
                        )}
                    >
                        ?곴킅?ㅻ읇寃??リ린
                    </button>

                    <p className="mt-6 text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em] select-none">
                        Word of God remains forever
                    </p>
                </div>
            </div>

            {/* Confetti-like effect using simple divs if no library */}
            {isVisible && <ConfettiParticles />}
        </div>
    );
}

function ConfettiParticles() {
    // Generate stable random values once
    const particles = useState(() =>
        Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${2 + Math.random() * 3}s`
        }))
    )[0];

    return (
        <div className="fixed inset-0 pointer-events-none">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full bg-primary/40 animate-ping"
                    style={{
                        top: p.top,
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                />
            ))}
        </div>
    );
}
