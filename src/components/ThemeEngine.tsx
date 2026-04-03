"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export default function ThemeEngine() {
    const { activeTheme, activeFont } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;

        // Handle Theme
        root.classList.remove('theme-midnight-forest');
        if (activeTheme === "?뚮쭏 'Midnight Forest'") {
            root.classList.add('theme-midnight-forest');
        }

        // Handle Font
        root.classList.remove('font-myeongjo');
        if (activeFont === "?꾨━誘몄뾼 ?고듃 '紐낆“'") {
            root.classList.add('font-myeongjo');
        }
    }, [activeTheme, activeFont]);

    return null;
}
