import { useCallback } from 'react';
import { shareContent, shareViaSMS, shareViaKakao, generateShareText, loadShareSettings } from "@/lib/share-service";
import { fetchYoutubePlaylist, getVideoForDay } from "@/lib/youtube";
import { BibleReadingPlan } from "@/types/bible";

interface UseSharingProps {
    targetPlan: BibleReadingPlan | null;
    streak: number;
    progress: number;
    selectedDate: string;
}

export function useSharing({ targetPlan, streak, progress, selectedDate }: UseSharingProps) {
    const handleShare = useCallback(async (forceTemplate?: "reading" | "stats") => {
        const shareSettings = loadShareSettings();
        const template = forceTemplate || shareSettings.template || "reading";

        if (template === "reading" && !targetPlan) return;

        let data: Record<string, unknown>;
        if (template === "reading" && targetPlan) {
            let youtubeUrl = '';
            try {
                const videos = await fetchYoutubePlaylist();
                // Calculate day of year
                const dateObj = new Date(selectedDate);
                const start = new Date(dateObj.getFullYear(), 0, 0);
                const diff = dateObj.getTime() - start.getTime();
                const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

                const video = getVideoForDay(videos, dayOfYear);
                if (video) {
                    youtubeUrl = `https://youtu.be/${video.videoId}`;
                }
            } catch (e) {
                console.warn('Failed to get video URL for sharing', e);
            }

            data = { title: targetPlan.title, verse: targetPlan.verses[0], youtubeUrl };
        } else {
            data = { streak, progress };
        }

        const text = generateShareText(template, data);

        if (shareSettings.channel === 'sms' && shareSettings.recipientPhones && shareSettings.recipientPhones.length > 0) {
            await shareViaSMS(shareSettings.recipientPhones, text);
        } else if (shareSettings.channel === 'kakao') {
            await shareViaKakao(text);
        } else {
            await shareContent("성경 365", text);
        }
    }, [targetPlan, streak, progress, selectedDate]);

    return { handleShare };
}
