
export const dynamic = 'force-static';

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log("[DebugAPI] Starting...");

    // Check Env
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[DebugAPI] Env Check - URL: ${!!url}, Key: ${!!key}`);

    if (!url || !key) {
        return NextResponse.json({ error: "Missing Env Vars" }, { status: 500 });
    }

    try {
        const supabase = await createClient();
        console.log("[DebugAPI] Client created");

        // 1. Check Connection & Count
        const { count, error: countError } = await supabase
            .from('reading_plan')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error("[DebugAPI] Count Error:", countError);
            return NextResponse.json({ error: countError, message: "Count failed" }, { status: 500 });
        }
        console.log("[DebugAPI] Count result:", count);

        // 2. Fetch all plans
        const { data: allPlans, error: fetchError } = await supabase
            .from('reading_plan')
            .select('id, date, title')
            .order('id');

        if (fetchError) {
            console.error("[DebugAPI] Fetch Error:", fetchError);
            return NextResponse.json({ error: fetchError, message: "Fetch failed" }, { status: 500 });
        }
        console.log(`[DebugAPI] Fetched ${allPlans?.length} plans`);

        // 3. Check for today (02-13)
        const targetMMDD = '02-13';
        const matches = allPlans?.filter(p => p.date && p.date.endsWith(targetMMDD));
        console.log(`[DebugAPI] Matches for ${targetMMDD}:`, matches?.length);

        return NextResponse.json({
            total_count: count,
            target_mmdd: targetMMDD,
            matches: matches,
            sample_data: allPlans?.slice(0, 5)
        });
    } catch (e: any) {
        console.error("[DebugAPI] Fatal Error:", e);
        return NextResponse.json({ error: e.message || String(e), stack: e.stack }, { status: 500 });
    }
}
