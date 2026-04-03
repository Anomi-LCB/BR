/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// bible-app 폴더 내에서 실행될 것을 가정
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('여기에')) {
    console.error("Supabase credentials missing or invalid in .env.local");
    console.log("Current URL:", supabaseUrl);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding DOCX data to Supabase...");

    try {
        const planPath = path.resolve(__dirname, '../plan.json');
        const data = JSON.parse(fs.readFileSync(planPath, 'utf8'));

        const startDate = new Date('2026-01-01');
        const finalData = data.map((item) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + item.day - 1);
            return {
                date: d.toISOString().split('T')[0],
                title: item.title,
                verses: item.verses,
                day_of_year: item.day
            };
        });

        const { error } = await supabase
            .from('reading_plan')
            .upsert(finalData, { onConflict: 'date' });

        if (error) throw error;
        console.log(`Successfully seeded all ${finalData.length} days of the 2026 reading plan!`);
    } catch (err) {
        console.error("Error seeding:", err);
    }
}

seed();
