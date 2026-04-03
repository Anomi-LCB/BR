const text = "주 믿는 사람 일어나 다 힘을 합하여 이 세상 모든 마귀를 다쳐서 멸하세 저 앞에 오는 적군을 다 싸워 이겨라 주 예수 믿는 힘으로 온세상이기네";

const strongEndings = [
    '다', '라', '세', '네', '서', '며', '도다', '로다', '소서', '옵소서', '어라', '아라', '지라', '까', '요', '아', '여', '야'
];

const normalEndings = [
    '고', '니', '게', '자', '면', '어', '지',
    '은', '는', '을', '를', '이', '가',
    '에', '로', '으로', '에서', '과', '와', '도', '만',
    '인', '신', '할', '한', '던', '음', '기', '것'
];

function formatVerse(verseText) {
    const tokens = verseText.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length <= 3) return verseText;

    const totalChars = tokens.reduce((a, t) => a + t.length, 0) + tokens.length - 1;
    let K = Math.max(1, Math.round(totalChars / 14));
    if (K > tokens.length) K = tokens.length;
    let targetLen = totalChars / K;

    // Hymns generally prefer 4 lines for short ones, else dynamic
    if (tokens.length >= 8 && tokens.length <= 20) K = 4;
    else if (tokens.length > 20 && tokens.length <= 32) K = 8;
    else K = Math.round(tokens.length / 4);

    targetLen = totalChars / K;

    let dp = Array(K + 1).fill(0).map(() => Array(tokens.length + 1).fill(Infinity));
    let parent = Array(K + 1).fill(0).map(() => Array(tokens.length + 1).fill(-1));
    dp[0][0] = 0;

    for (let k = 1; k <= K; k++) {
        for (let i = 1; i <= tokens.length; i++) {
            for (let j = k - 1; j < i; j++) {
                let len = 0;
                for (let t = j; t < i; t++) len += tokens[t].length;
                len += (i - j - 1);

                let lengthCost = Math.pow(Math.abs(len - targetLen), 2.5); // Increase penalty for being too long/short
                let lastToken = tokens[i - 1];
                let lastChar = lastToken[lastToken.length - 1];
                let lastTwo = lastToken.length > 1 ? lastToken.substring(lastToken.length - 2) : "";
                let lastThree = lastToken.length > 2 ? lastToken.substring(lastToken.length - 3) : "";

                let cost = lengthCost;

                if (strongEndings.includes(lastChar) || strongEndings.includes(lastTwo) || strongEndings.includes(lastThree)) {
                    cost *= 0.1;
                } else if (normalEndings.includes(lastChar)) {
                    cost *= 0.3;
                } else {
                    cost *= 5.0; // Heavily penalize breaking on non-endings
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
        if (prevIdx === -1) return verseText;
        result.unshift(tokens.slice(prevIdx, currIdx).join(' '));
        currIdx = prevIdx;
    }

    return result.join('\n');
}

console.log(formatVerse(text));
