import pypdf
import re
import json
import os
from pathlib import Path

# 성경 권별 약어 매칭 (성경66권)
# PDF 파일명 형식 예: 1-01창세기.pdf, 2-01마태복음.pdf
BIBLE_BOOKS = [
    # 구약
    "창세기", "출애굽기", "레위기", "민수기", "신명기", "여호수아", "사사기", "룻기", "사무엘상", "사무엘하",
    "열왕기상", "열왕기하", "역대상", "역대하", "에스라", "느헤미야", "에스더", "욥기", "시편", "잠언",
    "전도서", "아가", "이사야", "예레미야", "예레미야애가", "에스겔", "다니엘", "호세아", "요엘", "아모스",
    "오바댜", "요나", "미가", "나훔", "하박국", "스바냐", "학개", "스가랴", "말라기",
    # 신약
    "마태복음", "마가복음", "누가복음", "요한복음", "사도행전", "로마서", "고린도전서", "고린도후서", "갈라디아서", "에베소서",
    "빌립보서", "골로새서", "데살로니가전서", "데살로니가후서", "디모데전서", "디모데후서", "디도서", "빌레몬서", "히브리서",
    "야고보서", "베드로전서", "베드로후서", "요한일서", "요한이서", "요한삼서", "유다서", "요한계시록"
]

# PDF 내부에서 사용되는 각 권의 정확한 약어 매핑
# 이 매핑을 사용하여 이전 절의 마지막 글자가 약어에 탐욕적으로 포함되는 것을 방지
BOOK_ABBR = {
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
}

def extract_verses_from_pdf(pdf_path, book_name):
    print(f"Extracting {book_name} from {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
    
    verses = []
    
    # 해당 책의 정확한 약어를 사용하여 절 시작점을 탐색
    # 이렇게 하면 이전 절의 마지막 한글이 약어에 포함되는 문제 방지
    abbr = BOOK_ABBR.get(book_name)
    if not abbr:
        print(f"  Warning: No abbreviation mapping for {book_name}, skipping")
        return []
    
    # 정확한 약어로만 매칭하는 패턴 (예: '창(\d+):(\d+)' 또는 '삼상(\d+):(\d+)')
    pattern = re.escape(abbr) + r'(\d+):(\d+)'
    verse_starts = list(re.finditer(pattern, full_text))
    
    if not verse_starts:
        print(f"  Warning: No verses found with abbreviation '{abbr}' for {book_name}")
        return []
    
    for i in range(len(verse_starts)):
        start_match = verse_starts[i]
        end_pos = verse_starts[i+1].start() if i+1 < len(verse_starts) else len(full_text)
        
        raw_segment = full_text[start_match.start():end_pos]
        
        # 헤더 정보 추출 (group(1)=장, group(2)=절 — 약어는 패턴에 포함되어 group 아님)
        chapter = int(start_match.group(1))
        verse_num = int(start_match.group(2))
        
        # 본문 추출 (헤더 제외)
        header_len = len(start_match.group(0))
        content = raw_segment[header_len:].strip()
        
        # 소제목 제거 (< > 형태)
        content = re.sub(r'<[^>]+>', '', content).strip()
        
        # 줄바꿈 및 불필요한 공백 정리 
        content = re.sub(r'\s+', ' ', content)
        
        verses.append({
            "book": book_name,
            "chapter": chapter,
            "verse": verse_num,
            "text": content
        })
        
    return verses

def main():
    pdf_dir = Path("개역개정-pdf")
    output_path = Path("bible-app/public/data/bible-krv.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    all_bible_data = []
    
    # 파일 목록 가져오기
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    for book in BIBLE_BOOKS:
        # 파일명에서 해당 성경 권수 찾기
        target_file = None
        for f in pdf_files:
            if book in f.name:
                target_file = f
                break
        
        if target_file:
            try:
                verses = extract_verses_from_pdf(target_file, book)
                all_bible_data.extend(verses)
                print(f"  - Extracted {len(verses)} verses")
            except Exception as e:
                print(f"  - Error extracting {book}: {e}")
        else:
            print(f"Warning: {book} PDF not found")

    print(f"\nTotal verses extracted: {len(all_bible_data)}")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_bible_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()
