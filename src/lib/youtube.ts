import { startOfYear, differenceInDays } from 'date-fns';

export interface YoutubeVideo {
    videoId: string;
    title: string;
    dayNumber: number;
    thumbnailUrl: string;
    publishedAt: string;
    duration?: string; // ISO 8601 format (e.g., PT15M30S)
}

const OT_PLAYLIST_ID = 'PLVcVykBcFZTRw1ZxIhIQ9uuAU6lU_PvDB';
const NT_PLAYLIST_ID = 'PLVcVykBcFZTSM0ueQRAzrlRw42mmaUL6U';
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CACHE_KEY = 'youtube_bible_reading_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

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

/**
 * YouTube API를 통해 재생목록의 모든 영상을 가져옴 (최대 365개 이상)
 * 영상 길이(duration) 정보를 포함하기 위해 추가 API 호출 수행
 */
export async function fetchYoutubePlaylist(): Promise<YoutubeVideo[]> {
    if (!API_KEY) {
        console.warn('YouTube API Key is missing. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in .env.local');
        return [];
    }

    // 1. 캐시 확인
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        const { videos, timestamp } = JSON.parse(cachedData);
        // 비어있지 않은 유효한 캐시만 반환
        if (videos && videos.length > 0 && (Date.now() - timestamp < CACHE_EXPIRY)) {
            return videos;
        }
    }

    // 2. API 호출 로직 (재생목록별 처리)
    const fetchList = async (playlistId: string): Promise<YoutubeVideo[]> => {
        const videos: YoutubeVideo[] = [];
        let nextPageToken = '';
        
        try {
            do {
                const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
                const response = await fetch(playlistUrl);
                const data = await response.json();

                if (data.error) throw new Error(data.error.message);
                if (!data.items) break;

                const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
                const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`;
                const detailsResponse = await fetch(videoDetailsUrl);
                const detailsData = await detailsResponse.json();
                const durationMap = new Map(detailsData.items.map((v: any) => [v.id, v.contentDetails.duration]));

                const items = data.items.map((item: any, index: number) => {
                    const title = item.snippet.title;
                    const match = title.match(/(\d+)(회차|일차|일)/);
                    const dayNumber = match ? parseInt(match[1]) : (videos.length + index + 1);
                    const videoId = item.snippet.resourceId.videoId;

                    return {
                        videoId: videoId,
                        title: title,
                        dayNumber: dayNumber,
                        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                        publishedAt: item.snippet.publishedAt,
                        duration: durationMap.get(videoId) as string,
                    };
                });

                videos.push(...items);
                nextPageToken = data.nextPageToken;
            } while (nextPageToken);
            return videos;
        } catch (error) {
            console.error(`Failed to fetch playlist ${playlistId}:`, error);
            return [];
        }
    };

    try {
        // 구약과 신약 플레이리스트 병렬 로딩
        const [otVideos, ntVideos] = await Promise.all([
            fetchList(OT_PLAYLIST_ID),
            fetchList(NT_PLAYLIST_ID)
        ]);

        // 데이터 통합 및 중복 제거 (videoId 기준)
        const combined = [...otVideos, ...ntVideos];
        const uniqueVideos = Array.from(new Map(combined.map(v => [v.videoId, v])).values());
        
        // 날짜순으로 정렬 (dayNumber 기준)
        uniqueVideos.sort((a, b) => a.dayNumber - b.dayNumber);

        // 3. 캐시 저장
        if (uniqueVideos.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                videos: uniqueVideos,
                timestamp: Date.now()
            }));
        }

        return uniqueVideos;
    } catch (error) {
        console.error('Failed to fetch YouTube playlist:', error);
        return [];
    }
}

/**
 * 특정 일차에 해당하는 영상을 반환 (재생목록 예외 처리 포함)
 * - 인덱스가 아닌 dayNumber 속성을 직접 검색하여 데이터 정합성 보장
 */
export function getVideoForDay(videos: YoutubeVideo[], dayNumber: number): YoutubeVideo | null {
    if (!videos || videos.length === 0) return null;

    const targetDay = dayNumber > 365 ? 365 : dayNumber;

    // 1. 정확한 dayNumber 매칭 시도
    let video = videos.find(v => v.dayNumber === targetDay);

    // 2. 매칭되는 영상이 없을 경우 근접한 날짜의 영상이라도 찾음
    if (!video) {
        // 특정 누락된 날짜(Day 246 등)에 대한 처리
        if (targetDay === 246) return null;
        
        // 가장 가까운 이전 날짜 영상을 찾거나 인덱스로 시도
        video = videos.find(v => v.dayNumber < targetDay);
    }

    return video || null;
}
