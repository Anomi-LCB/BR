export type BibleReadingPlan = {
  id: number;
  date: string; // YYYY-MM-DD
  title: string; // 예: "창세기 1-3장, 마태복음 1장"
  verses: string[]; // ["창세기 1장", "창세기 2장", "창세기 3장", "마태복음 1장"]
  day_of_year: number;
  category?: string;     // 성경 분류 (예: 모세오경)
  summary?: string;      // 한 줄 요약
  reading_time?: string; // 소요 시간 (예: 약 10분)
};

export type UserProgress = {
  id?: string;
  user_id?: string;
  plan_id: number;
  is_completed?: boolean;
  completed_at?: string;
  reading_plan?: BibleReadingPlan;
};

export type Badge = { 
    id: string; 
    name: string; 
    description: string; 
    icon: string; 
    rarity: "common" | "rare" | "epic" | "legendary"; 
    earnedAt?: string; 
    criteria?: any;
};

export type Achievement = {
    badge_id: string;
    earned_at: string;
};
