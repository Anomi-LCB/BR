"use client";

import { forwardRef, useState } from "react";
import { Quote, Share2, Loader2, Download } from "lucide-react";
import { toBlob } from 'html-to-image';
import { Button } from "./ui/button";

interface LiturgyCardProps {
    date: string;
    content: string;
    theme?: 'dawn' | 'dusk' | 'midnight';
}

export const LiturgyCard = forwardRef<HTMLDivElement, LiturgyCardProps>(({ date, content, theme = 'dawn' }, ref) => {
    const [isSharing, setIsSharing] = useState(false);
    const gradients = {
        dawn: "from-orange-100 via-rose-100 to-amber-100 text-stone-800",
        dusk: "from-slate-800 via-purple-900 to-slate-900 text-white",
        midnight: "from-gray-900 via-slate-800 to-black text-gray-200"
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const node = document.getElementById('liturgy-card-content');
            if (!node) return;

            // Wait a bit for fonts to load/render if needed, but usually ok here.
            // toBlob can be heavy.
            const blob = await toBlob(node, { cacheBust: true });
            if (!blob) return;

            const file = new File([blob], 'prayer-card.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'My Prayer',
                    text: content
                });
            } else {
                // Fallback: Download
                const link = document.createElement('a');
                link.download = 'prayer-card.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
        } catch (error) {
            console.error('Sharing failed', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="relative group max-w-sm mx-auto">
            <div
                id="liturgy-card-content"
                ref={ref}
                className={`relative p-8 rounded-3xl overflow-hidden bg-gradient-to-br ${gradients[theme]} shadow-xl`}
            >
                <div className="absolute top-4 left-4 opacity-20">
                    <Quote size={48} />
                </div>

                <div className="relative z-10 flex flex-col h-full items-center text-center space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase opacity-70">
                            Today's Liturgy
                        </h3>
                        <p className="text-sm font-serif italic opacity-60">{date}</p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-lg leading-relaxed font-medium font-serif whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>

                    <div className="w-8 h-1 bg-current opacity-20 rounded-full" />

                    <p className="text-[10px] tracking-widest opacity-50 uppercase">
                        Rhema AI Spiritual Twin
                    </p>
                </div>
            </div>

            <div className="absolute -bottom-12 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-lg rounded-full gap-2"
                    onClick={handleShare}
                    disabled={isSharing}
                >
                    {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                    {isSharing ? 'Sharing...' : 'Share Card'}
                </Button>
            </div>
        </div>
    );
});

LiturgyCard.displayName = "LiturgyCard";
