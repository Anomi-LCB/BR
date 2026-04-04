import { startOfYear, differenceInDays } from 'date-fns';

export interface YoutubeVideo {
    videoId: string;
    title: string;
    dayNumber: number;
    thumbnailUrl: string;
    publishedAt: string;
    duration?: string; // ISO 8601 format (e.g., PT15M30S)
}

// ★ 원본 365일 읽기 재생목록 (364개 영상, 246일차 누락)
const PLAYLIST_ID = 'PLVcVykBcFZTR4Q6cvmybjPgCklZlv-Ghj';
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CACHE_KEY = 'youtube_bible_reading_cache_v2';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7일

/**
 * 오늘이 1월 1일로부터 몇 번째 날인지 계산 (1~366)
 */
export function getDayOfYear(date: Date = new Date()): number {
    const start = startOfYear(date);
    return differenceInDays(date, start) + 1;
}

/**
 * ISO 8601 기간 (PT15M30S)을 분 단위로 변환 (반올림)
 */
export function parseDurationToMinutes(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    const totalMinutes = (hours * 60) + minutes + (seconds >= 30 ? 1 : 0);
    return totalMinutes || 1; // 최소 1분
}

import { YOUTUBE_DAY_TO_INDEX } from './youtubeLinks';

/**
 * ★ 핵심 매핑 함수: 읽기 일차(Day) → 재생목록 인덱스(0-based)
 * 
 * 복잡한 알고리즘을 사용하지 않고, youtube link.txt에서 파싱한
 * 1:1 매핑 하드코딩 테이블(youtubeLinks.ts)을 직접 조회하여 반환합니다.
 */
function dayToPlaylistIndex(day: number): number | null {
    if (day < 1 || day > 365) return null;
    
    const index = YOUTUBE_DAY_TO_INDEX[day];
    return index !== undefined ? index : null;
}

/**
 * ★ API 없이 바로 유튜브 임베드 URL 생성
 * API 호출 실패/불가 시 폴백으로 사용
 */
export function getDirectEmbedUrl(dayOfYear: number): string | null {
    const index = dayToPlaylistIndex(dayOfYear);
    if (index === null) return null;

    // YouTube embed에서 하드코딩된 index를 그대로 사용합니다.
    return `https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&index=${index}&rel=0&modestbranding=1&playsinline=1`;
}

/**
 * ★ 유튜브 시청 URL 생성 (외부 링크용)
 */
export function getYoutubeWatchUrl(dayOfYear: number): string | null {
    const index = dayToPlaylistIndex(dayOfYear);
    if (index === null) return null;

    return `https://www.youtube.com/watch?list=${PLAYLIST_ID}&index=${index}`;
}

/**
 * YouTube API를 통해 재생목록의 모든 영상을 가져옴
 * 실패 시 빈 배열 반환 → 호출부에서 getDirectEmbedUrl 폴백 사용
 */
export async function fetchYoutubePlaylist(): Promise<YoutubeVideo[]> {
    if (!API_KEY) {
        console.warn('YouTube API Key 미설정 — 직접 임베드 모드로 전환');
        return [];
    }

    // 1. 캐시 확인
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { videos, timestamp } = JSON.parse(cachedData);
            if (videos && videos.length > 0 && (Date.now() - timestamp < CACHE_EXPIRY)) {
                return videos;
            }
        }
    } catch {
        // 캐시 읽기 실패 → 무시하고 API 호출
    }

    // 2. API 호출 — 원본 재생목록에서 전체 영상 가져오기
    const allVideos: YoutubeVideo[] = [];
    let nextPageToken = '';

    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('YouTube API 오류:', data.error.message);
                break;
            }
            if (!data.items || data.items.length === 0) break;

            // 영상 상세 정보(길이) 가져오기
            const videoIds = data.items
                .map((item: any) => item.snippet?.resourceId?.videoId)
                .filter(Boolean)
                .join(',');

            let durationMap = new Map<string, string>();
            if (videoIds) {
                try {
                    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`;
                    const detailsRes = await fetch(detailsUrl);
                    const detailsData = await detailsRes.json();
                    if (detailsData.items) {
                        durationMap = new Map(detailsData.items.map((v: any) => [v.id, v.contentDetails?.duration]));
                    }
                } catch {
                    // 상세 정보 실패 → 무시 (duration만 없을 뿐)
                }
            }

            const items = data.items.map((item: any) => {
                const videoId = item.snippet?.resourceId?.videoId || '';
                return {
                    videoId,
                    title: item.snippet?.title || '',
                    dayNumber: 0, // 아래에서 재할당
                    thumbnailUrl: item.snippet?.thumbnails?.high?.url
                        || item.snippet?.thumbnails?.default?.url || '',
                    publishedAt: item.snippet?.publishedAt || '',
                    duration: durationMap.get(videoId) || undefined,
                };
            });

            allVideos.push(...items);
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);

        // 3. 캐시 저장
        if (allVideos.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                videos: allVideos,
                timestamp: Date.now()
            }));
        }

        return allVideos;
    } catch (error) {
        console.error('YouTube 재생목록 로드 실패:', error);
        return [];
    }
}

/**
 * ★ 특정 일차에 해당하는 영상을 반환
 * videos 배열은 재생목록 순서대로 정렬되어 있으므로
 * dayToPlaylistIndex로 정확한 배열 인덱스를 계산
 */
export function getVideoForDay(videos: YoutubeVideo[], dayNumber: number): YoutubeVideo | null {
    if (!videos || videos.length === 0) return null;

    const index = dayToPlaylistIndex(dayNumber);
    if (index === null) return null;
    if (index >= videos.length) return null;

    return videos[index] || null;
}
