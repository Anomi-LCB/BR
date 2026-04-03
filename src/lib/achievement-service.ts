"use client";

// === Achievement & XP Service ===
// Handles XP calculation, level system, hidden mission detection, and seasonal events

export type AchievementCategory = 'streak' | 'bible' | 'special' | 'hidden' | 'milestone' | 'seasonal';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic';

export interface Badge {
    id: string;
    icon: string;        // emoji
    title: string;
    description: string;
    requirement: number;
    category: AchievementCategory;
    tier: BadgeTier;
    xpReward: number;
    isHidden?: boolean;   // Only show "???" until unlocked
    hiddenHint?: string;  // Vague hint for hidden badges
    seasonal?: boolean;
    reward?: string;
    rewardType?: 'theme' | 'font' | 'icon';
}

// === XP & Level System ===
export interface LevelInfo {
    level: number;
    title: string;
    minXP: number;
    maxXP: number;
    emoji: string;
}

export const LEVELS: LevelInfo[] = [
    { level: 1, title: '새싹 신자', minXP: 0, maxXP: 100, emoji: '🌱' },
    { level: 2, title: '성실한 탐구자', minXP: 100, maxXP: 300, emoji: '📗' },
    { level: 3, title: '충실한 독자', minXP: 300, maxXP: 600, emoji: '📖' },
    { level: 4, title: '말씀의 벗', minXP: 600, maxXP: 1000, emoji: '🤝' },
    { level: 5, title: '말씀의 전사', minXP: 1000, maxXP: 1600, emoji: '⚔️' },
    { level: 6, title: '지혜의 탐구자', minXP: 1600, maxXP: 2400, emoji: '🦉' },
    { level: 7, title: '말씀의 장인', minXP: 2400, maxXP: 3500, emoji: '🔨' },
    { level: 8, title: '영적 지도자', minXP: 3500, maxXP: 5000, emoji: '🌟' },
    { level: 9, title: '하나님의 종', minXP: 5000, maxXP: 7000, emoji: '👑' },
    { level: 10, title: '성경 마스터', minXP: 7000, maxXP: 99999, emoji: '💎' },
];

export function calculateXP(totalRead: number, streak: number, journalCount: number, shareCount: number): number {
    return (totalRead * 10) + (streak * 2) + (journalCount * 15) + (shareCount * 5);
}

export function getLevelFromXP(xp: number): LevelInfo {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) return LEVELS[i];
    }
    return LEVELS[0];
}

export function getXPProgress(xp: number): number {
    const level = getLevelFromXP(xp);
    const range = level.maxXP - level.minXP;
    return Math.min(100, ((xp - level.minXP) / range) * 100);
}

// === Tier Styling ===
export const TIER_STYLES: Record<BadgeTier, { ring: string; glow: string; label: string; bg: string; color: string }> = {
    bronze: { ring: 'ring-amber-700/40', glow: 'shadow-amber-700/20', label: '🥉', bg: 'from-amber-800/20 to-amber-700/5', color: 'text-amber-700 dark:text-amber-400' },
    silver: { ring: 'ring-slate-400/50', glow: 'shadow-slate-400/20', label: '🥈', bg: 'from-slate-300/20 to-slate-400/5', color: 'text-slate-500 dark:text-slate-300' },
    gold: { ring: 'ring-yellow-500/50', glow: 'shadow-yellow-500/30', label: '🥇', bg: 'from-yellow-400/20 to-amber-500/5', color: 'text-yellow-600 dark:text-yellow-400' },
    diamond: { ring: 'ring-cyan-400/60', glow: 'shadow-cyan-400/30', label: '💎', bg: 'from-cyan-400/20 to-blue-500/10', color: 'text-cyan-500 dark:text-cyan-400' },
    mythic: { ring: 'ring-purple-500/60', glow: 'shadow-purple-500/40', label: '🔮', bg: 'from-purple-500/20 to-pink-500/10', color: 'text-purple-500 dark:text-purple-400' },
};

