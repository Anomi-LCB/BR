"use client";

import { useMemo } from "react";
import { selectEncouragement, getTimeGradient, getTimeBorderColor } from "@/lib/encouragement-data";
import { cn } from "@/lib/utils";

interface EncouragementBannerProps {
    streak?: number;
    progressPercent?: number;
    dayOfYear?: number;
}

export function EncouragementBanner({ streak = 0, progressPercent = 0, dayOfYear = 1 }: EncouragementBannerProps) {
    const message = useMemo(
        () => selectEncouragement(streak, progressPercent, dayOfYear),
        [streak, progressPercent, dayOfYear]
    );

    const gradient = getTimeGradient();
    const borderColor = getTimeBorderColor();

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-r border p-4 transition-all",
            gradient, borderColor
        )}>
            <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{message.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {message.reference
                        ? `"${message.body}" (${message.reference})`
                        : message.body
                    }
                </p>
            </div>
        </div>
    );
}
