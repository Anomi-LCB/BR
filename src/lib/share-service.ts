"use client";

import { Share } from "@capacitor/share";
import { LocalNotifications, ScheduleOn } from "@capacitor/local-notifications";

// ── Types ──
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Kakao: any;
    }
}

export type ShareFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type ShareChannel = "native" | "sms" | "kakao";

export interface ShareSettings {
    enabled: boolean;
    frequency: ShareFrequency;
    hour: number;
    minute: number;
    // Specific settings based on frequency
    weekday?: number; // 1(Sun) - 7(Sat) for Weekly
    dayOfMonth?: number; // 1-31 for Monthly
    month?: number; // 1-12 for Yearly
    template: "reading" | "stats"; // Template type
    // Channel settings
    channel: ShareChannel;
    recipientPhones: string[]; // SMS recipient phone numbers
    kakaoRoomId?: string; // KakaoTalk room identifier (deep link)
    kakaoJsKey?: string; // Kakao JS Key
}

const STORAGE_KEY = "bible_share_settings";
const SHARE_NOTIFICATION_ID = 8000;

// ── Default Settings ──
export const DEFAULT_SHARE_SETTINGS: ShareSettings = {
    enabled: false,
    frequency: "daily",
    hour: 9,
    minute: 0,
    weekday: 2, // Monday
    dayOfMonth: 1,
    month: 1,
    template: "reading",
    channel: "native",
    recipientPhones: [], // Initialize as empty array
    kakaoRoomId: "",
};

// ── Storage ──
export function loadShareSettings(): ShareSettings {
    if (typeof window === "undefined") return DEFAULT_SHARE_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SHARE_SETTINGS;
        return { ...DEFAULT_SHARE_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SHARE_SETTINGS;
    }
}

export function saveShareSettings(settings: ShareSettings): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ── Native Share ──
export async function shareContent(title: string, text: string, url?: string): Promise<void> {
    try {
        const canShare = await Share.canShare();
        if (canShare.value) {
            await Share.share({
                title,
                text,
                url,
                dialogTitle: "성경 365 공유하기",
            });
        } else {
            // Fallback for web or unsupported
            if (navigator.share) {
                await navigator.share({ title, text, url });
            } else {
                await navigator.clipboard.writeText(`${title}\n\n${text}\n${url || ""}`);
                alert("📋 클립보드에 복사되었습니다.");
            }
        }
    } catch (error) {
        console.warn("Share failed:", error);
    }
}

// ── SMS Share ──
export async function shareViaSMS(phones: string[], text: string): Promise<void> {
    try {
        if (!phones || phones.length === 0) return;

        // Determine separator based on OS (simple heuristic)
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isiOS ? '&' : ';'; // iOS uses &, Android uses ; or ,

        const phoneString = phones.join(separator);

        // Use native SMS intent via URI scheme
        const smsUrl = `sms:${phoneString}?body=${encodeURIComponent(text)}`;
        window.open(smsUrl, '_self');
    } catch (error) {
        console.warn("SMS share failed:", error);
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(text);
        alert("📋 SMS 전송을 위해 클립보드에 복사되었습니다.");
    }
}

// ── KakaoTalk Share ──
// ── KakaoTalk Share ──
export async function shareViaKakao(text: string, url?: string): Promise<void> {
    try {
        const shareUrl = url || 'https://bible-365-app.vercel.app';
        const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

        if (!jsKey) {
            console.warn("Kakao JS Key mismatch or missing.");
            await shareContent("성경 365", text, url);
            return;
        }

        // Helper to check initialization
        const isKakaoReady = () => window.Kakao && window.Kakao.isInitialized();

        // Initialize if needed
        if (window.Kakao && !isKakaoReady()) {
            try {
                window.Kakao.init(jsKey);
            } catch (e) {
                console.warn("Kakao Init Failed:", e);
                // Continue to try sharing or fallback
            }
        }

        if (isKakaoReady()) {
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: '성경 365 - 매일의 은혜',
                    description: text,
                    imageUrl: 'https://bible-365-app.vercel.app/og-image.png',
                    link: {
                        mobileWebUrl: shareUrl,
                        webUrl: shareUrl,
                    },
                },
                buttons: [
                    {
                        title: '함께 읽기',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl,
                        },
                    },
                ],
                installTalk: true, // Allow installing KakaoTalk if missing
            });
        } else {
            // Deep Link Fallback (Custom Scheme)
            // This is robust for mobile browsers where JS SDK might fail
            const encodedText = encodeURIComponent(text);
            const encodedUrl = encodeURIComponent(shareUrl);
            const kakaoScheme = `kakaolink://send?msg=${encodedText}&url=${encodedUrl}&appid=com.bible365.app`;

            // Try opening scheme
            window.location.href = kakaoScheme;

            // Fallback to native share if scheme fails (timeout)
            setTimeout(() => {
                const now = Date.now();
                // Simple check: if not moved away, it failed
                if (!document.hidden) {
                    shareContent("성경 365", text, url);
                }
            }, 2500);
        }

    } catch (error) {
        console.warn("KakaoTalk share failed:", error);
        await shareContent("성경 365", text, url);
    }
}

