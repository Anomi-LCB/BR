const fs = require('fs');
const path = require('path');
const axios = require('axios');
const iconv = require('iconv-lite');

// Enhanced grammar markers for Semantic line breaking
const strongEndings = [
    '다', '라', '세', '네', '서', '며', '도다', '로다', '소서', '옵소서', '어라', '아라', '지라', '까', '요', '아', '여', '야',
    '치라', '마라', '리라'
];

const normalEndings = [
    '고', '니', '게', '자', '면', '어', '지',
    '은', '는', '을', '를', '이', '가',
    '에', '로', '으로', '에서', '과', '와', '도', '만', '께', '에게', '로서', '로서의',
    '인', '신', '할', '한', '던', '음', '기', '것', '들', '의'
];

// List of words that should strongly NOT end a line (unattached bare nouns, short prefixes that must attach to the next word)
const neverEndings = [
    '그', '이', '저', '내', '네', '오', '참', '늘', '늘', '곧', '다', '큰', '새', '온', '만', '뭇', '두', '세', '첫',
    '주', '죄', '뜻', '피', '몸', '맘', '길', '물', '빛', '해', '달', '별', '땅', '하늘', '영', '혼'
];

function fixTypos(text) {
    // HolyBible has many merged words which confuse the DP line breaks.
    let t = text;
    t = t.replace(/일어나다 힘을/g, '일어나 다 힘을');
    t = t.replace(/마귀를다쳐서/g, '마귀를 다 쳐서');
    t = t.replace(/마귀를 다쳐서/g, '마귀를 다 쳐서');
    t = t.replace(/온세상이기네/g, '온 세상 이기네');
    t = t.replace(/믿는힘으로/g, '믿는 힘으로');
    t = t.replace(/온인류마귀/g, '온 인류 마귀');
    t = t.replace(/궤휼로큰/g, '궤휼로 큰');
    t = t.replace(/빠지니진리로/g, '빠지니 진리로');
    t = t.replace(/기도드리세/g, '기도 드리세');
    t = t.replace(/겁없이/g, '겁 없이');
    t = t.replace(/이긴자에게/g, '이긴 자에게');
    t = t.replace(/흰옷을입히고/g, '흰옷을 입히고');
    t = t.replace(/영생복을/g, '영생 복을');
    t = t.replace(/기쁜일일세/g, '기쁜 일일세');
    return t;
}

function formatVerse(verseText) {
    let text = fixTypos(verseText);

    let hasAmen = false;
    if (text.endsWith(' 아멘')) {
        hasAmen = true;
        text = text.substring(0, text.length - 3).trim();
    }
    if (text.endsWith('아멘')) {
        hasAmen = true;
        text = text.substring(0, text.length - 2).trim();
    }

    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length <= 3) return text + (hasAmen ? "\n아멘" : "");

    const totalChars = tokens.reduce((a, t) => a + t.length, 0) + tokens.length - 1;
    let K = Math.max(1, Math.round(totalChars / 12));
    if (K > tokens.length) K = tokens.length;

    // Meter typically is 4 lines per standard verse (e.g. 16 ~ 24 tokens)
    if (tokens.length >= 8 && tokens.length <= 22) K = 4;
    else if (tokens.length > 22 && tokens.length <= 32) K = 6;
    else K = Math.max(3, Math.round(tokens.length / 4));

    let targetLen = totalChars / K;

    let dp = Array(K + 1).fill(0).map(() => Array(tokens.length + 1).fill(Infinity));
    let parent = Array(K + 1).fill(0).map(() => Array(tokens.length + 1).fill(-1));
    dp[0][0] = 0;

    for (let k = 1; k <= K; k++) {
        for (let i = 1; i <= tokens.length; i++) {
            for (let j = k - 1; j < i; j++) {
                let len = 0;
                for (let t = j; t < i; t++) len += tokens[t].length;
                len += (i - j - 1);

                let lengthCost = Math.pow(Math.abs(len - targetLen), 2.5);
                let lastToken = tokens[i - 1];
                let lastChar = lastToken[lastToken.length - 1];
                let lastTwo = lastToken.length > 1 ? lastToken.substring(lastToken.length - 2) : "";
                let lastThree = lastToken.length > 2 ? lastToken.substring(lastToken.length - 3) : "";

                let cost = lengthCost;

                if (neverEndings.includes(lastToken)) {
                    cost *= 100.0; // STRICTLY FORBID
                } else if (strongEndings.includes(lastChar) || strongEndings.includes(lastTwo) || strongEndings.includes(lastThree)) {
                    cost *= 0.05; // Perfect breaks
                } else if (normalEndings.includes(lastChar) || normalEndings.includes(lastTwo)) {
                    cost *= 0.3; // Preferable breaks
                } else {
                    cost *= 5.0; // Bad breaks (e.g. "죄", "주")
                }

                if (dp[k - 1][j] + cost < dp[k][i]) {
                    dp[k][i] = dp[k - 1][j] + cost;
                    parent[k][i] = j;
                }
            }
        }
    }

    let result = [];
    let currIdx = tokens.length;
    for (let k = K; k >= 1; k--) {
        let prevIdx = parent[k][currIdx];
        if (prevIdx === -1) return verseText + (hasAmen ? "\n아멘" : "");
        result.unshift(tokens.slice(prevIdx, currIdx).join(' '));
        currIdx = prevIdx;
    }

    if (hasAmen) result.push("아멘");
    return result.join('\n');
}

