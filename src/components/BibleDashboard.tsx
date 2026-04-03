"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Flame, Trophy, Calendar, BarChart2, Settings, BookOpen, Heart, Music } from "lucide-react";
import { BibleReadingPlan, UserProgress } from "@/types/bible";
import { User } from "@supabase/supabase-js";
import DateNavigator from "./DateNavigator";
import BibleCard from "./BibleCard";
import BibleProgressMap from "./BibleProgressMap";
import { calculateStreak } from "@/lib/stats";
import { useRouter, useSearchParams } from "next/navigation";
import { getOfficialCategory, generateKeywords, calculateReadingTime } from "@/lib/bible-utils";
import { fetchYoutubePlaylist, getVideoForDay, parseDurationToMinutes } from "@/lib/youtube";
import YoutubePlayer from "./YoutubePlayer";
import HeaderIsland from "./layout/HeaderIsland";
import NavDock from "./layout/NavDock";
import DashboardGrid, { GridCell } from "./layout/DashboardGrid";
import { SmartCard } from "./ui/smart-card";
import { GlassPanel } from "./ui/glass-panel";
import { motion, AnimatePresence } from "framer-motion";
import YearlyProgressView from "./YearlyProgressView";
import SettingsView from "./SettingsView";
import StreakHistoryView from "./StreakHistoryView";
import BibleSearchTab from "./dashboard-tabs/BibleSearchTab";
import HymnsTab from "./dashboard-tabs/HymnsTab";
import DashboardWidget from "./ui/DashboardWidget";
import BibleJourneyMap from "./BibleJourneyMap";
import { useBibleStore } from "@/store/useBibleStore";
import FullReadingView from "./FullReadingView";

interface BibleDashboardProps {
    user: User | null;
    allPlans: BibleReadingPlan[];
    initialProgress: UserProgress[];
    appSettings: { key: string; value: string }[];
    initialDate: string;
    rawTargetPlan?: BibleReadingPlan;
}

