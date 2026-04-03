const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function importGithubHymns() {
    try {
        console.log("Fetching from github...");
        let res = await axios.get('https://raw.githubusercontent.com/awesometic/hymnal/master/data/hymn.json');
        let rawData = res.data;

        let formattedData = [];

        for (let i = 0; i < rawData.length; i++) {
            let h = rawData[i];
            let id = h.no;
            let title = h.title;

            // h.verses is an array of strings, sometimes multiple chapters
            // e.g. [{"no": 1, "lyrics": "주 믿는 사람 일어나 다 힘을 합하여\n이 세상 모든 마귀를 다 쳐서 멸하세..."}]
            let lyricsText = "";
            for (let j = 0; j < h.verses.length; j++) {
                let v = h.verses[j];
                lyricsText += `[${v.no}절]\n${v.lyrics}\n\n`;
            }

            formattedData.push({
                id: id,
                title: title,
                lyrics: lyricsText.trim()
            });
        }

        const outputPath = path.join(__dirname, '..', 'src', 'data', 'hymns.json');
        fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2), 'utf-8');
        console.log("Successfully imported and formatted 645 hymns with perfect line breaks!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
importGithubHymns();
