import { bibleDB } from './bible-db';

export interface BibleVerse {
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface BibleChapter {
    reference: string;
    version: 'KRV' | 'RNKSV' | 'NIV' | 'NLT';
    verses: BibleVerse[];
}

export const BibleService = {
    getChapterContent: async (range: string, version: 'KRV' | 'RNKSV' | 'NIV' | 'NLT' = 'KRV'): Promise<BibleChapter> => {
        let bookName = range;
        let startChapter = 1;
        let endChapter = 1;

        const match = range.match(/([가-힣0-9a-zA-Z\s]+?)\s*(\d+)(?:-(\d+))?(?:장|편|절)?/);
        if (match) {
            bookName = match[1].trim();
            startChapter = parseInt(match[2], 10);
            if (match[3]) {
                endChapter = parseInt(match[3], 10);
            } else {
                endChapter = startChapter;
            }
        }

        const allVerses: BibleVerse[] = [];
        const targetVersion = version === 'RNKSV' ? 'KRV' : version;

        // Ensure version is indexed from local JSON if it's KRV and missing
        if (targetVersion === 'KRV') {
            const hasData = await bibleDB.hasVersion('KRV');
            if (!hasData) {
                console.log("Seeding KRV Bible from local JSON...");
                try {
                    const response = await fetch('/data/bible-krv.json');
                    if (response.ok) {
                        const allVersesData = await response.json();
                        // Group by book and chapter
                        const grouped: Record<string, string[]> = {};
                        allVersesData.forEach((v: any) => {
                            const id = `${targetVersion}_${v.book}_${v.chapter}`;
                            if (!grouped[id]) grouped[id] = [];
                            grouped[id].push(v.text);
                        });

                        // Batch save to IndexedDB
                        for (const [id, verseTexts] of Object.entries(grouped)) {
                            const [v, b, c] = id.split('_');
                            await bibleDB.saveChapter(v, b, parseInt(c), verseTexts);
                        }
                        console.log("KRV Bible Seeded successfully.");
                    }
                } catch (e) {
                    console.error("Failed to seed KRV from local JSON", e);
                }
            }
        }

        const fetchPromises = [];

        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            fetchPromises.push((async () => {
                let chapterVersesText = await bibleDB.getChapter(targetVersion, bookName, chapter);

                // Cache invalidation: If the cached data is mock data (cache poisoned), force a refetch
                if (chapterVersesText && chapterVersesText[0] && chapterVersesText[0].includes('[DB 접근지연]')) {
                    chapterVersesText = null;
                }

                if (!chapterVersesText) {
                    chapterVersesText = await fetchChapterFromRemote(bookName, chapter, targetVersion);

                    // Only cache real data, never cache mock data
                    if (chapterVersesText && chapterVersesText.length > 0 && !chapterVersesText[0].includes('[DB 접근지연]')) {
                        try {
                            await bibleDB.saveChapter(targetVersion, bookName, chapter, chapterVersesText);
                        } catch (e) {
                            console.warn("Failed to cache chapter to IndexedDB", e);
                        }
                    }
                }

                return chapterVersesText.map((text, idx) => ({
                    book: bookName,
                    chapter: chapter,
                    verse: idx + 1,
                    text: text
                }));
            })());
        }

        const results = await Promise.all(fetchPromises);
        results.forEach(verses => allVerses.push(...verses));

        return {
            reference: range,
            version,
            verses: allVerses
        };
    },

    prefetchAdjacent: async (currentBook: string, currentChapter: number, version: 'KRV' | 'RNKSV' | 'NIV' | 'NLT' = 'KRV') => {
        // Just silently load next chapter into cache
        try {
            const targetVersion = version === 'RNKSV' ? 'KRV' : version;
            const nextChapter = currentChapter + 1;
            let exists = await bibleDB.getChapter(targetVersion, currentBook, nextChapter);

            // Invalidate corrupted cache
            if (exists && exists[0] && exists[0].includes('[DB 접근지연]')) {
                exists = null;
            }

            if (!exists) {
                const chapterVersesText = await fetchChapterFromRemote(currentBook, nextChapter, targetVersion);
                if (chapterVersesText && chapterVersesText.length > 0 && !chapterVersesText[0].includes('[DB 접근지연]')) {
                    await bibleDB.saveChapter(targetVersion, currentBook, nextChapter, chapterVersesText);
                }
            }
        } catch (e) {
            // Ignore prefetch errors
        }
    },

