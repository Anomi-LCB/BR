"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SmartCard } from '@/components/ui/smart-card';
import { Users, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function InviteHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [groupCode, setGroupCode] = useState<string | null>(null);

    useEffect(() => {
        const handleInvite = async () => {
            // 1. Get Code from URL
            const code = searchParams.get('code');

            // 2. Handle 'Deep Link' check
            // If opened via Custom Scheme (bible365://invite?code=...), logic matches.
            // If opened via Web (https://...), logic matches.

            if (code) {
                // Determine if code is encrypted (Phase 6.2)
                // For backward compatibility, we check if it looks like an old ID or new code.
                // But for now, let's assume all new links use the raw ID until we switch UI to use encrypt.
                // Wait, I should import decrypt.

                // Let's lazy load decrypt to avoid bundling issues if any
                const { decryptInviteCode } = await import('@/lib/crypto');

                // Attempt decrypt
                let finalGroupId = decryptInviteCode(code);

                // Fallback: If decrypt fails, maybe it's a legacy raw code?
                // Or if decrypt returns null/empty
                if (!finalGroupId) {
                    finalGroupId = code; // Assume raw for legacy/fallback
                }

                setGroupCode(finalGroupId);
                localStorage.setItem('bible_group_id', finalGroupId);
                setStatus('success');

                // 3. Redirect
                // If we are in the Native App -> Go Home
                // If we are on Web -> Offer to "Open App" or "Go Home"

                // Detection logic
                const isNative = window.navigator.userAgent.includes('Capacitor');

                if (isNative) {
                    setTimeout(() => router.push('/'), 1000);
                } else {
                    // Web Fallback: Try to open via Custom Scheme
                    window.location.href = `bible365://invite?code=${code}`;

                    // Stay on page to show "Download App" or "Open Web"
                    setStatus('success'); // Keep success state but maybe change message
                }
            } else {
                setStatus('error');
                setTimeout(() => router.push('/'), 2000);
            }
        };

        handleInvite();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <SmartCard variant="elevated" className="max-w-sm w-full p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    {status === 'loading' ? (
                        <Loader2 className="animate-spin text-primary" size={40} />
                    ) : (
                        <Users className="text-primary" size={40} />
                    )}
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-serif font-black">
                        {status === 'loading' && "珥덈????뺤씤 以?.."}
                        {status === 'success' && "洹몃９ 李몄뿬 ?꾨즺! ?럦"}
                        {status === 'error' && "?좏슚?섏? ?딆? 留곹겕"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {status === 'loading' && "?좎떆留?湲곕떎?ㅼ＜?몄슂."}
                        {status === 'success' && `${groupCode} 洹몃９?쇰줈 ?대룞?⑸땲??`}
                        {status === 'error' && "硫붿씤 ?붾㈃?쇰줈 ?대룞?⑸땲??"}
                    </p>
                </div>
            </SmartCard>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <InviteHandler />
        </Suspense>
    );
}
