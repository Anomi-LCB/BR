/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseKey ? supabaseKey.substring(0, 15) : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// Check if key looks like a JWT
if (!supabaseKey.startsWith('eyJ')) {
    console.warn('WARNING: Key does not start with eyJ (standard JWT format). This might be the issue.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReadingPlan() {
    try {
        const { count, error } = await supabase
            .from('reading_plan')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error details:', error);
        } else {
            console.log(`Reading plans count: ${count}`);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

checkReadingPlan();
