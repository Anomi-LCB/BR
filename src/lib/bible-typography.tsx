import React from 'react';

interface TypographyRule {
    pattern: RegExp;
    className: string;
}

// Applying Tailwind classes to specific theological keywords
const RULES: TypographyRule[] = [
    // Trinity/Deity (Red, boldest)
    { pattern: /(하나님|여호와|야훼|예수|그리스도|성령|주님|만군의 여호와|임마누엘|메시아|구세주|여호와 이레|여호와 닛시|여호와 샬롬|여호와 라파|여호와 로이|여호와 삼마|여호와 찯드케누|보혜사|전능자|창조주|구원자|알파와 오메가|어린 양|인자|대제사장|지존자)/g, className: "font-black text-red-600 dark:text-red-500" },

    // Major Biblical Figures (Black/White, boldest)
    { pattern: /(모세|바울|다윗|솔로몬|아브라함|이삭|야곱|요셉|베드로|요한|야고보|마태|마가|누가|마리아|하와|사무엘|다니엘|에스라|룻|여호수아)/g, className: "font-black text-foreground dark:text-white" },

    // Minor/Other Biblical Figures (Gray, bold)
    { pattern: /(아론|미리암|갈렙|기드온|삼손|보아스|사울|요나단|나단|히스기야|요시야|에스더|느헤미야|이사야|예레미야|에스겔|호세아|요엘|아모스|오바댜|요나|미가|나훔|하박국|스바냐|학개|스가랴|말라기|안드레|빌립|바돌로매|도마|다대오|시몬|가룟 유다|맛디아|스데반|바나바|실라|디모데|디도|빌레몬|아볼로|브리스길라|아굴라|바르사바|마르다|나사로|삭개오|빌라도|헤롯|바리새인|사두개인|가야바|니고데모|막달라 마리아)/g, className: "font-bold text-gray-500 dark:text-gray-400" },

    // Places & Geography (Gray-500, bold)
    { pattern: /(예루살렘|가나안|갈릴리|나사렛|베들레헴|사마리아|수사|애굽|바벨론|앗수르|시내 산|호렙 산|갈멜 산|시온|에덴|여리고|요단 강|소돔|고모라|안디옥|에베소|고린도|빌립보|데살로니가|골로새|아테네|로마|다메섹|벳새다|가버나움|겟세마네|가이사랴|두로|시돈|마게도냐|아가야|에돔|모압|암몬|블레셋|아람|미디안|앗시리아|바사|에스파냐|시나이|레바논|두로|소알|브엘세바|헤브론|벧엘|실로|길갈|세겜)/g, className: "font-bold text-gray-500/90 dark:text-gray-400/90" },

    // Grace, Love & Fruits of the Spirit (Warm, pinkish/reddish)
    { pattern: /(사랑|은혜|자비|긍휼|평강|영생|보혈|십자가|기쁨|축복|소망|구속|용서|부활|위로|화평|인내|양선|충성|온유|절제|화목|구원|화해|선하심|인자하심|생명)/g, className: "font-bold text-rose-600 dark:text-rose-400" },

    // Commands / Truth / Core Verbs (Solid blue/indigo)
    { pattern: /(말씀|진리|율법|계명|언약|약속|성경|믿음|순종|회개|지혜|명철|찬송|찬양|감사|회개하라|사랑하라|깨어 있으라|기도하라|찬양하라|감사하라|전파하라|기뻐하라|구하라|찾으라|두드리라|경외하라|기억하라|순종하라|믿으라|인내하라|두려워하지 말라|기다리라|예배하라|증언하라|거룩하라)/g, className: "font-bold text-indigo-600 dark:text-indigo-400" },

    // Light / Heavenly (Yellow/Blueish bright)
    { pattern: /(빛|영광|하늘|천사|보좌|생명수|반석|성전|에덴|시온|천국|새 예루살렘|면류관|나팔|불기둥|구름기둥|만나|만군|그룹|스랍)/g, className: "font-bold text-amber-500 dark:text-amber-400" },

    // Warnings / Judgment (Subtle dark red/purple)
    { pattern: /(심판|진노|사망|죄악|사탄|마귀|저주|파멸|악인|거짓 선지자|지옥|죄악|멸망|재앙|교만|우상|악행|어둠|적그리스도|무저갱|짐승|바벨론|음녀|배교|타락)/g, className: "font-semibold text-purple-700/80 dark:text-purple-400/80" },
];

export function parseLivingTypography(text: string) {
    let html = text;
    for (const rule of RULES) {
        html = html.replace(rule.pattern, `<span class="${rule.className} transition-colors duration-500">$1</span>`);
    }
    return html;
}

export function LivingTypography({ text, className, style }: { text: string, className?: string, style?: React.CSSProperties }) {
    const htmlContent = parseLivingTypography(text);

    return (
        <span
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}
