const axios = require('axios');
const iconv = require('iconv-lite');

async function test357() {
    const response = await axios.get(`http://www.holybible.or.kr/NHYMN/cgi/hymnftxt.php?VR=NHYMN&DN=357`, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = iconv.decode(response.data, 'euc-kr');

    let titleMatch = html.match(/<b[^>]*>\s*(\d+\.\s*(.*?))\s*<\/b>/i);
    let titleContent = titleMatch ? titleMatch[0] : "";
    let rawTitle = titleMatch ? titleMatch[2] : "";
    let title = rawTitle.replace(/<[^>]*>/g, '').trim();

    let startIndex = html.indexOf(titleMatch ? titleMatch[1] : `357.`);
    let endIndex = html.indexOf('</table', startIndex);

    let extractedHtml = html.substring(startIndex, endIndex);
    if (titleContent) extractedHtml = extractedHtml.replace(titleContent, '');

    let text = extractedHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '');
    let lines = text.split('\n').map(l => l.trim().replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length > 0 && l !== '♬악보');

    console.log("Raw lines:", lines);
}
test357();
