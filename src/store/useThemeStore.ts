import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
    activeTheme: string | null;
    activeFont: string | null;
    setTheme: (theme: string | null) => void;
    setFont: (font: string | null) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            activeTheme: null,
            activeFont: null,
            setTheme: (theme) => set({ activeTheme: theme }),
            setFont: (font) => set({ activeFont: font }),
        }),
        {
            name: 'bible-theme-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
