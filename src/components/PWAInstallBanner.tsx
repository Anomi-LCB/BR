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

const DISMISS_KEY = "pwa_banner_dismissed_at_v2";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24시간 후 다시 표시

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [platform, setPlatform] = useState<Platform>("desktop");

    useEffect(() => {
        setPlatform(detectPlatform());

        // 이미 설치되어 있는지 확인
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                          || (navigator as any).standalone 
                          || false;
        
        if (isStandalone) {
            setIsVisible(false);
            setIsInstalled(true);
        }

        const handleBeforeInstallPromp = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsVisible(false);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPromp);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPromp);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsVisible(false);
                setIsOpen(false);
            }
            setDeferredPrompt(null);
        } else {
            // 설치 안내 팝업 유지
        }
    };

    if (!isVisible || isInstalled) return null;

    return (
        <>
            {/* Floating Action Button - Always Visible on Web */}
            <div className="fixed bottom-24 right-5 z-[100] animate-in fade-in zoom-in duration-500">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.4)] flex items-center justify-center group hover:scale-110 active:scale-95 transition-all border border-white/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Download className="text-white w-6 h-6 group-hover:animate-bounce" />
                    
                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        <Plus size={10} className="text-indigo-900 font-bold" />
                    </div>
                </button>
            </div>

            {/* Premium PWA Install Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        {/* Header Gradient */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-600/30 to-transparent" />
                        
                        <div className="relative p-7 flex flex-col gap-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-inner">
                                        <Download className="text-white w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-xl leading-tight">성경 365 앱 설치</h3>
                                        <p className="text-slate-400 text-xs mt-1">홈 화면에 추가하고 매일 알림을 받으세요</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Guide Section */}
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                                {platform === "ios" ? (
                                    <>
                                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">iPhone / iPad 가이드</p>
                                        <div className="space-y-3">
                                            {[
                                                { icon: <Share size={12} className="text-blue-400" />, text: "하단의 '공유' 버튼을 탭하세요" },
                                                { icon: <Plus size={12} className="text-blue-400" />, text: "'홈 화면에 추가'를 탭하세요" },
                                                { icon: <CheckCircle2 size={12} className="text-blue-400" />, text: "우측 상단 '추가'를 누르면 완료됩니다" }
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-300 text-xs">
                                                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{step.icon}</div>
                                                    <span>{step.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : platform === "android" ? (
                                    <>
                                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">Android 가이드</p>
                                        <div className="space-y-3">
                                            {[
                                                { icon: <MoreVertical size={12} className="text-blue-400" />, text: "우측 상단 메뉴(⋮)를 탭하세요" },
                                                { icon: <Download size={12} className="text-blue-400" />, text: "'앱 설치' 버튼을 탭하세요" },
                                                { icon: <CheckCircle2 size={12} className="text-blue-400" />, text: "팝업에서 '설치'를 누르면 완료됩니다" }
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-300 text-xs">
                                                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{step.icon}</div>
                                                    <span>{step.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">PC 가이드</p>
                                        <div className="space-y-3">
                                            {[
                                                { icon: <Download size={12} className="text-blue-400" />, text: "주소창 우측 '설치' 아이콘을 클릭하세요" },
                                                { icon: <CheckCircle2 size={12} className="text-blue-400" />, text: "팝업에서 '설치'를 누르면 완료됩니다" }
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-300 text-xs">
                                                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{step.icon}</div>
                                                    <span>{step.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Main CTA */}
                            {deferredPrompt && (
                                <button
                                    onClick={handleInstallClick}
                                    className="w-full h-14 bg-white text-indigo-900 rounded-2xl font-bold text-base shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
                                >
                                    지금 즉시 설치하기
                                    <Sparkles size={18} className="text-amber-500 fill-amber-500" />
                                </button>
                            )}
                            
                            <p className="text-center text-slate-500 text-[10px]">
                                성경 365는 최신 PWA 기술로 제작되었습니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
    );
}
