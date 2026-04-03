"use client";

// --- Encouragement Message Database ---
// 100+ context-aware encouragement messages for daily Bible reading

export interface EncouragementMessage {
    title: string;
    body: string;
    verse?: string;
    reference?: string;
    category: 'scripture' | 'streak' | 'milestone' | 'personal' | 'seasonal';
}

// ====== Scripture-based Messages (40) ======
const SCRIPTURE_MESSAGES: EncouragementMessage[] = [
    { title: "오늘도 함께하시는 하나님", body: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라", reference: "이사야 41:10", category: 'scripture' },
    { title: "주님의 인도하심", body: "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라", reference: "잠언 3:5", category: 'scripture' },
    { title: "새 힘을 얻으리라", body: "오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요", reference: "이사야 40:31", category: 'scripture' },
    { title: "모든 것이 합력하여", body: "우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라", reference: "로마서 8:28", category: 'scripture' },
    { title: "평안을 너희에게", body: "평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라", reference: "요한복음 14:27", category: 'scripture' },
    { title: "항상 기뻐하라", body: "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라", reference: "데살로니가전서 5:16-18", category: 'scripture' },
    { title: "내가 세상 끝날까지", body: "볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라", reference: "마태복음 28:20", category: 'scripture' },
    { title: "내 은혜가 네게 족하다", body: "내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라", reference: "고린도후서 12:9", category: 'scripture' },
    { title: "여호와는 나의 목자시니", body: "여호와는 나의 목자시니 내가 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며", reference: "시편 23:1-2", category: 'scripture' },
    { title: "사랑의 하나님", body: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라", reference: "요한복음 3:16", category: 'scripture' },
    { title: "범사에 형통하리라", body: "이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하라 그리하면 네 길이 평탄하게 될 것이며 형통하리라", reference: "여호수아 1:8", category: 'scripture' },
    { title: "새 아침의 은혜", body: "여호와의 인자와 긍휼이 무궁하시도다 이것들이 아침마다 새로우니 주의 성실하심이 크시도다", reference: "예레미야 애가 3:22-23", category: 'scripture' },
    { title: "주에게 맡기라", body: "너의 짐을 여호와께 맡겨 버리라 그가 너를 붙드시리니 의인의 요동함을 영원히 허락하지 아니하시리로다", reference: "시편 55:22", category: 'scripture' },
    { title: "강하고 담대하라", body: "내가 네게 명한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라", reference: "여호수아 1:9", category: 'scripture' },
    { title: "주 안에서 기뻐하라", body: "주 안에서 항상 기뻐하라 내가 다시 말하노니 기뻐하라", reference: "빌립보서 4:4", category: 'scripture' },
    { title: "눌린 자를 일으키시는", body: "여호와께서 넘어지는 모든 자를 붙드시며 구부러진 모든 자를 펴 세우시는도다", reference: "시편 145:14", category: 'scripture' },
    { title: "주의 말씀은 등불이라", body: "주의 말씀은 내 발에 등이요 내 길에 빛이니이다", reference: "시편 119:105", category: 'scripture' },
    { title: "구하라 주실 것이요", body: "구하라 그러하면 너희에게 주실 것이요 찾으라 그러하면 찾을 것이요 문을 두드리라 그러하면 너희에게 열릴 것이니", reference: "마태복음 7:7", category: 'scripture' },
    { title: "쉬지 말고 기도하라", body: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라", reference: "빌립보서 4:6", category: 'scripture' },
    { title: "지치지 않는 사랑", body: "내가 확신하노니 사망이나 생명이나 천사들이나 높음이나 깊음이나 다른 아무 피조물이라도 우리를 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라", reference: "로마서 8:38-39", category: 'scripture' },
    { title: "너를 지키시는 분", body: "너를 지키시는 이가 졸지 아니하시리로다 이스라엘을 지키시는 이는 졸지도 아니하고 주무시지도 아니하시리로다", reference: "시편 121:3-4", category: 'scripture' },
    { title: "선한 일을 시작하신 이", body: "너희 안에서 착한 일을 시작하신 이가 그리스도 예수의 날까지 이루실 줄을 우리가 확신하노라", reference: "빌립보서 1:6", category: 'scripture' },
    { title: "땅끝까지 이르러", body: "오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅끝까지 이르러 내 증인이 되리라", reference: "사도행전 1:8", category: 'scripture' },
    { title: "참된 자유", body: "그러므로 아들이 너희를 자유롭게 하면 너희가 참으로 자유로우리라", reference: "요한복음 8:36", category: 'scripture' },
    { title: "소망의 하나님", body: "소망의 하나님이 모든 기쁨과 평강을 믿음 안에서 너희에게 충만하게 하사 성령의 능력으로 소망이 넘치게 하시기를 원하노라", reference: "로마서 15:13", category: 'scripture' },
    { title: "내 양은 내 음성을", body: "내 양은 내 음성을 들으며 나는 그들을 알며 그들은 나를 따르느니라 내가 그들에게 영생을 주노니 영원히 멸망하지 아니할 것이요", reference: "요한복음 10:27-28", category: 'scripture' },
    { title: "감사의 노래", body: "감사함으로 그의 문에 들어가며 찬송함으로 그의 궁정에 들어가서 그에게 감사하며 그의 이름을 송축할지어다", reference: "시편 100:4", category: 'scripture' },
    { title: "십자가의 사랑", body: "우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라", reference: "로마서 5:8", category: 'scripture' },
    { title: "회복하시는 하나님", body: "모든 은혜의 하나님 곧 그리스도 안에서 너희를 부르사 자기의 영원한 영광에 들어가게 하신 이가 잠깐 고난을 받은 너희를 친히 온전하게 하시며", reference: "베드로전서 5:10", category: 'scripture' },
    { title: "걱정하지 말라", body: "너희 중에 누가 염려함으로 그 키를 한 자라도 더할 수 있느냐 그런즉 먼저 그의 나라와 그의 의를 구하라", reference: "마태복음 6:27,33", category: 'scripture' },
    { title: "날마다 새로운 은혜", body: "외면은 낡아가나 우리의 내면은 날로 새로워지도다", reference: "고린도후서 4:16", category: 'scripture' },
    { title: "주의 도를 가르치소서", body: "여호와여 주의 도를 내게 가르치소서 내가 주의 진리에 행하오리니 일심으로 주의 이름을 경외하게 하소서", reference: "시편 86:11", category: 'scripture' },
    { title: "증거의 기쁨", body: "주의 증거들은 내가 영원히 기업으로 삼았사오니 이는 내 마음의 즐거움이 됨이니이다", reference: "시편 119:111", category: 'scripture' },
    { title: "시련 속의 은혜", body: "사랑하는 자들아 너희를 시련하려고 오는 불시험을 이상한 일이 일어난 것 같이 놀라지 말고", reference: "베드로전서 4:12", category: 'scripture' },
    { title: "창조주의 사랑", body: "야곱아 이제 여호와께서 말씀하시느니라 너를 창조하신 여호와께서 말씀하시느니라 두려워하지 말라 내가 너를 구속하였고 내가 너를 지명하여 불렀나니 너는 내 것이라", reference: "이사야 43:1", category: 'scripture' },
    { title: "빛 되신 주님", body: "예수께서 또 말씀하여 이르시되 나는 세상의 빛이니 나를 따르는 자는 어둠에 다니지 아니하고 생명의 빛을 얻으리라", reference: "요한복음 8:12", category: 'scripture' },
    { title: "무한한 용서", body: "만일 우리가 우리 죄를 자백하면 그는 미쁘시고 의로우사 우리 죄를 사하시며 우리를 모든 불의에서 깨끗하게 하실 것이요", reference: "요한일서 1:9", category: 'scripture' },
    { title: "선한 싸움의 승리", body: "나는 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니 이제 후로는 나를 위하여 의의 면류관이 예비되었으매", reference: "디모데후서 4:7-8", category: 'scripture' },
    { title: "영원한 생명의 말씀", body: "주여 영생의 말씀이 주께 있사오니 우리가 누구에게로 가오리이까", reference: "요한복음 6:68", category: 'scripture' },
    { title: "굳건한 반석", body: "여호와는 나의 반석이시요 나의 요새시요 나를 건지시는 이시요 나의 하나님이시요 내가 그 안에 피할 나의 바위시요", reference: "시편 18:2", category: 'scripture' },
];

// ====== Streak / Motivation Messages ======
function getStreakMessages(streak: number): EncouragementMessage[] {
    if (streak === 0) return [
        { title: "오늘부터 시작해요!", body: "천 리 길도 한 걸음부터. 오늘 말씀 한 구절이 내일의 은혜가 됩니다.", category: 'streak' },
        { title: "새로운 출발", body: "괜찮아요, 오늘 다시 시작하면 됩니다. 하나님은 새 날마다 새 은혜를 주십니다.", category: 'streak' },
    ];
    if (streak < 3) return [
        { title: `${streak}일째 읽고 있어요!`, body: "좋은 시작이에요! 꾸준함이 결국 큰 변화를 만듭니다. 함께 걸어가요.", category: 'streak' },
    ];
    if (streak < 7) return [
        { title: `벌써 ${streak}일 연속!`, body: "멋져요! 습관이 만들어지고 있어요. 7일 연속을 향해 달려보세요! 🎯", category: 'streak' },
    ];
    if (streak < 14) return [
        { title: `🔥 ${streak}일 연속 달성!`, body: "대단해요! 말씀 읽기가 자연스러운 습관이 되어가고 있어요. 계속 가볼까요?", category: 'streak' },
    ];
    if (streak < 30) return [
        { title: `🏅 ${streak}일째 말씀과 함께!`, body: "놀라워요! 이 정도 꾸준함이면 무엇이든 이룰 수 있어요. 30일 챌린지에 도전!", category: 'streak' },
    ];
    if (streak < 60) return [
        { title: `💎 ${streak}일 연속 — 경이로워요!`, body: "한 달 이상 쉬지 않고 말씀을 묵상하고 있어요. 당신의 믿음에 감동받아요.", category: 'streak' },
    ];
    if (streak < 100) return [
        { title: `👑 ${streak}일 연속 — 전설의 시작!`, body: "이것은 참된 헌신입니다. 100일의 문턱에 서 있어요. 역사를 만들고 있어요!", category: 'streak' },
    ];
    return [
        { title: `🌟 ${streak}일 연속 — 살아있는 전설!`, body: "경이로운 기록! 당신의 말씀 사랑이 하나님을 기쁘시게 합니다.", category: 'streak' },
    ];
}

// ====== Milestone Messages ======
function getMilestoneMessages(progressPercent: number): EncouragementMessage[] {
    if (progressPercent >= 90) return [
        { title: "🏆 거의 다 왔어요!", body: `${progressPercent}% 완료! 성경 완독이 눈앞이에요. 마지막까지 함께해요!`, category: 'milestone' },
    ];
    if (progressPercent >= 75) return [
        { title: "🎯 75% 돌파!", body: `${progressPercent}% 완료! 4분의 3을 넘었어요. 이 기세로 완주해봐요!`, category: 'milestone' },
    ];
    if (progressPercent >= 50) return [
        { title: "🎉 절반 정복!", body: `${progressPercent}% 완료! 성경의 절반을 읽었어요. 나머지 반도 함께해요!`, category: 'milestone' },
    ];
    if (progressPercent >= 25) return [
        { title: "📖 25% 달성!", body: `${progressPercent}% 완료! 꾸준히 나아가고 있어요. 잘하고 있어요!`, category: 'milestone' },
    ];
    return [];
}

// ====== Time-of-Day Messages ======
function getTimeMessages(): EncouragementMessage[] {
    const hour = new Date().getHours();
    if (hour < 6) return [
        { title: "🌙 새벽을 깨우는 말씀", body: "새벽에 말씀을 찾는 당신, 독수리 같이 올라가리라! 이 시간 하나님과의 교제는 특별합니다.", category: 'personal' },
    ];
    if (hour < 9) return [
        { title: "☀️ 좋은 아침이에요!", body: "하루의 시작을 말씀으로 여는 습관, 오늘 하루도 은혜로 충만하길 기도합니다.", category: 'personal' },
    ];
    if (hour < 12) return [
        { title: "🌤️ 오전의 말씀 시간", body: "바쁜 오전 시간을 내어 말씀을 읽는 당신의 마음이 아름답습니다.", category: 'personal' },
    ];
    if (hour < 18) return [
        { title: "🌅 오후의 쉼", body: "하루의 중간에서 말씀으로 재충전하세요. 남은 하루도 힘있게!", category: 'personal' },
    ];
    if (hour < 22) return [
        { title: "🌙 저녁의 묵상", body: "하루를 마무리하며 말씀으로 쉬어가세요. 오늘 하루도 감사한 하루였어요.", category: 'personal' },
    ];
    return [
        { title: "🌟 밤의 기도", body: "늦은 밤의 말씀 묵상, 고요한 시간에 하나님의 음성이 더 가까이 들립니다.", category: 'personal' },
    ];
}

// ====== Day-of-Week Messages ======
function getDayMessages(): EncouragementMessage[] {
    const day = new Date().getDay();
    if (day === 0) return [
        { title: "🙏 주일 복된 하루", body: "주일 예배와 함께 말씀을 묵상하는 복된 시간을 보내세요.", category: 'personal' },
    ];
    if (day === 6) return [
        { title: "🌿 안식의 토요일", body: "한 주의 마무리, 말씀 속에서 참된 안식을 찾아보세요.", category: 'personal' },
    ];
    return [];
}

// ====== Main Selector ======
export function selectEncouragement(
    streak: number,
    progressPercent: number,
    dayOfYear: number
): EncouragementMessage {
    // Priority: streak milestones > progress milestones > time-based > scripture rotation
    const streakMsgs = getStreakMessages(streak);
    const milestoneMsgs = getMilestoneMessages(progressPercent);
    const timeMsgs = getTimeMessages();
    const dayMsgs = getDayMessages();

    // Mix based on day to keep variety
    const specialPool = [...streakMsgs, ...milestoneMsgs, ...timeMsgs, ...dayMsgs];

    // 60% chance to show context-aware, 40% scripture rotation
    const hash = (dayOfYear * 31 + streak * 7 + new Date().getHours()) % 100;
    if (hash < 60 && specialPool.length > 0) {
        return specialPool[dayOfYear % specialPool.length];
    }

    // Scripture rotation based on day of year
    return SCRIPTURE_MESSAGES[dayOfYear % SCRIPTURE_MESSAGES.length];
}

// ====== Time-based gradient ======
export function getTimeGradient(): string {
    const hour = new Date().getHours();
    if (hour < 6) return "from-violet-500/10 via-indigo-500/10 to-purple-500/10";
    if (hour < 9) return "from-amber-500/10 via-orange-500/10 to-yellow-500/10";
    if (hour < 12) return "from-sky-500/10 via-blue-500/10 to-cyan-500/10";
    if (hour < 18) return "from-emerald-500/10 via-teal-500/10 to-green-500/10";
    if (hour < 22) return "from-indigo-500/10 via-purple-500/10 to-pink-500/10";
    return "from-slate-500/10 via-blue-500/10 to-indigo-500/10";
}

export function getTimeBorderColor(): string {
    const hour = new Date().getHours();
    if (hour < 6) return "border-violet-500/20";
    if (hour < 9) return "border-amber-500/20";
    if (hour < 12) return "border-sky-500/20";
    if (hour < 18) return "border-emerald-500/20";
    if (hour < 22) return "border-indigo-500/20";
    return "border-slate-500/20";
}
