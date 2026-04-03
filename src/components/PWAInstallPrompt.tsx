"use client";

import { useState, useEffect } from 'react';
import { Share, X, PlusSquare, ArrowUpSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);

    useEffect(() => {
        // Detect platform and standalone mode
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        
        if (isIos) {
            setPlatform('ios');
            // Show prompt if not already installed and not dismissed this session
            const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
            if (!isStandalone && !dismissed) {
                // Delay to not annoy immediately
                const timer = setTimeout(() => setShowPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        } else if (/Android/.test(navigator.userAgent)) {
            setPlatform('android');
            // Android usually has a native prompt, but we can show a hint if needed
        }
    }, []);

    const dismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-4 right-4 z-[100]"
            >
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden relative">
                    {/* Background Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                    
                    <button 
                        onClick={dismiss}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                            <Download className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 pr-6">
                            <h3 className="text-white font-bold text-lg mb-1">앱으로 설치하기</h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                홈 화면에 추가하면 매일 정해진 시간에 **말씀 알람**을 받을 수 있습니다.
                            </p>

                            {platform === 'ios' ? (
                                <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center gap-3 text-slate-200 text-xs">
                                        <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <Share className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <span>하단 바의 **'공유'** 버튼을 누르세요.</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-200 text-xs">
                                        <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <PlusSquare className="w-3 h-3 text-indigo-400" />
                                        </div>
                                        <span>리스트에서 **'홈 화면에 추가'**를 선택하세요.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-xs italic">
                                    브라우저 메뉴의 '앱 설치' 또는 '홈 화면에 추가'를 눌러주세요.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