// === All Badges ===
export const ALL_BADGES: Badge[] = [
    // --- Streak (12) ---
    { id: 's-3', icon: '🔥', title: '불씨 점화', description: '3일 연속 읽기', requirement: 3, category: 'streak', tier: 'bronze', xpReward: 20 },
    { id: 's-7', icon: '🔥', title: '일주일 연속', description: '7일 연속 읽기', requirement: 7, category: 'streak', tier: 'bronze', xpReward: 50 },
    { id: 's-14', icon: '⚡', title: '2주 전사', description: '14일 연속 읽기', requirement: 14, category: 'streak', tier: 'silver', xpReward: 100 },
    { id: 's-21', icon: '💪', title: '3주 챔피언', description: '21일 연속 읽기', requirement: 21, category: 'streak', tier: 'silver', xpReward: 150 },
    { id: 's-30', icon: '🏅', title: '한 달 챌린저', description: '30일 연속 읽기', requirement: 30, category: 'streak', tier: 'gold', xpReward: 250 },
    { id: 's-60', icon: '🛡️', title: '두 달 수호자', description: '60일 연속 읽기', requirement: 60, category: 'streak', tier: 'gold', xpReward: 400 },
    { id: 's-90', icon: '🎯', title: '분기 정복자', description: '90일 연속 읽기', requirement: 90, category: 'streak', tier: 'diamond', xpReward: 600 },
    { id: 's-120', icon: '🦅', title: '독수리 날개', description: '120일 연속 읽기', requirement: 120, category: 'streak', tier: 'diamond', xpReward: 800 },
    { id: 's-150', icon: '⭐', title: '별의 전사', description: '150일 연속 읽기', requirement: 150, category: 'streak', tier: 'diamond', xpReward: 1000 },
    { id: 's-180', icon: '🏆', title: '반년 전설', description: '180일 연속 읽기', requirement: 180, category: 'streak', tier: 'mythic', xpReward: 1500 },
    { id: 's-300', icon: '🌟', title: '300일의 기적', description: '300일 연속 읽기', requirement: 300, category: 'streak', tier: 'mythic', xpReward: 2500 },
    { id: 's-365', icon: '👑', title: '1년 완주', description: '365일 연속 읽기', requirement: 365, category: 'streak', tier: 'mythic', xpReward: 5000 },

    // --- Bible Sections (9) ---
    { id: 'b-torah', icon: '📜', title: '모세오경 완독', description: '창세기~신명기', requirement: 40, category: 'bible', tier: 'gold', xpReward: 500 },
    { id: 'b-history', icon: '🏛️', title: '역사서 완독', description: '여호수아~에스더', requirement: 40, category: 'bible', tier: 'gold', xpReward: 500 },
    { id: 'b-poetry', icon: '🎵', title: '시가서 완독', description: '욥기~아가', requirement: 30, category: 'bible', tier: 'silver', xpReward: 400 },
    { id: 'b-major', icon: '📖', title: '대선지서 완독', description: '이사야~다니엘', requirement: 35, category: 'bible', tier: 'gold', xpReward: 500 },
    { id: 'b-minor', icon: '📕', title: '소선지서 완독', description: '호세아~말라기', requirement: 20, category: 'bible', tier: 'silver', xpReward: 300 },
    { id: 'b-gospel', icon: '✝️', title: '복음서 완독', description: '마태~요한복음', requirement: 30, category: 'bible', tier: 'gold', xpReward: 500 },
    { id: 'b-paul', icon: '✉️', title: '바울서신 완독', description: '로마서~빌레몬서', requirement: 25, category: 'bible', tier: 'silver', xpReward: 400 },
    { id: 'b-general', icon: '📗', title: '일반서신 완독', description: '히브리서~유다서', requirement: 15, category: 'bible', tier: 'silver', xpReward: 300 },
    { id: 'b-rev', icon: '🌈', title: '요한계시록 완독', description: '요한계시록 전체', requirement: 10, category: 'bible', tier: 'silver', xpReward: 300 },

    // --- Special (6) ---
    { id: 'sp-first', icon: '👶', title: '첫 걸음', description: '첫 번째 읽기 완료', requirement: 1, category: 'special', tier: 'bronze', xpReward: 10 },
    { id: 'sp-week10', icon: '📅', title: '주말 전사', description: '주말 10회 연속 읽기', requirement: 10, category: 'special', tier: 'silver', xpReward: 150 },
    { id: 'sp-share5', icon: '🔗', title: '공유의 달인', description: '5회 이상 공유', requirement: 5, category: 'special', tier: 'silver', xpReward: 100 },
    { id: 'sp-journal10', icon: '📝', title: '묵상 작가', description: '묵상일지 10회 작성', requirement: 10, category: 'special', tier: 'silver', xpReward: 150 },
    { id: 'sp-journal50', icon: '✒️', title: '묵상 마스터', description: '묵상일지 50회 작성', requirement: 50, category: 'special', tier: 'gold', xpReward: 500 },
    { id: 'sp-share20', icon: '📣', title: '복음 전도자', description: '20회 이상 공유', requirement: 20, category: 'special', tier: 'gold', xpReward: 300 },

    // --- Hidden (10) ---
    { id: 'h-night', icon: '🌙', title: '야행성 독수리', description: '자정~새벽 3시 사이 읽기 3회', requirement: 3, category: 'hidden', tier: 'gold', xpReward: 200, isHidden: true, hiddenHint: '밤이 깊을 때 말씀을 찾는 자...' },
    { id: 'h-perfect-week', icon: '✨', title: '완벽한 한 주', description: '월~일 7일 연속 빠짐없이', requirement: 7, category: 'hidden', tier: 'silver', xpReward: 150, isHidden: true, hiddenHint: '한 주를 빈틈없이 채워보세요' },
    { id: 'h-psalm119', icon: '🕊️', title: '시편의 위로', description: '시편 119편 완독', requirement: 1, category: 'hidden', tier: 'diamond', xpReward: 500, isHidden: true, hiddenHint: '가장 긴 노래를 끝까지 부른 자', reward: "프리미엄 폰트 '명조'", rewardType: 'font' },
    { id: 'h-diamond', icon: '💎', title: '다이아몬드 의지', description: '연속 200일 달성', requirement: 200, category: 'hidden', tier: 'mythic', xpReward: 3000, isHidden: true, hiddenHint: '인간의 한계를 넘어서...', reward: "테마 'Midnight Forest'", rewardType: 'theme' },
    { id: 'h-phoenix', icon: '🔄', title: '불사조', description: '연속 끊긴 다음날 바로 재시작', requirement: 1, category: 'hidden', tier: 'gold', xpReward: 300, isHidden: true, hiddenHint: '재에서 다시 일어나는 자' },
    { id: 'h-rainbow', icon: '🌈', title: '무지개 전사', description: '모든 성경 카테고리 각 1회 이상', requirement: 9, category: 'hidden', tier: 'diamond', xpReward: 500, isHidden: true, hiddenHint: '성경의 모든 색깔을 맛보세요' },
    { id: 'h-speed', icon: '⚡', title: '속독왕', description: '한 주에 10개 이상 장 완료', requirement: 10, category: 'hidden', tier: 'diamond', xpReward: 400, isHidden: true, hiddenHint: '고속열차처럼 말씀을 달려가라' },

    // --- Milestones (4) ---
    { id: 'm-25', icon: '🎯', title: '25% 달성', description: '전체 진행률 25%', requirement: 91, category: 'milestone', tier: 'bronze', xpReward: 200 },
    { id: 'm-50', icon: '🏆', title: '절반 정복', description: '전체 진행률 50%', requirement: 183, category: 'milestone', tier: 'silver', xpReward: 500 },
    { id: 'm-75', icon: '🏅', title: '75% 돌파', description: '전체 진행률 75%', requirement: 274, category: 'milestone', tier: 'gold', xpReward: 1000 },
    { id: 'm-100', icon: '👑', title: '성경 완독', description: '전체 365일 완독!', requirement: 365, category: 'milestone', tier: 'mythic', xpReward: 5000 },

    // --- Seasonal (3) ---
    { id: 'se-lent', icon: '✝️', title: '사순절 챌린지', description: '사순기간 40일 연속 읽기', requirement: 40, category: 'seasonal', tier: 'diamond', xpReward: 1000, seasonal: true },
    { id: 'se-advent', icon: '🕯️', title: '대림절 어드벤트', description: '12월 1~24일 연속 읽기', requirement: 24, category: 'seasonal', tier: 'gold', xpReward: 600, seasonal: true },
    { id: 'se-100', icon: '💯', title: '100일 작전', description: '올해 첫 100일 내 50일 읽기', requirement: 50, category: 'seasonal', tier: 'gold', xpReward: 500, seasonal: true },
];

