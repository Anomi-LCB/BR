import { useEffect, useState } from "react";
import { getDirectEmbedUrl, getYoutubeWatchUrl } from "@/lib/youtube";
import { Youtube, AlertCircle, ExternalLink } from "lucide-react";
import { differenceInDays, startOfYear } from "date-fns";
import { GlassPanel } from "@/components/ui/glass-panel";

interface YoutubePlayerProps {
    selectedDate: string; // ISO string (YYYY-MM-DD)
    autoPlay?: boolean;
}

export default function YoutubePlayer({ selectedDate, autoPlay = false }: YoutubePlayerProps) {
    // Day of Year 계산
    const dateObj = new Date(selectedDate);
    const start = startOfYear(dateObj);
    const dayOfYear = differenceInDays(dateObj, start) + 1;

    const directEmbedUrl = getDirectEmbedUrl(dayOfYear);
    const watchUrl = getYoutubeWatchUrl(dayOfYear);

    const [iframeSrc, setIframeSrc] = useState<string>("");

    useEffect(() => {
        if (directEmbedUrl) {
            // autoPlay 파라미터를 추가
            const urlWithAutoplay = autoPlay ? `${directEmbedUrl}&autoplay=1` : directEmbedUrl;
            setIframeSrc(urlWithAutoplay);
        } else {
            setIframeSrc("");
        }
    }, [directEmbedUrl, autoPlay, selectedDate]);

    return (
        <GlassPanel intensity="medium" className="relative w-full overflow-hidden rounded-3xl shadow-lg group">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shadow-lg">
                        <Youtube className="w-3 h-3 text-white fill-current" />
                    </div>
                    <span className="text-xs font-bold text-white/90 shadow-sm">오늘의 말씀 영상</span>
                </div>
                <div className="flex items-center gap-2">
                    {watchUrl && (
                        <a
                            href={watchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pointer-events-auto p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
                            title="유튜브에서 보기"
                        >
                            <ExternalLink className="w-3 h-3 text-white" />
                        </a>
                    )}
                    <div className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Day {dayOfYear}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                {!directEmbedUrl ? (
                    <div className="flex flex-col items-center gap-2 text-white/50 px-6 text-center">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-medium leading-relaxed">
                            해당 날짜(246일차)의 영상이 누락되어 있습니다.<br/>
                            <span className="text-[10px] opacity-60">성경 텍스트와 오디오 아이콘을 통해 읽기를 계속하세요.</span>
                        </span>
                    </div>
                ) : (
                    /* 직접 임베드 모드 — API 없이 재생목록+인덱스로 바로 재생 (100% 씽크 일치) */
                    <iframe
                        src={iframeSrc}
                        title="Bible Reading Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                )}
            </div>
        </GlassPanel>
    );
}
