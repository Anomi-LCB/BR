import BibleDashboard from "@/components/BibleDashboard";
import { getAllReadingPlans } from "@/lib/local-data";
import { UserProgress } from "@/types/bible";
import { Suspense } from "react";

export default function Home() {
  // Supabase Init Deleted

  // Auth Logic skipped (Guest Mode enforce)
  const user = null;

  // Server doesn't read searchParams for static export. 
  // The client component uses useSearchParams to override the date dynamically.
  const todayStrKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const selectedDate = todayStrKST;

  // 전체 성경 읽기 계획 가져오기 (Local Data)
  const allPlans = getAllReadingPlans();

  // App Settings (Mocked from previous Supabase values to fix errors)
  const appSettings = [
    { key: "intro_video_url", value: "https://youtu.be/Sp71zxZjZIk?si=PJX1eyh59eILNc9D" },
    { key: "new_365_video_url", value: "https://www.youtube.com/playlist?list=PLVcVykBcFZTR4Q6cvmybjPgCklZlv-Ghj" }
  ];

  // 사용자 전체 진행 상황 가져오기 (Empty for server-side, client handles local storage)
  const allProgress: UserProgress[] = [];

  // 현재 날짜의 플랜 찾기 (연도 무관, SK-YY Matching)
  let rawTargetPlan;
  if (allPlans) {
    // Debugging Logs
    console.log(`[Debug] Date: ${selectedDate}, Total Plans: ${allPlans.length}`);

    // 1. 정확한 날짜 매칭 시도
    const exactMatch = allPlans.find(p => p.date === selectedDate);
    if (exactMatch) {
      rawTargetPlan = exactMatch;
      console.log(`[Debug] Exact Match Found: ${exactMatch.id}`);
    } else {
      // 2. 월-일(MM-DD) 매칭 시도 (연도 무시)
      const targetMMDD = selectedDate.slice(5); // "2026-02-13" -> "02-13"
      rawTargetPlan = allPlans.find(p => p.date && p.date.endsWith(targetMMDD));
      console.log(`[Debug] Fuzzy Match (MM-DD: ${targetMMDD}): ${rawTargetPlan ? rawTargetPlan.id : 'Not Found'}`);
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex rounded-md items-center justify-center p-8">Loading...</div>}>
      <BibleDashboard
        user={user}
        allPlans={allPlans || []}
        initialProgress={allProgress || []}
        appSettings={appSettings || []}
        initialDate={selectedDate}
        rawTargetPlan={rawTargetPlan}
      />
    </Suspense>
  );
}
