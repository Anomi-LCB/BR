"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Sparkles, CheckCircle2, Share, MoreVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
}

const DISMISS_KEY = "pwa_banner_dismissed_at";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24시간 후 다시 표시

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [platform, setPlatform] = useState<Platform>("desktop");

    useEffect(() => {
        // 이미 설치된 상태(standalone)면 숨김
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        setPlatform(detectPlatform());

        // 사용자가 닫은 시간 확인 → 24시간 이내면 숨김
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
            return; // 24시간 안 지남 → 숨기기
        }

        // ★ beforeinstallprompt 없어도 일단 표시
        setIsVisible(true);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // 자동 설치 가능 → 바로 설치 프롬프트
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsVisible(false);
            }
            setDeferredPrompt(null);
        } else {
            // 자동 설치 불가 → 수동 설치 가이드 표시
            setShowGuide(true);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (isInstalled || !isVisible) return null;

    return (
        <div className="px-5 pt-4 pb-2 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden group">
                {/* Premium Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 opacity-90" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl opacity-50" />

                <div className="relative p-5 flex flex-col gap-4 backdrop-blur-sm border border-white/10 rounded-[24px]">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
                                <Download className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-1.5">
                                    성경 365 앱 설치 <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                                </h3>
                                <p className="text-indigo-100/80 text-xs font-medium">
                                    홈 화면에 추가하고 매일 알림을 받아보세요
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* 설치 가이드 (수동 설치 안내) */}
                    {showGuide && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-300 border border-white/10">
                            {platform === "ios" ? (
                                <>
                                    <p className="text-white/90 text-xs font-bold">📱 iPhone / iPad 설치 방법</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
                                            <span>하단의 <Share size={12} className="inline text-blue-300" /> <strong>공유</strong> 버튼을 탭</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</div>
                                            <span><Plus size={12} className="inline text-blue-300" /> <strong>홈 화면에 추가</strong>를 탭</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</div>
                                            <span>우측 상단 <strong>추가</strong>를 탭하면 완료!</span>
                                        </div>
                                    </div>
                                </>
                            ) : platform === "android" ? (
                                <>
                                    <p className="text-white/90 text-xs font-bold">📱 Android 설치 방법</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
                                            <span>우측 상단 <MoreVertical size={12} className="inline text-blue-300" /> <strong>메뉴</strong>(⋮)를 탭</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</div>
                                            <span><strong>"앱 설치"</strong> 또는 <strong>"홈 화면에 추가"</strong>를 탭</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</div>
                                            <span><strong>설치</strong>를 탭하면 완료!</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-white/90 text-xs font-bold">💻 PC 브라우저 설치 방법</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
                                            <span>주소창 오른쪽의 <Download size={12} className="inline text-blue-300" /> <strong>설치 아이콘</strong>을 클릭</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80 text-[11px]">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</div>
                                            <span><strong>설치</strong>를 클릭하면 완료!</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Install Button */}
                    <button
                        onClick={handleInstallClick}
                        className="w-full h-12 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        {deferredPrompt ? (
                            <>
                                지금 앱으로 설치하기
                                <CheckCircle2 size={16} className="text-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </>
                        ) : showGuide ? (
                            "위 방법을 따라 설치해주세요 ✨"
                        ) : (
                            <>
                                설치 방법 안내 보기
                                <Download size={16} className="text-indigo-500" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