// Daily encouragement — warm, personal messages (60+ for 2-month cycle)
const ENCOURAGEMENTS = [
    // 아침 & 시작
    { emoji: "🌅", msg: "오늘도 말씀과 함께 하루를 시작하는 당신, 정말 멋져요!", sub: "꾸준함이 기적을 만듭니다" },
    { emoji: "☀️", msg: "좋은 아침이에요! 오늘의 말씀이 당신의 하루를 환하게 비춰줄 거예요.", sub: "시편 118:24 — 이 날은 여호와께서 만드신 날이라" },
    { emoji: "🌄", msg: "새 아침, 새 은혜! 어제의 걱정은 내려놓고 오늘의 말씀을 만나보세요.", sub: "예레미야 애가 3:23 — 아침마다 새로우니 주의 성실하심이 크도다" },
    { emoji: "🐦", msg: "새들이 노래하듯, 말씀으로 하루를 시작하는 것은 가장 아름다운 습관이에요.", sub: "오늘 하루도 은혜 가운데 시작해요" },
    // 격려 & 응원
    { emoji: "💪", msg: "어제보다 한 걸음 더! 성경 읽기, 오늘도 할 수 있어요.", sub: "작은 습관이 큰 변화를 만들어요" },
    { emoji: "🔥", msg: "연속 읽기 중이시네요! 이 열정이면 365일 완독도 거뜬해요!", sub: "포기하지 않는 당신이 자랑스러워요" },
    { emoji: "🎯", msg: "365일 중 하루하루가 쌓여가고 있어요. 대단해요!", sub: "오늘의 한 장이 완독의 한 걸음이에요" },
    { emoji: "🏃", msg: "마라톤에서 가장 중요한 건 속도가 아니라 멈추지 않는 거예요.", sub: "히브리서 12:1 — 인내로써 달려가자" },
    { emoji: "💎", msg: "당신의 꾸준한 읽기는 보석처럼 빛나고 있어요!", sub: "매일 한 장씩, 가장 값진 투자예요" },
    { emoji: "🦅", msg: "오르막길이 힘들어도 독수리처럼 다시 날아오를 수 있어요.", sub: "이사야 40:31 — 여호와를 앙망하는 자는 새 힘을 얻으리니" },
    { emoji: "🌟", msg: "오늘 읽는 한 장이 내일의 당신을 더 단단하게 만들어요.", sub: "말씀은 가장 좋은 영양제예요" },
    // 평안 & 위로
    { emoji: "🌿", msg: "바쁜 하루 속에서도 말씀을 펼치는 당신에게 평안이 있기를.", sub: "시편 119:105 — 주의 말씀은 내 발에 등이요" },
    { emoji: "☕", msg: "커피 한 잔처럼, 오늘의 말씀도 당신의 하루를 따뜻하게 해줄 거예요.", sub: "잠시 멈추고 말씀 속에 쉬어가세요" },
    { emoji: "🕊️", msg: "지치고 힘든 날에도 말씀은 당신 곁에 있어요.", sub: "마태복음 11:28 — 수고하고 무거운 짐 진 자들아, 내게로 오라" },
    { emoji: "🌊", msg: "파도가 높을 때일수록 닻이 중요하듯, 말씀이 당신의 닻이 되어줄 거예요.", sub: "폭풍 속에서도 평안을 주시는 분" },
    { emoji: "🌙", msg: "오늘 하루 수고했어요. 말씀 한 구절로 마음을 쉬어가세요.", sub: "시편 4:8 — 내가 평안히 눕고 자리이다" },
    { emoji: "☁️", msg: "흐린 날에도 해는 구름 뒤에 있어요. 말씀 속에 오늘의 햇살이 있어요.", sub: "로마서 8:28 — 모든 것이 합력하여 선을 이루느니라" },
    { emoji: "🤗", msg: "하나님은 오늘도 당신을 응원하고 계세요. 혼자가 아니에요!", sub: "신명기 31:8 — 여호와 그가 네 앞서 가시며" },
    // 성경 & 묵상
    { emoji: "📖", msg: "성경 한 장이 인생 한 페이지를 바꿀 수 있어요.", sub: "오늘 읽을 말씀이 당신을 기다리고 있어요" },
    { emoji: "🙏", msg: "읽기 전 잠깐, 조용히 기도해 보세요. 말씀이 더 깊이 다가올 거예요.", sub: "하나님과의 대화, 지금 시작해 보세요" },
    { emoji: "💖", msg: "성경을 읽는 시간은 하나님이 당신에게 편지를 읽어주시는 시간이에요.", sub: "사랑하는 자녀에게 보내는 하나님의 러브레터" },
    { emoji: "🔍", msg: "오늘 말씀 속에 나에게 하시는 특별한 한 마디가 있을 거예요.", sub: "찾으면 발견하게 될 보물 같은 구절" },
    { emoji: "📝", msg: "마음에 와닿는 구절이 있다면 기억해 두세요. 그것이 묵상의 시작이에요.", sub: "여호수아 1:8 — 주야로 묵상하라" },
    { emoji: "🎵", msg: "말씀을 읽다 보면 마음에 울리는 멜로디 같은 구절을 만나게 돼요.", sub: "시편 119:54 — 주의 율례가 나의 노래가 되었나이다" },
    // 성장 & 변화
    { emoji: "🌱", msg: "씨앗이 자라듯, 말씀도 마음 속에서 조용히 자라고 있어요.", sub: "눈에 보이지 않아도 성장하고 있어요" },
    { emoji: "✨", msg: "오늘 말씀에서 반짝이는 한 구절을 발견해 보세요!", sub: "하루를 바꿀 보석 같은 말씀이 숨어있어요" },
    { emoji: "🌈", msg: "비가 온 뒤에 무지개가 뜨듯, 말씀 속에서 오늘의 은혜를 발견하세요.", sub: "시련 뒤에 찾아오는 하나님의 약속" },
    { emoji: "🦋", msg: "애벌레가 나비가 되듯, 말씀을 통해 우리도 변화되어 가고 있어요.", sub: "고후 3:18 — 주의 영으로 말미암아 영광에서 영광으로" },
    { emoji: "🌻", msg: "해바라기가 해를 향하듯, 매일 말씀을 향하는 당신은 이미 성장 중이에요.", sub: "방향이 맞으면 속도는 중요하지 않아요" },
    { emoji: "🏔️", msg: "산 정상은 한 걸음씩 오르는 거예요. 오늘의 한 장이 그 한 걸음이에요.", sub: "빌립보서 3:14 — 푯대를 향하여 달려가노라" },
    // 감사 & 기쁨
    { emoji: "🎉", msg: "오늘도 말씀을 읽을 수 있다는 것 자체가 감사한 일이에요!", sub: "시편 118:1 — 여호와께 감사하라 그는 선하시며" },
    { emoji: "😊", msg: "성경 읽기가 의무가 아니라 기쁨이 되는 날이 곧 올 거예요.", sub: "시편 1:2 — 오직 여호와의 율법을 즐거워하며" },
    { emoji: "🎁", msg: "오늘의 말씀은 하나님이 당신에게 특별히 준비하신 선물이에요.", sub: "포장을 풀어볼 준비 되셨나요?" },
    { emoji: "🥰", msg: "당신이 성경을 펼칠 때, 하나님은 미소 짓고 계실 거예요.", sub: "잠언 8:34 — 내 문 곁에서 기다리는 자가 복이 있느니라" },
    { emoji: "🌺", msg: "꽃이 피듯 말씀으로 시작하는 하루는 자연스럽게 아름다워져요.", sub: "아가 2:12 — 꽃이 땅에 피고 노래할 때가 왔도다" },
    // 믿음 & 신뢰
    { emoji: "⚓", msg: "흔들리는 배에도 닻이 있듯, 말씀이 우리의 든든한 닻이에요.", sub: "히브리서 6:19 — 영혼의 닻 같아서 확실하고 견고하여" },
    { emoji: "🛡️", msg: "오늘의 말씀이 당신의 하루를 지켜줄 방패가 되어줄 거예요.", sub: "에베소서 6:16 — 믿음의 방패를 가지고" },
    { emoji: "🗝️", msg: "성경은 인생의 모든 문을 여는 열쇠를 담고 있어요.", sub: "오늘 어떤 문이 열릴지 기대해 보세요" },
    { emoji: "🏠", msg: "말씀 위에 세우는 삶은 어떤 폭풍에도 흔들리지 않아요.", sub: "마태복음 7:24 — 반석 위에 지은 집" },
    { emoji: "🌠", msg: "아브라함이 별을 세었듯, 당신의 읽기 기록 하나하나가 빛나고 있어요.", sub: "창세기 15:5 — 하늘의 별처럼" },
    // 일상 & 공감
    { emoji: "📱", msg: "SNS 대신 성경을 여는 이 순간, 이미 최고의 선택을 하셨어요!", sub: "가장 좋은 아침 루틴이에요" },
    { emoji: "🧘", msg: "마음이 복잡할 때, 말씀 한 구절이 정리해 줄 거예요.", sub: "빌립보서 4:7 — 모든 지각에 뛰어난 하나님의 평강" },
    { emoji: "🌤️", msg: "오늘 날씨가 어떻든, 말씀 안에는 항상 맑은 하늘이 있어요.", sub: "변하지 않는 하나님의 사랑 안에서" },
    { emoji: "🎒", msg: "오늘 하루를 나서기 전, 말씀이라는 도시락을 챙겨가세요.", sub: "어디서든 꺼내 먹을 수 있는 영혼의 양식" },
    { emoji: "🧩", msg: "매일 읽는 말씀이 인생이라는 퍼즐의 한 조각을 채워가고 있어요.", sub: "완성된 그림이 곧 보일 거예요" },
    { emoji: "🎧", msg: "음악을 듣듯 말씀에 귀를 기울여 보세요. 다른 소리가 들릴 거예요.", sub: "사무엘상 3:10 — 말씀하옵소서 종이 듣겠나이다" },
    // 사랑 & 관계
    { emoji: "❤️", msg: "하나님은 당신을 포기하지 않으세요. 오늘도 사랑받고 있어요.", sub: "로마서 8:38-39 — 아무 것도 우리를 끊을 수 없으리라" },
    { emoji: "🤝", msg: "말씀을 읽는 시간은 하나님과의 데이트 시간이에요.", sub: "가장 좋은 대화 상대와의 만남" },
    { emoji: "💌", msg: "2000년 전에 쓰여졌지만, 오늘 당신에게 보내는 편지예요.", sub: "시대를 초월한 하나님의 메시지" },
    { emoji: "🕯️", msg: "어둠 속의 촛불처럼, 말씀 한 구절이 큰 위로가 될 수 있어요.", sub: "시편 119:130 — 주의 말씀이 열리면 빛을 비추어" },
    // 계절감 & 자연
    { emoji: "🍃", msg: "바람에 흔들리는 나뭇잎처럼, 말씀에 따라 유연하게 살아가요.", sub: "시편 1:3 — 시냇가에 심은 나무 같으리로다" },
    { emoji: "❄️", msg: "겨울이 지나면 봄이 오듯, 말씀 속에 희망의 계절이 있어요.", sub: "전도서 3:1 — 천하 만사가 다 때가 있나니" },
    { emoji: "🌾", msg: "심은 대로 거두게 돼요. 오늘 뿌리는 말씀의 씨앗이 열매가 될 거예요.", sub: "갈라디아서 6:9 — 거둘 때가 이르리니 포기하지 말라" },
    { emoji: "🌙✨", msg: "밤하늘의 별처럼 말씀은 어두운 시간에 더 밝게 빛나요.", sub: "시편 19:1 — 하늘이 하나님의 영광을 선포하고" },
    // 도전 & 결단
    { emoji: "⚡", msg: "오늘의 말씀이 당신에게 새로운 용기를 줄 거예요!", sub: "여호수아 1:9 — 강하고 담대하라" },
    { emoji: "🚀", msg: "365일 완독, 도전이 아니라 여행이에요. 즐기며 읽어보세요!", sub: "과정 자체가 축복이에요" },
    { emoji: "🏆", msg: "완독 트로피보다 더 값진 건, 매일 말씀을 만나는 이 시간이에요.", sub: "결과보다 과정이 더 아름다워요" },
    { emoji: "🗺️", msg: "성경은 인생의 내비게이션이에요. 오늘도 길을 알려줄 거예요.", sub: "잠언 3:6 — 네 길을 지도하시리라" },
    { emoji: "⏰", msg: "하루 10분, 그 작은 시간이 365일 뒤엔 놀라운 변화를 만들어요.", sub: "작은 것에 충성하면 큰 것도 맡겨주시는 분" },
    { emoji: "🎈", msg: "무거운 마음을 내려놓고, 가벼운 마음으로 말씀을 읽어보세요.", sub: "베드로전서 5:7 — 너희 모든 염려를 맡기라" },
];

