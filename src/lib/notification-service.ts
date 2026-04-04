"use client";

import { LocalNotifications, ScheduleOn } from "@capacitor/local-notifications";
import { createClient } from "./supabase-client";

// ── Types ──
export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
    days: boolean[];       // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    showPreview: boolean;
    silent: boolean;
}

const STORAGE_KEY = "bible_notification_settings";
const NOTIFICATION_BASE_ID = 7000; // base ID for daily notifications

// ── Default Settings ──
export const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    hour: 6,
    minute: 0,
    days: [true, true, true, true, true, true, true], // all days
    showPreview: true,
    silent: false,
};

// ── Storage ──
export function loadNotificationSettings(): NotificationSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ── Permission ──
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === "granted") return true;

        const req = await LocalNotifications.requestPermissions();
        return req.display === "granted";
    } catch (e) {
        console.warn("Notification permission check failed (web?):", e);
        return false;
    }
}

// ── Cancel All Scheduled ──
export async function cancelAllDailyNotifications(): Promise<void> {
    try {
        const pending = await LocalNotifications.getPending();
        const dailyIds = pending.notifications
            .filter((n) => n.id >= NOTIFICATION_BASE_ID && n.id < NOTIFICATION_BASE_ID + 10)
            .map((n) => ({ id: n.id }));
        if (dailyIds.length > 0) {
            await LocalNotifications.cancel({ notifications: dailyIds });
        }
    } catch (e) {
        console.warn("Cancel notifications failed:", e);
    }
}

// ── Schedule ──
export async function scheduleDailyNotifications(
    settings: NotificationSettings,
    todayTitle?: string,
    todayVerse?: string
): Promise<void> {
    // Always cancel existing first
    await cancelAllDailyNotifications();

    if (!settings.enabled) return;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Map days array to Capacitor weekday (1=Sunday, 2=Monday, ..., 7=Saturday)
    // Our array: [Mon, Tue, Wed, Thu, Fri, Sat, Sun] = indices 0-6
    // Capacitor: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    const dayToCapWeekday = [2, 3, 4, 5, 6, 7, 1]; // Mon→2, Tue→3, ..., Sun→1

    const activeDays = settings.days
        .map((active, idx) => (active ? dayToCapWeekday[idx] : null))
        .filter((d): d is number => d !== null && d !== undefined);

    if (activeDays.length === 0) return;

    const title = "📖 성경 365";
    const body = settings.showPreview && todayTitle
        ? `오늘의 읽기: ${todayTitle}${todayVerse ? `\n${todayVerse}` : ""}`
        : "오늘의 성경 읽기가 준비되었습니다. 탭하여 시작하세요 🙏";

    // If all 7 days are selected, schedule a single daily notification
    if (activeDays.length === 7) {
        const schedule: { on: ScheduleOn; allowWhileIdle: boolean } = {
            on: { hour: settings.hour, minute: settings.minute },
            allowWhileIdle: true,
        };
        await LocalNotifications.schedule({
            notifications: [{
                id: NOTIFICATION_BASE_ID,
                title,
                body,
                sound: settings.silent ? undefined : "default",
                schedule,
            }],
        });
    } else {
        // Schedule individual weekday notifications
        const notifications = activeDays.map((weekday, idx) => ({
            id: NOTIFICATION_BASE_ID + idx + 1,
            title,
            body,
            sound: settings.silent ? undefined : "default",
            schedule: {
                on: { weekday, hour: settings.hour, minute: settings.minute } as ScheduleOn,
                allowWhileIdle: true,
            },
        }));
        await LocalNotifications.schedule({ notifications });
    }
}

export async function rescheduleFromSettings(todayTitle?: string, todayVerse?: string): Promise<void> {
    const settings = loadNotificationSettings();
    if (settings.enabled) {
        // 1. Local scheduling (fallback/native)
        await scheduleDailyNotifications(settings, todayTitle, todayVerse);
        
        // 2. Web Push scheduling (standard/closed app)
        await syncWebPushSubscription(settings);
    }
}

// ── Web Push Subscription ──

/**
 * Convert VAPID key to Uint8Array for pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Sync Web Push subscription with Supabase
 */
export async function syncWebPushSubscription(settings: NotificationSettings): Promise<void> {
    if (typeof window === "undefined" || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn("Push notifications not supported in this browser");
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // If notifications are disabled, unsubscribe
        if (!settings.enabled) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                // Optionally remove from server too
            }
            return;
        }

        // Get permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Apply VAPID Public Key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error("VAPID Public Key missing from environment");
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Save to Supabase
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: subscription.endpoint,
                subscription_json: JSON.parse(JSON.stringify(subscription)),
                alarm_time: `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}:00`,
                user_id: user?.id || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'endpoint' });

        if (error) throw error;
        console.log("Web Push subscription synced successfully");

    } catch (err) {
        console.error("Failed to sync Web Push subscription:", err);
    }
}

// ── Register Tap Listener ──
export async function registerNotificationTapListener(onTap: (action: any) => void): Promise<() => void> {
    try {
        const handle = await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
            onTap(action);
        });
        return () => handle.remove();
    } catch (e) {
        console.warn("Notification listener registration failed:", e);
        return () => { };
    }
}
