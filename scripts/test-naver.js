const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const response = await axios.get('https://m.search.naver.com/search.naver?query=%EC%83%88%EC%B0%AC%EC%86%A1%EA%B0%80+250%EC%9E%A5+%EA%B0%80%EC%82%AC', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)'
            }
        });
        const $ = cheerio.load(response.data);
        console.log("HTML length:", response.data.length);

        // Find lyrics container
        let lyrics = $('.text_expand.text_center').text() || $('.intro_box p').text() || $('.cm_content_area').text();
        console.log("Found text length:", lyrics.length);
        console.log(lyrics.substring(0, 500));

        // Let's try to get exactly where the text is using standard block queries
        const htmlStr = response.data;
        let p1 = htmlStr.indexOf('구주의 십자가 보혈로');
        if (p1 !== -1) {
            console.log("Snippet around exact match:", htmlStr.substring(p1 - 100, p1 + 500));
        }

    } catch (e) {
        console.error(e.message);
    }
}
test();
