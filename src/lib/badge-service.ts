import { Badge, UserProgress, Achievement } from "@/types/bible";
import { calculateStreak } from "./stats";

export const BADGES: Badge[] = [
    {
        id: "streak_3",
        name: "작심삼일 탈피",
        description: "3일 연속 성경 읽기 달성",
        icon: "🌱",
        criteria: { type: "streak", value: 3 },
        rarity: "common"
    },
    {
        id: "streak_7",
        name: "거룩한 습관",
        description: "7일 연속 성경 읽기 달성",
        icon: "✨",
        criteria: { type: "streak", value: 7 },
        rarity: "common"
    },
    {
        id: "streak_30",
        name: "말씀의 사람",
        description: "30일 연속 성경 읽기 달성",
        icon: "🔥",
        criteria: { type: "streak", value: 30 },
        rarity: "rare"
    },
    {
        id: "total_50",
        name: "믿음의 경주자",
        description: "누적 50일 성경 읽기 달성",
        icon: "🏃",
        criteria: { type: "total_days", value: 50 },
        rarity: "rare"
    },
    {
        id: "total_100",
        name: "백부장",
        description: "누적 100일 성경 읽기 달성",
        icon: "🛡️",
        criteria: { type: "total_days", value: 100 },
        rarity: "epic"
    },
    {
        id: "perfect_month",
        name: "한 달의 영광",
        description: "한 달(30일) 동안 빠짐없이 읽기",
        icon: "🏆",
        criteria: { type: "streak", value: 30 },
        rarity: "epic"
    },
    {
        id: "one_year",
        name: "말씀의 정복자",
        description: "1년 365일 완독 달성",
        icon: "👑",
        criteria: { type: "total_days", value: 365 },
        rarity: "legendary"
    }
];

export function checkNewAchievements(
    progress: UserProgress[],
    existingAchievements: Achievement[]
): Badge[] {
    const earnedBadgeIds = new Set(existingAchievements.map(a => a.badge_id));
    const newBadges: Badge[] = [];

    // Extract dates of completed plans for streak calculation
    const completedPlanDates = progress
        .filter(p => p.is_completed && p.reading_plan?.date)
        .map(p => p.reading_plan!.date);

    const currentStreak = calculateStreak(completedPlanDates);
    const totalDays = progress.filter(p => p.is_completed).length;

    for (const badge of BADGES) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let isEarned = false;
        if (badge.criteria.type === "streak") {
            isEarned = currentStreak >= (badge.criteria as any).value;
        } else if (badge.criteria.type === "total_days") {
            isEarned = totalDays >= (badge.criteria as any).value;
        }

        if (isEarned) {
            newBadges.push(badge);
        }
    }

    return newBadges;
}

export function saveAchievements(achievements: Achievement[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('bible_achievements', JSON.stringify(achievements));
    }
}

export function loadAchievements(): Achievement[] {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bible_achievements');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
}