async function scrapeAndFormat() {
    console.log("Generating 645 Hymns with Advanced Semantic DP Formatting...");
    const hymnsList = [];
    const maxHymn = 645;

    for (let i = 1; i <= maxHymn; i++) {
        try {
            const url = `http://www.holybible.or.kr/NHYMN/cgi/hymnftxt.php?VR=NHYMN&DN=${i}`;
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 5000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const html = iconv.decode(response.data, 'euc-kr');

            let titleMatch = html.match(/<b[^>]*>\s*(\d+\.\s*(.*?))\s*<\/b>/i);
            let rawTitle = titleMatch ? titleMatch[2] : `새찬송가 ${i}장`;
            let title = rawTitle.replace(/<[^>]*>/g, '').trim();

            let startIndex = html.indexOf(titleMatch ? titleMatch[1] : `${i}.`);
            if (startIndex === -1) {
                hymnsList.push({ id: i, title, lyrics: "가사를 불러올 수 없습니다." });
                continue;
            }

            let endIndex1 = html.indexOf('이전장', startIndex);
            let endIndex2 = html.indexOf('새찬송가 듣기', startIndex);
            let endIndex = html.indexOf('</table', startIndex);
            if (endIndex1 !== -1 && endIndex1 < endIndex) endIndex = endIndex1;
            if (endIndex2 !== -1 && endIndex2 < endIndex) endIndex = endIndex2;

            let extractedHtml = html.substring(startIndex, endIndex);
            if (titleMatch) extractedHtml = extractedHtml.replace(titleMatch[0], '');

            let text = extractedHtml.replace(/<br\s*\/?>/gi, '\n');
            text = text.replace(/<[^>]+>/g, '');
            text = text.replace(/\[.*?\]/g, '');

            let lines = text.split('\n')
                .map(l => l.trim().replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ').trim())
                .filter(l => l.length > 0 && l !== '♬악보');

            let formattedParts = [];
            let pendingVerseNum = null;

            for (let j = 0; j < lines.length; j++) {
                let cl = lines[j];

                if (cl === '이전' || cl.startsWith('이전 ') || cl === '다음' || cl === '새찬송가' || cl === '장' || cl === '. . .') break;
                if (cl.includes('본 사이트에 사용한') || cl.includes('저작권은') || cl.includes('약정에 의해')) break;
                if (cl === title || cl === `${i}. ${title}`) continue;

                let pureNumMatch = cl.match(/^(\d+)\.$/);
                if (pureNumMatch) {
                    let num = parseInt(pureNumMatch[1]);
                    if (num < 15) pendingVerseNum = num;
                    continue;
                }

                let inlineMatch = cl.match(/^(\d+)\.\s*(.*)/);
                if (inlineMatch) {
                    let num = parseInt(inlineMatch[1]);
                    let content = inlineMatch[2].trim();
                    if (num < 15) {
                        if (formattedParts.length > 0) formattedParts.push("");
                        formattedParts.push(`[${num}절]`);
                        if (content) formattedParts.push(formatVerse(content));
                    } else {
                        formattedParts.push(formatVerse(cl));
                    }
                    continue;
                }

                if (pendingVerseNum !== null) {
                    if (formattedParts.length > 0) formattedParts.push("");
                    formattedParts.push(`[${pendingVerseNum}절]`);
                    formattedParts.push(formatVerse(cl));
                    pendingVerseNum = null;
                    continue;
                }

                if (cl.match(/^\d+$/)) continue; // ignore lonely stray numbers

                formattedParts.push(formatVerse(cl));
            }

            let finalLyrics = formattedParts.join('\n').trim();

            hymnsList.push({
                id: i,
                title: title,
                lyrics: finalLyrics || "가사를 불러올 수 없습니다."
            });

            await new Promise(r => setTimeout(r, 10)); // Be nice to the server
        } catch (e) {
            hymnsList.push({ id: i, title: `새찬송가 ${i}장`, lyrics: "가사를 불러올 수 없습니다." });
        }
    }

    const outputPath = path.join(__dirname, '..', 'src', 'data', 'hymns.json');
    fs.writeFileSync(outputPath, JSON.stringify(hymnsList, null, 2), 'utf-8');
    console.log(`Successfully completed 645 hymns with advanced semantic formatting!`);
}

scrapeAndFormat();
