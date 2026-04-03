# Progress

- [2026-04-03 성경 본문 데이터화] PDF에서 성경 구절 추출 후 `public/data/bible-krv.json` 구축 완료 (오프라인 모드).
- [2026-04-03 UI/UX 개선] Premium 아이콘 제거, 불필요한 위젯 제거, 네비게이션 도크 스크롤 숨김 로직 제거 (하단 고정).
- [2026-04-03 성경 뷰어 연동] `BibleDashboard.tsx`의 성경 검색 탭(`BibleSearchTab`)과 투데이 홈 탭의 성경 읽기 카드(`BibleCard`)에서 실제 성경 본문 뷰어(`FullReadingView.tsx`)가 뜨도록 `alert` 모의 로직을 제거하고 정상 연동 완료.
- [2026-04-03 사이트 실행] `npm run dev`를 통해 로컬 서버(`http://localhost:3000`) 실행 및 정상 접속 확인.
- [2026-04-03 성경 본문 잘림 수정] PDF 추출 스크립트(`extract_bible_pdf.py`)의 정규표현식 `[가-힣]{1,2}` → 정확한 약어 매핑(BOOK_ABBR) 방식으로 변경. 이전 절 마지막 글자가 다음 절 약어에 포함되는 버그 수정 후 30,934절 재추출 완료.
- [2026-04-03 검색 모달 UI 수정] `FullReadingView.tsx`의 깨진 문자(mojibake) placeholder·라벨 복원 + 장 선택 버튼 축소 (`aspect-square` → `h-10`, 5→7열 그리드).
