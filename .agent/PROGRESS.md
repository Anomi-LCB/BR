# Progress

- [2026-04-03 성경 본문 데이터화] PDF에서 성경 구절 추출 후 `public/data/bible-krv.json` 구축 완료 (오프라인 모드).
- [2026-04-03 UI/UX 개선] Premium 아이콘 제거, 불필요한 위젯 제거, 네비게이션 도크 스크롤 숨김 로직 제거 (하단 고정).
- [2026-04-03 성경 뷰어 연동] `BibleDashboard.tsx`의 성경 검색 탭(`BibleSearchTab`)과 투데이 홈 탭의 성경 읽기 카드(`BibleCard`)에서 실제 성경 본문 뷰어(`FullReadingView.tsx`)가 뜨도록 `alert` 모의 로직을 제거하고 정상 연동 완료.
- [2026-04-03 사이트 실행] `npm run dev`를 통해 로컬 서버(`http://localhost:3000`) 실행 및 정상 접속 확인.
- [2026-04-03 성경 본문 잘림 수정] PDF 추출 스크립트(`extract_bible_pdf.py`)의 정규표현식 `[가-힣]{1,2}` → 정확한 약어 매핑(BOOK_ABBR) 방식으로 변경. 이전 절 마지막 글자가 다음 절 약어에 포함되는 버그 수정 후 30,934절 재추출 완료.
- [2026-04-03 검색 모달 UI 수정] `FullReadingView.tsx`의 깨진 문자(mojibake) placeholder·라벨 복원 + 장 선택 버튼 축소 (`aspect-square` → `h-10`, 5→7열 그리드).
- [2026-04-03 인코딩(Mojibake) 전수 복구] 대시보드 탭(`StatsTab`, `RecordTab`, `AchievementTab`, `BibleTab`) 및 `GroupDashboardView`, `GroupChallengeView`, `ThemeEngine`의 깨진 한글 문자열을 UTF-8로 완전 복구 완료.
- [2026-04-03 빌드 성공 및 오류 회피] Turbopack 경로 인식 버그(한글 경로 패닉)를 `--webpack` 플래그로 우회하여 production 빌드 성공. 정적 사이트 내보내기(`output: export`)를 위해 모든 API 경로에 `force-static` 설정 완료.
- [2026-04-03 유튜브 영상 오류 수정] 93일차 영상이 포함된 플레이리스트 제목('일차' 형식) 파싱 로직 개선 및 인덱스 기반 검색을 `dayNumber` 기반으로 고도화하여 영상 매칭 정확도 향상.
- [2026-04-03 PWA 및 매일 알람 시스템 구현] `manifest.json`, `sw.js` 고도화, Web Push(VAPID) 구독 로직 및 Supabase 연동, iOS 전용 설치 가이드 모달 추가 완료.