function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
    );
}

function EncouragementBanner() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const today = ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <GlassPanel intensity="low" className="p-4 border border-primary/10 dark:border-white/10 group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-start gap-3 relative z-10">
                    <div className="text-2xl shrink-0 mt-0.5">{today.emoji}</div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                            {today.msg}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 italic font-serif">
                            {today.sub}
                        </p>
                    </div>
                </div>
            </GlassPanel>
        </motion.div>
    );
}

export default function BibleDashboard({
    user,
    allPlans,
    initialProgress,
    appSettings,
    initialDate,
    rawTargetPlan: initialRawTargetPlan
}: BibleDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isGuest = true;
    const [activeTab, setActiveTab] = useState<"home" | "search" | "hymns" | "streak" | "bible" | "calendar" | "menu">("home");

    // State
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [userProgress, setUserProgress] = useState(initialProgress);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);

    // Settings from localStorage
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [autoPlay, setAutoPlay] = useState(false);
    const [showEncouragement, setShowEncouragement] = useState(true);
    const isAiEnabled = useBibleStore(state => state.isAiEnabled);

    const [readingReference, setReadingReference] = useState<string | null>(null);
    const [readingPlan, setReadingPlan] = useState<BibleReadingPlan | undefined>(undefined);

    // Apply global font size as CSS custom property
    useEffect(() => {
        const size = localStorage.getItem('bible_font_size') || 'medium';
        setFontSize(size as any);
        setAutoPlay(localStorage.getItem('bible_autoplay') === 'true');
        setShowEncouragement(localStorage.getItem('bible_daily_verse') !== 'false');
        // Set global CSS variable for font scaling
        const scales: Record<string, string> = { small: '0.88', medium: '1', large: '1.15' };
        document.documentElement.style.setProperty('--font-scale', scales[size] || '1');
    }, [activeTab]);

    // Sync with URL and Load Local Data
    useEffect(() => {
        const dateFromUrl = searchParams.get("date");
        if (dateFromUrl && dateFromUrl !== selectedDate) {
            setSelectedDate(dateFromUrl);
        }

        if (isGuest) {
            const savedProgress = localStorage.getItem('guest_bible_progress');
            if (savedProgress) {
                try {
                    const parsed = JSON.parse(savedProgress);
                    const progressWithData = parsed.map((planId: number) => ({
                        plan_id: planId,
                        reading_plan: allPlans.find(p => p.id === planId)
                    })).filter((p: { reading_plan: BibleReadingPlan | undefined }) => p.reading_plan);
                    setUserProgress(progressWithData);
                } catch (e) {
                    console.error("Failed to load guest progress", e);
                }
            }
        }

        // Fetch YouTube Video Duration for the selected date
        async function fetchDuration() {
            try {
                // Calculate Day of Year
                const dateObj = new Date(selectedDate);
                const start = new Date(dateObj.getFullYear(), 0, 0);
                const diff = dateObj.getTime() - start.getTime();
                const oneDay = 1000 * 60 * 60 * 24;
                const dayOfYear = Math.floor(diff / oneDay);

                const videos = await fetchYoutubePlaylist();
                const videoData = getVideoForDay(videos, dayOfYear);
                if (videoData && videoData.duration) {
                    setVideoDuration(parseDurationToMinutes(videoData.duration));
                } else {
                    setVideoDuration(null);
                }
            } catch (error) {
                console.error("Failed to fetch video duration", error);
            }
        }
        fetchDuration();

    }, [searchParams, isGuest, allPlans, selectedDate]);

    const handleDateChange = (newDateStr: string) => {
        setSelectedDate(newDateStr);
        const url = new URL(window.location.href);
        url.searchParams.set("date", newDateStr);
        window.history.pushState({}, "", url.toString());
    };

    // Derived State
    const { streak, completedVerses, completedIds, progressPercent, daysLeft } = useMemo(() => {
        const progress = userProgress;
        const completedDates = progress.map((p: UserProgress) => p.reading_plan?.date).filter((d): d is string => !!d);
        const streak = calculateStreak(completedDates);
        const completedVerses = progress.reduce((acc: string[], p: UserProgress) => {
            if (p.reading_plan?.verses) acc.push(...p.reading_plan.verses);
            return acc;
        }, []);
        const completedIds = progress.map((p: UserProgress) => p.plan_id);
        const progressPercent = Math.round((completedIds.length / 365) * 100);
        const daysLeft = 365 - completedIds.filter(id => id > 0).length;

        return { streak, completedVerses, completedIds, progressPercent, daysLeft };
    }, [userProgress]);

    // Target Plan Logic
    const targetPlan = useMemo(() => {
        let plan = initialRawTargetPlan;

        if (selectedDate !== initialDate || !plan) {
            const exact = allPlans.find(p => p.date === selectedDate);
            const targetMMDD = selectedDate.slice(5);
            plan = exact || allPlans.find(p => p.date && p.date.endsWith(targetMMDD));
        }

        if (!plan) return null;

        // Psalm 119 Logic
        const processedPlan = { ...plan };
        const day = processedPlan.day_of_year;
        const p119Mapping: Record<number, string> = {
            119: "시편 119편 1~32절", 274: "시편 119편 1~32절",
            120: "시편 119편 33-64절", 275: "시편 119편 33-64절",
            121: "시편 119편 65-96절", 276: "시편 119편 65-96절",
            122: "시편 119편 97-128절", 277: "시편 119편 97-128절",
            123: "시편 119편 129-152절", 278: "시편 119편 129-152절",
            124: "시편 119편 153-176절", 279: "시편 119편 153-176절"
        };
        const p119Text = p119Mapping[day];
        if (p119Text && !processedPlan.title.includes("시편 119절")) {
            processedPlan.title = `${processedPlan.title}, ${p119Text}`;
            if (!processedPlan.verses.includes(p119Text)) {
                processedPlan.verses = [...processedPlan.verses, p119Text];
            }
        }

        return {
            ...processedPlan,
            category: processedPlan.category || getOfficialCategory(processedPlan.verses),
            summary: processedPlan.summary || generateKeywords(processedPlan.verses),
            reading_time: processedPlan.reading_time || calculateReadingTime(processedPlan.verses)
        };
    }, [allPlans, selectedDate, initialDate, initialRawTargetPlan]);

    const isCompleted = targetPlan ? completedIds.includes(targetPlan.id) : false;

    const handleToggle = async (planId: number) => {
        let newProgress;
        if (isCompleted) {
            newProgress = userProgress.filter(p => p.plan_id !== planId);
        } else {
            const newEntry = {
                plan_id: planId,
                reading_plan: allPlans.find(p => p.id === planId)
            };
            newProgress = [...userProgress, newEntry];
        }
        setUserProgress(newProgress);
        localStorage.setItem('guest_bible_progress', JSON.stringify(newProgress.map(p => p.plan_id)));
    };

    // End of logic, start of render

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/20 transition-colors duration-500">
            <AnimatedBackground />

            <HeaderIsland 
                title="성경 365" 
                onLogoClick={() => setActiveTab("home")} 
                subtitle={activeTab === 'home' ? format(new Date(selectedDate), "MM월 dd일") : undefined}
            />

            <main className="container mx-auto px-4 max-w-2xl pt-24 pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === "home" && (
                        <motion.div 
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <DashboardGrid>
                                <GridCell span="3" className="space-y-6">
                                    <DateNavigator currentDate={selectedDate} onDateChange={handleDateChange} />
                                    {targetPlan ? (
                                        <BibleCard
                                            plan={targetPlan}
                                            isCompleted={isCompleted}
                                            onToggle={() => handleToggle(targetPlan.id)}
                                            onRead={(plan) => {
                                                setReadingPlan(plan);
                                                setReadingReference(plan.verses[0] || plan.title);
                                            }}
                                            videoDuration={videoDuration}
                                            fontSize={fontSize}
                                        />
                                    ) : (
                                        <SmartCard variant="outline" className="p-12 text-center text-muted-foreground">
                                            이 날의 읽기표가 없습니다.
                                        </SmartCard>
                                    )}
                                </GridCell>

                                <GridCell span="1">
                                    <SmartCard variant="elevated" className="h-full flex flex-col justify-between cursor-pointer group" onClick={() => setActiveTab("streak")}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">연속 읽기</span>
                                            <Flame size={16} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-display">{streak}</span>
                                            <span className="text-xs text-muted-foreground ml-1">일째</span>
                                        </div>
                                    </SmartCard>
                                </GridCell>

                                <GridCell span="1">
                                    <SmartCard variant="elevated" className="h-full flex flex-col justify-between cursor-pointer group" onClick={() => setActiveTab("bible")}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">진행률</span>
                                            <Trophy size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-display">{progressPercent}%</span>
                                            <span className="text-xs text-muted-foreground ml-1">완료</span>
                                        </div>
                                    </SmartCard>
                                </GridCell>

                                <GridCell span="1">
                                    <SmartCard variant="elevated" className="h-full flex flex-col justify-between cursor-pointer group" onClick={() => setActiveTab("calendar")}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">남은 기간</span>
                                            <Calendar size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-display">{daysLeft}</span>
                                            <span className="text-xs text-muted-foreground ml-1">일</span>
                                        </div>
                                    </SmartCard>
                                </GridCell>

                                <GridCell span="3" className="space-y-4">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">멀티미디어 자료</h3>
                                    <YoutubePlayer selectedDate={selectedDate} autoPlay={autoPlay} />
                                </GridCell>

                                {showEncouragement && (
                                    <GridCell span="3">
                                        <EncouragementBanner />
                                    </GridCell>
                                )}
                            </DashboardGrid>
                        </motion.div>
                    )}

                    {activeTab === "search" && (
                        <motion.div 
                            key="search"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <BookOpen size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">성경 말씀 검색</h2>
                                    <p className="text-xs text-muted-foreground">원하는 구절을 찾아보세요</p>
                                </div>
                            </div>
                            <BibleSearchTab onSelect={(ref) => setReadingReference(ref)} />
                        </motion.div>
                    )}

                    {activeTab === "hymns" && (
                        <motion.div 
                            key="hymns"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Music size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">찬송가 645장</h2>
                                    <p className="text-xs text-muted-foreground">은혜로운 찬양의 시간</p>
                                </div>
                            </div>
                            <HymnsTab />
                        </motion.div>
                    )}

                    {activeTab === "streak" && (
                        <motion.div 
                            key="streak"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                             <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-orange-500/10">
                                    <Flame size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">연속 읽기 기록</h2>
                                    <p className="text-xs text-muted-foreground">멈추지 않는 말씀의 열정</p>
                                </div>
                            </div>
                            <StreakHistoryView
                                progress={userProgress}
                                onBack={() => setActiveTab("home")}
                            />
                        </motion.div>
                    )}

                    {activeTab === "bible" && (
                        <motion.div 
                            key="bible"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <BarChart2 size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">성경 완독 여정</h2>
                                    <p className="text-xs text-muted-foreground">말씀의 지형도를 따라 걷는 영적 여정</p>
                                </div>
                            </div>
                            <BibleJourneyMap />
                        </motion.div>
                    )}

                    {activeTab === "calendar" && (
                        <motion.div 
                            key="calendar"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Calendar size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">성경 읽기 달력</h2>
                                    <p className="text-xs text-muted-foreground">전체 읽기 기록 확인</p>
                                </div>
                            </div>
                            <YearlyProgressView
                                progress={userProgress}
                                allPlans={allPlans}
                                currentDate={selectedDate}
                            />
                        </motion.div>
                    )}

                    {activeTab === "menu" && (
                        <motion.div 
                            key="menu"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Settings size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold">앱 설정</h2>
                                    <p className="text-xs text-muted-foreground">사용자 환경 맞춤화</p>
                                </div>
                            </div>
                            <SettingsView />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <NavDock activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)} />

            {readingReference && (
                <FullReadingView
                    plan={readingPlan || { id: 0, day_of_year: 0, date: '', title: readingReference, verses: [readingReference] }}
                    onClose={() => {
                        setReadingReference(null);
                        setReadingPlan(undefined);
                    }}
                />
            )}
        </div>
    );
}
