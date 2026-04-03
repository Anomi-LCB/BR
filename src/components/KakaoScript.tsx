'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { loadShareSettings } from '@/lib/share-service';

declare global {
    interface Window {
        Kakao: any;
    }
}

export default function KakaoScript() {
    // Re-initialize if key changes (optional, usually done on page load)
    useEffect(() => {
        const initKakao = () => {
            const settings = loadShareSettings();
            // Priority: 1. Env Var, 2. Local Storage
            const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || settings.kakaoJsKey;

            if (window.Kakao && !window.Kakao.isInitialized() && jsKey) {
                try {
                    window.Kakao.init(jsKey);
                    console.log("Kakao SDK Initialized with key length:", jsKey.length);
                } catch (e) {
                    console.error("Failed to init Kakao SDK", e);
                }
            }
        };

        // Try init immediately if script already loaded
        if (window.Kakao) {
            initKakao();
        }

        // Also listen for settings changes if needed, but for now simple init is enough
        const handleFocus = () => initKakao();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    return (
        <Script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
            integrity="sha384-DKYJZ8NLiK8AOplggwK6tOBa/+GqSaElLewisfLXaJclOH0/gIkeuzPZFmWk+52D"
            crossOrigin="anonymous"
            strategy="lazyOnload"
            onLoad={() => {
                const settings = loadShareSettings();
                const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || settings.kakaoJsKey;

                if (window.Kakao && !window.Kakao.isInitialized() && jsKey) {
                    try {
                        window.Kakao.init(jsKey);
                    } catch (e) {
                        console.error("Failed to init Kakao SDK", e);
                    }
                }
            }}
        />
    );
}
