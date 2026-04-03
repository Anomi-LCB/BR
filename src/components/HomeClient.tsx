"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useSearchParams } from 'next/navigation';
import BibleDashboard from "@/components/BibleDashboard";
import { getAllReadingPlans } from "@/lib/local-data";
import { UserProgress } from "@/types/bible";
import { useEffect, useState } from 'react';

export default function HomeClient() {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');

    // Client-side date logic
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        if (dateParam) {
             
            setSelectedDate(dateParam);
        } else {
            const todayStrKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
             
            setSelectedDate(todayStrKST);
        }
    }, [dateParam]);

    // Auth Logic skipped (Guest Mode enforce)
    const user = null;

    // ?占쎈꽠��⑨퐢爾꿨뜝�럥�몔 ?嚥싲갭횧占쎈쐪�뜝�럥�졒 ?�뜝�럩�맽�뜝�럥�렓 �뜝�럥�걼�뜝�럥爾��뜝�럥夷� �뜝�럥夷у뜝�럥利멨뜝�럩援�?癲ル슢�뀕占쎈쳮雅��굝짢�젆占�?(Local Data)
    const allPlans = getAllReadingPlans();

    // App Settings (Mocked from previous Supabase values to fix errors)
    const appSettings = [
        { key: "intro_video_url", value: "https://youtu.be/Sp71zxZjZIk?si=PJX1eyh59eILNc9D" },
        { key: "new_365_video_url", value: "https://www.youtube.com/playlist?list=PLVcVykBcFZTR4Q6cvmybjPgCklZlv-Ghj" }
    ];

    // ?�뜝�럥�뒌�뜝�럥痢�???占쎈꽠��⑨퐢爾꿨뜝�럥�몔 �솾�꺂�뒩占쎈룿�뜝�럥爾�癲ル슪�삕 ?�뜝�룞�삕占쎈���뜝�룞�삕�뜝�럡�돱 �뜝�럥夷у뜝�럥利멨뜝�럩援�?癲ル슢�뀕占쎈쳮雅��굝짢�젆占�?(Empty for server-side, client handles local storage)
    const allProgress: UserProgress[] = [];

    // ?占쎈꽠��⑨퐢爾닷뜝�럡�븤 ?�뜝�럥苑욃슖�댙�삕???�뜝�럥裕쎾뜝�럡��� �솾�꺂�뒖占쎈１占쎌젂�솒�굥�렓 (?�뜝�룞�삕占쎈��甕곗쥜彛⒴뜝占� �뜝�럥�뼓�뜝�럥�꽀?, SK-YY Matching)
    let rawTargetPlan;

    // Only calculate if selectedDate is set
    if (selectedDate && allPlans) {
        // Debugging Logs
        console.log(`[Debug] Date: ${selectedDate}, Total Plans: ${allPlans.length}`);

        // 1. ?癲ル슢怡놂옙�닑�몭占�???�뜝�럥苑욃슖�댙�삕 �솾�꺂�뒧占쎈턂�뜝�럡肄у뜝�럥�떛 ?�뜏類ｋ걝占쎌��
        const exactMatch = allPlans.find(p => p.date === selectedDate);
        if (exactMatch) {
            rawTargetPlan = exactMatch;
            console.log(`[Debug] Exact Match Found: ${exactMatch.id}`);
        } else {
            // 2. ????MM-DD) �솾�꺂�뒧占쎈턂�뜝�럡肄у뜝�럥�떛 ?�뜏類ｋ걝占쎌�� (?�뜝�룞�삕占쎈��甕곗쥜彛⒴뜝占� �뜝�럥�뼓�뜝�럩源볡춯臾뺤삕)
            const targetMMDD = selectedDate.slice(5); // "2026-02-13" -> "02-13"
            rawTargetPlan = allPlans.find(p => p.date && p.date.endsWith(targetMMDD));
            console.log(`[Debug] Fuzzy Match (MM-DD: ${targetMMDD}): ${rawTargetPlan ? rawTargetPlan.id : 'Not Found'}`);
        }
    }

    // Prevent render until date is determined to avoid mismatch or empty state
    if (!selectedDate) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <BibleDashboard
            user={user}
            allPlans={allPlans || []}
            initialProgress={allProgress || []}
            appSettings={appSettings || []}
            initialDate={selectedDate}
            rawTargetPlan={rawTargetPlan}
        />
    );
}
