"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // 이미 설치되어 있는지 확인
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        // iOS는 beforeinstallprompt를 지원하지 않으므로 사파리 감지 (선택 사항)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
            // iOS 사용자를 위한 안내는 PWAInstallPrompt.tsx 모달에서 처리하므로 여기선 숨김 유지
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (isInstalled || !isVisible) return null;

    return (
        <div className="px-5 pt-4 pb-2 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden group">
                {/* Background with Premium Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 opacity-90 transition-all duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                
                {/* Decorative Elements */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl opacity-50" />

                <div className="relative p-5 flex flex-col gap-4 backdrop-blur-sm border border-white/10 rounded-[24px]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
                                <Download className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-1.5">
                                    성경 365 앱 설치 <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                                </h3>
                                <p className="text-indigo-100/80 text-xs font-medium">홈 화면에 추가하고 매일 알림을 받아보세요</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="p-1.25 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full h-12 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        지금 앱으로 설치하기
                        <CheckCircle2 size={16} className="text-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
}
