import { useEffect, useState } from "react";
import { fetchYoutubePlaylist, getVideoForDay, getDirectEmbedUrl, getYoutubeWatchUrl, YoutubeVideo, parseDurationToMinutes } from "@/lib/youtube";
import { Youtube, Loader2, AlertCircle, Play, ExternalLink } from "lucide-react";
import { differenceInDays, startOfYear } from "date-fns";
import { GlassPanel } from "@/components/ui/glass-panel";

interface YoutubePlayerProps {
    selectedDate: string; // ISO string (YYYY-MM-DD)
    autoPlay?: boolean;
}

export default function YoutubePlayer({ selectedDate, autoPlay = false }: YoutubePlayerProps) {
    const [videoId, setVideoId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentVideo, setCurrentVideo] = useState<YoutubeVideo | null>(null);
    const [directEmbedUrl, setDirectEmbedUrl] = useState<string | null>(null);

    // Day of Year 계산
    const dateObj = new Date(selectedDate);
    const start = startOfYear(dateObj);
    const dayOfYear = differenceInDays(dateObj, start) + 1;

    useEffect(() => {
        async function fetchVideo() {
            setLoading(true);
            setError(null);
            setDirectEmbedUrl(null);

            try {
                // 1차: API로 전체 재생목록 가져와서 정확한 영상 매칭
                const videos = await fetchYoutubePlaylist();
                const videoData = getVideoForDay(videos, dayOfYear);

                if (videoData && videoData.videoId) {
                    setVideoId(videoData.videoId);
                    setCurrentVideo(videoData);
                } else {
                    // 2차 폴백: API 실패 또는 매칭 실패 시 직접 임베드 URL 사용
                    const embedUrl = getDirectEmbedUrl(dayOfYear);
                    if (embedUrl) {
                        setDirectEmbedUrl(embedUrl);
                        setVideoId(null);
                    } else {
                        // Day 246 등 실제로 영상이 없는 경우
                        setError("해당 날짜(246일차)의 영상이 누락되어 있습니다.");
                    }
                }
            } catch (err) {
                console.error("영상 로드 실패:", err);
                // 3차 폴백: 오류 발생 시에도 직접 임베드 시도
                const embedUrl = getDirectEmbedUrl(dayOfYear);
                if (embedUrl) {
                    setDirectEmbedUrl(embedUrl);
                } else {
                    setError("영상 로드 중 오류가 발생했습니다.");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();
    }, [selectedDate, dayOfYear]);

    // 날짜 변경 시 재생 상태 초기화
    useEffect(() => {
        setIsPlaying(autoPlay);
    }, [selectedDate, autoPlay]);

    // 유튜브 시청 URL (새 탭 열기용)
    const watchUrl = getYoutubeWatchUrl(dayOfYear);

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
                {loading ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                        <span className="text-xs font-medium text-white/50">영상을 불러오는 중...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 text-white/50 px-6 text-center">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-medium leading-relaxed">
                            {error}<br/>
                            <span className="text-[10px] opacity-60">재생목록에 아직 업로드되지 않았을 수 있습니다.</span>
                        </span>
                    </div>
                ) : directEmbedUrl ? (
                    /* 직접 임베드 모드 — API 없이 재생목록+인덱스로 바로 재생 */
                    <iframe
                        src={directEmbedUrl}
                        title="Bible Reading Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : !isPlaying && videoId ? (
                    /* 썸네일 프리뷰 모드 — API로 videoId를 가져온 경우 */
                    <div
                        className="relative w-full h-full cursor-pointer group/play"
                        onClick={() => setIsPlaying(true)}
                    >
                        <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover opacity-90 transition-opacity group-hover/play:opacity-75"
                            onError={(e) => {
                                // maxresdefault 없으면 hqdefault로 폴백
                                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform duration-300">
                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                            </div>
                        </div>
                    </div>
                ) : videoId ? (
                    /* 재생 모드 */
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
                        title="Bible Reading Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : null}
            </div>

            {/* Title Overlay (Bottom) */}
            {!loading && !error && currentVideo && (
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                        {currentVideo.title}
                    </h3>
                </div>
            )}
        </GlassPanel>
    );
}