export const CATEGORY_INFO: Record<AchievementCategory, { label: string; emoji: string }> = {
    streak: { label: '연속 읽기', emoji: '🔥' },
    bible: { label: '성경 범위', emoji: '📖' },
    special: { label: '특별 업적', emoji: '⭐' },
    hidden: { label: '히든 미션', emoji: '🔒' },
    milestone: { label: '마일스톤', emoji: '🎯' },
    seasonal: { label: '시즌 한정', emoji: '🎄' },
};

export function checkBadgeUnlocked(badge: Badge, stats: {
    streak: number;
    totalRead: number;
    journalCount: number;
    shareCount: number;
    completedPlanIds?: number[];
    allPlans?: any[];
}): { unlocked: boolean; current: number } {
    let current = 0;
    switch (badge.category) {
        case 'streak': current = stats.streak; break;
        case 'milestone': current = stats.totalRead; break;
        case 'bible': current = stats.totalRead; break; // Simplified — real implementation would track per section
        case 'special':
            if (badge.id.includes('share')) current = stats.shareCount;
            else if (badge.id.includes('journal')) current = stats.journalCount;
            else current = stats.totalRead;
            break;
        case 'hidden':
            if (badge.id === 'h-diamond') current = stats.streak;
            else if (badge.id === 'h-psalm119') {
                if (stats.completedPlanIds && stats.allPlans) {
                    const completedPlans = stats.allPlans.filter(p => stats.completedPlanIds!.includes(p.id));
                    const hasPsalm119 = completedPlans.some(p => p.verses.some((v: string) => v.includes("시편 119편")));
                    current = hasPsalm119 ? 1 : 0;
                } else {
                    current = 0;
                }
            }
            else current = stats.totalRead > 0 ? Math.min(stats.totalRead, badge.requirement) : 0;
            break;
        case 'seasonal': current = stats.streak; break;
    }
    return { unlocked: current >= badge.requirement, current };
}