    getAbbreviatedTitle: (references: string[]): string => {
        if (!references || references.length === 0) return "묵상";

        const chaptersMap = new Map<string, Set<number>>();
        for (const ref of references) {
            const match = ref.match(/([가-힣0-9a-zA-Z\s]+?)\s*(\d+)(?:-(\d+))?/);
            if (match) {
                const book = match[1].trim();
                const startChapter = parseInt(match[2], 10);
                const endChapter = match[3] ? parseInt(match[3], 10) : startChapter;
                if (!chaptersMap.has(book)) chaptersMap.set(book, new Set<number>());
                for (let c = startChapter; c <= endChapter; c++) {
                    chaptersMap.get(book)!.add(c);
                }
            }
        }

        const parts: string[] = [];
        for (const [book, chaptersSet] of Array.from(chaptersMap.entries())) {
            const isPsalm = book === '시편';
            const displayBook = isPsalm ? '시편' : (BIBLE_ABBR_MAP[book] || book.substring(0, 1));
            const suffix = isPsalm ? '편' : '장';

            const chapters = Array.from(chaptersSet).sort((a, b) => a - b);

            const ranges: string[] = [];
            let rangeStart = chapters[0];
            let prev = chapters[0];

            for (let i = 1; i < chapters.length; i++) {
                if (chapters[i] === prev + 1) {
                    prev = chapters[i];
                } else {
                    ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}~${prev}`);
                    rangeStart = chapters[i];
                    prev = chapters[i];
                }
            }
            ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}~${prev}`);

            parts.push(`${displayBook} ${ranges.join(', ')}${suffix}`);
        }

        return parts.length > 0 ? parts.join(', ') : "묵상";
    }
};

const KOR_BOOK_MAP: Record<string, string> = {
    '창세기': 'gen', '출애굽기': 'exo', '레위기': 'lev', '민수기': 'num', '신명기': 'deu',
    '여호수아': 'jos', '사사기': 'judg', '룻기': 'rut', '사무엘상': '1sa', '사무엘하': '2sa',
    '열왕기상': '1ki', '열왕기하': '2ki', '역대상': '1ch', '역대하': '2ch', '에스라': 'ezr',
    '느헤미야': 'neh', '에스더': 'est', '욥기': 'job', '시편': 'psa', '잠언': 'pro',
    '전도서': 'ecc', '아가': 'son', '이사야': 'isa', '예레미야': 'jer', '예레미야애가': 'lam',
    '에스겔': 'eze', '다니엘': 'dan', '호세아': 'hos', '요엘': 'joe', '아모스': 'amo',
    '오바댜': 'oba', '요나': 'jon', '미가': 'mic', '나훔': 'nah', '하박국': 'hab',
    '스바냐': 'zep', '학개': 'hag', '스가랴': 'zec', '말라기': 'mal',
    '마태복음': 'mat', '마가복음': 'mar', '누가복음': 'luk', '요한복음': 'joh', '사도행전': 'act',
    '로마서': 'rom', '고린도전서': '1co', '고린도후서': '2co', '갈라디아서': 'gal', '에베소서': 'eph',
    '빌립보서': 'phi', '골로새서': 'col', '데살로니가전서': '1th', '데살로니가후서': '2th',
    '디모데전서': '1ti', '디모데후서': '2ti', '디도서': 'tit', '빌레몬서': 'phm', '히브리서': 'heb',
    '야고보서': 'jas', '베드로전서': '1pe', '베드로후서': '2pe', '요한일서': '1jn', '요한이서': '2jn',
    '요한삼서': '3jn', '유다서': 'jud', '요한계시록': 'rev'
};

