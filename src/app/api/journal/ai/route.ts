import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { planTitle, content } = await req.json();

        // Use Gemini API Key from environment
        const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

        // Fallback for demo if no real AI key is configured (AIza codes are often restricted by service)
        if (!API_KEY || API_KEY.length < 20) {
            return NextResponse.json({
                feedback: `"${planTitle}" 말씀을 통해 깊은 은혜를 누리시는 모습이 아름답습니다. 고백하신 "${content.slice(0, 20)}..." 마음이 주님 보시기에 참 귀합니다. 말씀이 삶의 실제적인 능력이 되길 축복합니다.`
            });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `당신은 따뜻하고 지혜로운 기독교 영적 가이드입니다. 
                        사용자가 오늘 읽은 성경 본문 "${planTitle}"에 대해 다음과 같은 개인적인 묵상을 남겼습니다: "${content}". 
                        
                        이 묵상 내용을 잘 읽고, 다음 조건을 지켜서 한국어로 답변해주세요:
                        1. 사용자의 묵상 내용에 공감하며 따뜻한 격려를 보내주세요.
                        2. 읽은 본문의 핵심 의미와 사용자의 고백을 연결해 2~3문장 내외로 지혜로운 조언이나 축복을 해주세요.
                        3. 존댓말을 사용하며 아주 친절하고 품격 있는 어조로 작성해주세요.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                }
            })
        });

        if (!response.ok) {
            throw new Error('Gemini API Error');
        }

        const data = await response.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return NextResponse.json({
            feedback: feedback || "오늘도 말씀 안에서 깊은 묵상을 나누어 주셔서 감사합니다. 기록된 고백들이 당신의 삶에 열매로 맺히길 축복합니다."
        });

    } catch (error) {
        console.error("Journal AI Error:", error);
        return NextResponse.json({
            feedback: "오늘도 말씀으로 삶을 채우시는 당신을 응원합니다. 남겨주신 묵상이 주님 안에서 풍성한 열매 맺기를 기도합니다."
        });
    }
}
