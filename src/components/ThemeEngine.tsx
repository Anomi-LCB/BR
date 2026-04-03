"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export default function ThemeEngine() {
    const { activeTheme, activeFont } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;

        // Handle Theme
        root.classList.remove('theme-midnight-forest');
        if (activeTheme === "테마 'Midnight Forest'") {
            root.classList.add('theme-midnight-forest');
        }

        // Handle Font
        root.classList.remove('font-myeongjo');
        if (activeFont === "프리미엄 폰트 '명조'") {
            root.classList.add('font-myeongjo');
        }
    }, [activeTheme, activeFont]);

    return null;
}