// ── Schedule Reminder ──
export async function scheduleShareReminder(settings: ShareSettings): Promise<void> {
    // 1. Cancel existing
    await cancelShareReminders();

    if (!settings.enabled) return;

    // 2. Request permission if needed (Assuming permission handled globally, but good to check)
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== "granted") return;
    }

    // 3. Construct Schedule
    let schedule: ScheduleOn | undefined;

    switch (settings.frequency) {
        case "daily":
            // Every day at HH:MM
            schedule = {
                hour: settings.hour,
                minute: settings.minute,
            };
            break;
        case "weekly":
            // Every week on specific weekday at HH:MM
            if (settings.weekday) {
                schedule = {
                    weekday: settings.weekday, // 1-7
                    hour: settings.hour,
                    minute: settings.minute,
                };
            }
            break;
        case "monthly":
            // Every month on specific day at HH:MM
            if (settings.dayOfMonth) {
                schedule = {
                    day: settings.dayOfMonth,
                    hour: settings.hour,
                    minute: settings.minute,
                };
            }
            break;
        case "yearly":
            // Every year on specific month/day at HH:MM
            if (settings.month && settings.dayOfMonth) {
                schedule = {
                    month: settings.month,
                    day: settings.dayOfMonth,
                    hour: settings.hour,
                    minute: settings.minute,
                };
            }
            break;
    }

    if (!schedule) return;

    // 4. Schedule Notification
    await LocalNotifications.schedule({
        notifications: [{
            id: SHARE_NOTIFICATION_ID,
            title: "📤 성경 읽기 공유 알림",
            body: "오늘의 은혜를 주변 사람들과 나누어 보세요! 탭하여 바로 공유하기",
            schedule: {
                on: schedule,
                allowWhileIdle: true, // Fire in Doze mode
            },
            extra: {
                type: "share_reminder",
                template: settings.template,
                channel: settings.channel
            }
        }]
    });
}

export async function cancelShareReminders(): Promise<void> {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: SHARE_NOTIFICATION_ID }] });
    } catch (e) {
        console.warn("Failed to cancel share reminder:", e);
    }
}

// ── Template Generator ──
export function generateShareText(
    template: "reading" | "stats",
    data: {
        title?: string;
        verse?: string;
        youtubeUrl?: string;
        streak?: number;
        progress?: number;
    }
): string {
    const now = new Date();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[now.getDay()];

    if (template === "reading") {
        const { title, verse, youtubeUrl } = data;
        const verseText = verse
            ? verse.substring(0, 100) + (verse.length > 100 ? "..." : "")
            : title || "";

        const lines = [
            `365 성경읽기 [ ${monthStr}월 ${dayStr}일 ${weekday}요일]`,
            `[오늘의 말씀] "${verseText}"`,
        ];

        if (youtubeUrl) {
            lines.push(`함께 읽어요 - ${youtubeUrl}`);
        }

        return lines.join('\n');
    } else {
        const { streak, progress } = data;
        return `📊 성경 365 챌린지\n\n🔥 ${streak}일 연속 읽기 달성!\n🏆 현재 진행률: ${progress}%\n\n꾸준함이 기적을 만듭니다.\n함께 도전해요! 💪`;
    }
}