export const BIBLE_BOOKS = [
    { name: "창세기", chapters: 50, isNT: false }, { name: "출애굽기", chapters: 40, isNT: false }, { name: "레위기", chapters: 27, isNT: false },
    { name: "민수기", chapters: 36, isNT: false }, { name: "신명기", chapters: 34, isNT: false }, { name: "여호수아", chapters: 24, isNT: false },
    { name: "사사기", chapters: 21, isNT: false }, { name: "룻기", chapters: 4, isNT: false }, { name: "사무엘상", chapters: 31, isNT: false },
    { name: "사무엘하", chapters: 24, isNT: false }, { name: "열왕기상", chapters: 22, isNT: false }, { name: "열왕기하", chapters: 25, isNT: false },
    { name: "역대상", chapters: 29, isNT: false }, { name: "역대하", chapters: 36, isNT: false }, { name: "에스라", chapters: 10, isNT: false },
    { name: "느헤미야", chapters: 13, isNT: false }, { name: "에스더", chapters: 10, isNT: false }, { name: "욥기", chapters: 42, isNT: false },
    { name: "시편", chapters: 150, isNT: false }, { name: "잠언", chapters: 31, isNT: false }, { name: "전도서", chapters: 12, isNT: false },
    { name: "아가", chapters: 8, isNT: false }, { name: "이사야", chapters: 66, isNT: false }, { name: "예레미야", chapters: 52, isNT: false },
    { name: "예레미야애가", chapters: 5, isNT: false }, { name: "에스겔", chapters: 48, isNT: false }, { name: "다니엘", chapters: 12, isNT: false },
    { name: "호세아", chapters: 14, isNT: false }, { name: "요엘", chapters: 3, isNT: false }, { name: "아모스", chapters: 9, isNT: false },
    { name: "오바댜", chapters: 1, isNT: false }, { name: "요나", chapters: 4, isNT: false }, { name: "미가", chapters: 7, isNT: false },
    { name: "나훔", chapters: 3, isNT: false }, { name: "하박국", chapters: 3, isNT: false }, { name: "스바냐", chapters: 3, isNT: false },
    { name: "학개", chapters: 2, isNT: false }, { name: "스가랴", chapters: 14, isNT: false }, { name: "말라기", chapters: 4, isNT: false },
    { name: "마태복음", chapters: 28, isNT: true }, { name: "마가복음", chapters: 16, isNT: true }, { name: "누가복음", chapters: 24, isNT: true },
    { name: "요한복음", chapters: 21, isNT: true }, { name: "사도행전", chapters: 28, isNT: true }, { name: "로마서", chapters: 16, isNT: true },
    { name: "고린도전서", chapters: 16, isNT: true }, { name: "고린도후서", chapters: 13, isNT: true }, { name: "갈라디아서", chapters: 6, isNT: true },
    { name: "에베소서", chapters: 6, isNT: true }, { name: "빌립보서", chapters: 4, isNT: true }, { name: "골로새서", chapters: 4, isNT: true },
    { name: "데살로니가전서", chapters: 5, isNT: true }, { name: "데살로니가후서", chapters: 3, isNT: true }, { name: "디모데전서", chapters: 6, isNT: true },
    { name: "디모데후서", chapters: 4, isNT: true }, { name: "디도서", chapters: 3, isNT: true }, { name: "빌레몬서", chapters: 1, isNT: true },
    { name: "히브리서", chapters: 13, isNT: true }, { name: "야고보서", chapters: 5, isNT: true }, { name: "베드로전서", chapters: 5, isNT: true },
    { name: "베드로후서", chapters: 3, isNT: true }, { name: "요한일서", chapters: 5, isNT: true }, { name: "요한이서", chapters: 1, isNT: true },
    { name: "요한삼서", chapters: 1, isNT: true }, { name: "유다서", chapters: 1, isNT: true }, { name: "요한계시록", chapters: 22, isNT: true }
];

