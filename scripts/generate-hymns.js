const axios = require('axios');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');

const goodEndings = ['다', '여', '고', '니', '라', '세', '네', '서', '며', '까', '요', '아', '게', '옵소서', '소서', '지라', '도다', '을', '를', '은', '는'];
const strongEndings = ['다', '라', '세', '네', '서', '며', '도다', '소서'];

function formatVerse(verseText) {
    let hasAmen = false;
    if (verseText.endsWith(' 아멘')) {
        hasAmen = true;
        verseText = verseText.substring(0, verseText.length - 3).trim();
    }
    if (verseText.endsWith('아멘')) {
        hasAmen = true;
        verseText = verseText.substring(0, verseText.length - 2).trim();
    }

    const tokens = verseText.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length <= 3) return verseText + (hasAmen ? "\n아멘" : "");

    const totalChars = tokens.reduce((a, t) => a + t.length, 0) + tokens.length - 1;
    let K = Math.max(1, Math.round(totalChars / 15));
    if (K > tokens.length) K = tokens.length;
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

                let cost = Math.pow(Math.abs(len - targetLen), 2);
                let lastToken = tokens[i - 1];
                let lastChar = lastToken[lastToken.length - 1];
                let lastTwo = lastToken.length > 1 ? lastToken.substring(lastToken.length - 2) : "";
                let lastThree = lastToken.length > 2 ? lastToken.substring(lastToken.length - 3) : "";

                if (strongEndings.includes(lastChar) || strongEndings.includes(lastTwo) || strongEndings.includes(lastThree)) {
                    cost *= 0.3;
                } else if (goodEndings.includes(lastChar)) {
                    cost *= 0.7;
                } else {
                    cost *= 1.5;
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
    console.log("Generating 645 Hymns with DP Formatting (Perfect BugFixed)...");
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

                // break conditions
                if (cl === '이전' || cl.startsWith('이전 ') || cl === '다음' || cl === '새찬송가' || cl === '장' || cl === '. . .') break;
                if (cl.includes('본 사이트에 사용한') || cl.includes('저작권은') || cl.includes('약정에 의해')) break;

                // Ignore plain title or ID headers at top
                if (cl === title || cl === `${i}. ${title}`) continue;

                // check if it's just a number
                let pureNumMatch = cl.match(/^(\d+)\.$/);
                if (pureNumMatch) {
                    let num = parseInt(pureNumMatch[1]);
                    if (num < 15) { // real verse number
                        pendingVerseNum = num;
                    }
                    continue;
                }

                // check if it's a number with verse text
                let inlineMatch = cl.match(/^(\d+)\.\s*(.*)/);
                if (inlineMatch) {
                    let num = parseInt(inlineMatch[1]);
                    let content = inlineMatch[2].trim();
                    if (num < 15) {
                        if (formattedParts.length > 0) formattedParts.push("");
                        formattedParts.push(`[${num}절]`);
                        if (content) formattedParts.push(formatVerse(content));
                    } else {
                        // random large number like 357.
                        formattedParts.push(formatVerse(cl));
                    }
                    continue;
                }

                // if it's content after a pending verse number
                if (pendingVerseNum !== null) {
                    if (formattedParts.length > 0) formattedParts.push("");
                    formattedParts.push(`[${pendingVerseNum}절]`);
                    formattedParts.push(formatVerse(cl));
                    pendingVerseNum = null;
                    continue; // Skip appending again
                }

                // ignore any lonely stray numbers
                if (cl.match(/^\d+$/)) continue;

                // regular text
                formattedParts.push(formatVerse(cl));
            }

            let finalLyrics = formattedParts.join('\n').trim();

            hymnsList.push({
                id: i,
                title: title,
                lyrics: finalLyrics || "가사를 불러올 수 없습니다."
            });

            await new Promise(r => setTimeout(r, 20));
        } catch (e) {
            hymnsList.push({ id: i, title: `새찬송가 ${i}장`, lyrics: "가사를 불러올 수 없습니다." });
        }
    }

    const outputPath = path.join(__dirname, '..', 'src', 'data', 'hymns.json');
    fs.writeFileSync(outputPath, JSON.stringify(hymnsList, null, 2), 'utf-8');
    console.log(`Successfully completed 645 hymns!`);
}

scrapeAndFormat();
