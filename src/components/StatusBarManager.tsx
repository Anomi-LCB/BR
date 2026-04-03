"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export default function StatusBarManager() {
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const setStatusBarStyle = async () => {
            try {
                const currentTheme = theme === "system" ? resolvedTheme : theme;

                if (currentTheme === "dark") {
                    await StatusBar.setStyle({ style: Style.Dark }); // White text
                } else {
                    await StatusBar.setStyle({ style: Style.Light }); // Black text
                }
            } catch (error) {
                console.warn("Failed to set status bar style", error);
            }
        };

        setStatusBarStyle();
    }, [theme, resolvedTheme]);

    return null;
}