export const BIBLE_ABBR_MAP: Record<string, string> = {
    '창세기': '창', '출애굽기': '출', '레위기': '레', '민수기': '민', '신명기': '신',
    '여호수아': '수', '사사기': '삿', '룻기': '룻', '사무엘상': '삼상', '사무엘하': '삼하',
    '열왕기상': '왕상', '열왕기하': '왕하', '역대상': '대상', '역대하': '대하', '에스라': '스',
    '느헤미야': '느', '에스더': '에', '욥기': '욥', '시편': '시', '잠언': '잠',
    '전도서': '전', '아가': '아', '이사야': '사', '예레미야': '렘', '예레미야애가': '애',
    '에스겔': '겔', '다니엘': '단', '호세아': '호', '요엘': '욜', '아모스': '암',
    '오바댜': '옵', '요나': '욘', '미가': '미', '나훔': '나', '하박국': '합',
    '스바냐': '습', '학개': '학', '스가랴': '슥', '말라기': '말',
    '마태복음': '마', '마가복음': '막', '누가복음': '눅', '요한복음': '요', '사도행전': '행',
    '로마서': '롬', '고린도전서': '고전', '고린도후서': '고후', '갈라디아서': '갈', '에베소서': '엡',
    '빌립보서': '빌', '골로새서': '골', '데살로니가전서': '살전', '데살로니가후서': '살후',
    '디모데전서': '딤전', '디모데후서': '딤후', '디도서': '딛', '빌레몬서': '몬', '히브리서': '히',
    '야고보서': '약', '베드로전서': '벧전', '베드로후서': '벧후', '요한일서': '요일', '요한이서': '요이',
    '요한삼서': '요삼', '유다서': '유', '요한계시록': '계'
};

import { CapacitorHttp } from '@capacitor/core';

async function fetchChapterFromRemote(book: string, chapter: number, version: string): Promise<string[]> {
    const abbr = KOR_BOOK_MAP[book];
    const chapterLabel = book === '시편' ? '편' : '장';

    if (!abbr) return fallbackMock(book, chapter, version, chapterLabel);

    const langCode = version === 'KRV' ? 'kor' : 'eng-kjv';
    const originalUrl = `https://ibibles.net/quote.php?${langCode}-${abbr}/${chapter}:1-200`;

    try {
        let rawHtml = '';

        try {
            // Try Native Context (Bypasses CORS usually via plugin)
            const response = await CapacitorHttp.request({
                method: 'GET',
                url: originalUrl
            });
            rawHtml = response.data as string;

            // If native returns nothing/fails somewhat silently, fallback
            if (!rawHtml) throw new Error('Empty native response');
        } catch (nativeErr) {
            // Fallback to CORS proxy (mainly for dev web)
            console.log('Native HTTP failed or unavailable, using CORS proxy...', nativeErr);
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('Proxy Network error');
            rawHtml = await res.text();
        }

        const verses: string[] = [];
        const regex = /<small>\d+:\d+<\/small>(.*?)<br>/g;
        let match;

        while ((match = regex.exec(rawHtml)) !== null) {
            // Strip any remaining internal tags just in case
            let cleanText = match[1].replace(/<[^>]*>?/gm, '').trim();
            verses.push(cleanText);
        }

        if (verses.length > 0) {
            return verses;
        } else {
            return fallbackMock(book, chapter, version, chapterLabel);
        }
    } catch (e) {
        console.warn("Failed fetching from ibibles, using mock data", e);
        return fallbackMock(book, chapter, version, chapterLabel);
    }
}

function fallbackMock(book: string, chapter: number, version: string, chapterLabel: string): string[] {
    const verses: string[] = [];
    for (let i = 1; i <= 25; i++) {
        if (version === 'KRV') {
            verses.push(`[DB 접근지연] ${book} ${chapter}${chapterLabel} ${i}절 말씀입니다. (오프라인 캐싱 또는 네트워크 문제)`);
        } else {
            verses.push(`In the beginning God created the heavens and the earth. (${book} ${chapter}:${i})`);
        }
    }
    return verses;
}
