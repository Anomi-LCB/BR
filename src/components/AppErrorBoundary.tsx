"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppErrorBoundaryProps {
    children: React.ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground animate-in fade-in duration-500">
            <div className="max-w-xl w-full text-center space-y-8">
                {/* Icon with Ring Animation */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping opacity-75"></div>
                    <div className="relative z-10 bg-background rounded-full p-4 border border-red-500/20 shadow-xl">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                        臾몄젣 諛쒖깮
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        ?덇린移??딆? ?ㅻ쪟媛� 諛쒖깮?덉뒿?덈떎.<br />
                        ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-4 rounded-lg bg-muted/50 text-left overflow-auto max-h-48 text-xs font-mono border border-border/50">
                            {error instanceof Error ? error.message : String(error)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row justify-center">
                    <Button
                        onClick={resetErrorBoundary}
                        size="lg"
                        className="rounded-full gap-2 shadow-lg shadow-primary/20"
                    >
                        <RefreshCcw size={18} />
                        ?ㅼ떆 ?쒕룄
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            resetErrorBoundary();
                            router.push('/');
                        }}
                        className="rounded-full gap-2"
                    >
                        <Home size={18} />
                        ?덉쑝濡??대룞
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground/50 pt-8">
                    Error Code: 500 | System Protection Active
                </p>
            </div>
        </div>
    );
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
                // Reset the state of your app so the error doesn't happen again
                console.log("Error Boundary Reset");
            }}
            onError={(error, info) => {
                // Log to your error reporting service (e.g., Sentry)
                console.error("Uncaught error:", error, info);
            }}
        >
            {children}
        </ErrorBoundary>
    );
}
