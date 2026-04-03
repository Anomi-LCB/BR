import { useState, useMemo, useRef, useCallback } from "react";

export type Tab = "home" | "search" | "streak" | "record" | "group" | "achievement" | "menu" | "hymn";

export function useDashboardNav() {
    const [activeTab, setBaseActiveTab] = useState<Tab>("home");

    const setActiveTab = useCallback((tab: Tab) => {
        setBaseActiveTab(tab);
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "instant" });
        }
    }, []);

    // Swipe navigation logic
    const tabOrder = useMemo<Tab[]>(() => ["home", "search", "streak", "record", "achievement", "hymn", "group", "menu"], []);
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (activeTab === 'menu') return;

            const currentIndex = tabOrder.indexOf(activeTab);
            if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
                setActiveTab(tabOrder[currentIndex + 1]);
            } else if (deltaX > 0 && currentIndex > 0) {
                setActiveTab(tabOrder[currentIndex - 1]);
            }
        }
    }, [activeTab, tabOrder]);

    return {
        activeTab,
        setActiveTab,
        handleTouchStart,
        handleTouchEnd
    };
}