"use client";

import { useEffect } from "react";
import ThemeColorManager from "./ThemeColorManager";
import StatusBarManager from "./StatusBarManager";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("SW registered: ", registration);
                    })
                    .catch((registrationError) => {
                        console.log("SW registration failed: ", registrationError);
                    });
            });
        }
    }, []);

    return (
        <>
            <ThemeColorManager />
            <StatusBarManager />
            {children}
        </>
    );
}
