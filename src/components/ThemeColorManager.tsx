"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeColorManager() {
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        const updateThemeColor = () => {
            const currentTheme = theme === "system" ? resolvedTheme : theme;
            let color = "#ffffff"; // Default light background

            // matching with global.css and tailwind config backgrounds
            if (currentTheme === "dark") {
                color = "#000000"; // Black for dark mode
            } else {
                color = "#ffffff"; // White for light mode
            }

            // Create or update meta tag
            let metaTag = document.querySelector('meta[name="theme-color"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute('name', 'theme-color');
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', color);
            
            // Also handle safari status bar
            let safariMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
            if (!safariMeta) {
                safariMeta = document.createElement('meta');
                safariMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
                document.head.appendChild(safariMeta);
            }
            safariMeta.setAttribute('content', currentTheme === 'dark' ? 'black-translucent' : 'default');
        };

        updateThemeColor();
    }, [theme, resolvedTheme]);

    return null;
}
