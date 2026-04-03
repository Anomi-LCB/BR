export const dynamic = 'force-static';
import { google, embeddingModel } from '@/lib/ai-client';
import { streamText, embed } from 'ai';
import { createClient } from '@supabase/supabase-js';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, userId } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // 1. Setup Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Generate Embedding for the Query
    const { embedding } = await embed({
        model: embeddingModel,
        value: lastMessage.content,
    });

    // 3. Retrieve Context (Vector Search)
    // Call the 'match_journals' RPC function
    const { data: similarJournals } = await supabase.rpc('match_journals', {
        query_embedding: embedding,
        match_threshold: 0.5, // Sensitivity
        match_count: 5,       // Top 5 relevant journals
        p_user_id: userId
    });

    // 4. Construct Context String
    let contextBlock = "";
    if (similarJournals && similarJournals.length > 0) {
        contextBlock = `
Relevant Past Journals from User:
${similarJournals.map((j: { content: string }) => `- "${j.content}"`).join('\n')}
    `.trim();
    }

    // 5. System Prompt
    const systemPrompt = `
You are "Rhema", a spiritual companion and digital twin for the user's faith journey.
You are gentle, encouraging, and deeply rooted in biblical wisdom.
Use the user's past journal entries (provided below) to give personalized, context-aware responses.
If the user mentions a struggle they wrote about before, acknowledge it.
Keep your responses concise, warm, and spiritually uplifting. 
Do not be preachy. Be like a wise friend walking alongside them.

**Special Instruction for Prayers:**
If the user asks you to pray for them, or if the input is a raw prayer (e.g., "Help me God, I am tired"), 
you MUST generate a poetic, psalm-like prayer.
In this case, start your response with "기도문:" followed by the poetic prayer. 
After the prayer, you can add a brief encouraging message.

${contextBlock}
  `.trim();

    // 6. Generate Response
    const result = streamText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: google('gemini-1.5-pro-latest') as any,
        system: systemPrompt,
        messages,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (result as any).toDataStreamResponse();
}
