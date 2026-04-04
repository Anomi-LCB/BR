import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Get current time (KR time)
        const now = new Date();
        const krTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const currentHourMinute = krTime.toISOString().split("T")[1].substring(0, 5); // "HH:MM"

        console.log(`Checking notifications for time: ${currentHourMinute}`);

        // 2. Fetch subscriptions matching the current time (or all if we run once a day)
        // Note: For simplicity in this example, we fetch everything. 
        // In a real cron, you'd filter by alarm_time proximity.
        const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select("*");

        if (subError) throw subError;

        // 3. Get Reading Plan for today
        // Calculate Day X (1-365) based on current date
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        // Fetch plan.json from the app (assuming it's accessible)
        // Or we could have it in the DB. Let's try to fetch from the site if possible, 
        // but for now, we'll use a generic message if not available.
        let todayTitle = `Day ${dayOfYear} 성경 읽기`;
        try {
            // Replace with your actual app URL
            const planResponse = await fetch(`${Deno.env.get("APP_URL")}/plan.json`);
            if (planResponse.ok) {
                const plan = await planResponse.json();
                const todayPlan = plan.find((p: any) => p.day === dayOfYear);
                if (todayPlan) {
                    todayTitle = `오늘의 읽기: ${todayPlan.title}`;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch plan.json, using default title");
        }

        // 4. Configure Web Push
        webpush.setVapidDetails(
            "mailto:example@yourdomain.com",
            Deno.env.get("VAPID_PUBLIC_KEY")!,
            Deno.env.get("VAPID_PRIVATE_KEY")!
        );

        // 5. Send notifications
        const notificationPayload = JSON.stringify({
            title: "📖 성경 365",
            body: todayTitle,
            icon: "/icons/icon-192x192.png",
            data: {
                url: `/?day=${dayOfYear}`
            }
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                const subObj = typeof sub.subscription_json === 'string' 
                    ? JSON.parse(sub.subscription_json) 
                    : sub.subscription_json;
                
                return webpush.sendNotification(subObj, notificationPayload);
            })
        );

        const successful = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        return new Response(JSON.stringify({ successful, failed }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Push Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
