import { useState, useEffect } from 'react';

export interface BibleSettings {
    fontSize: number;
    lineHeight: number;
    theme: 'system' | 'light' | 'dark' | 'sepia';
    fontFamily: 'serif' | 'sans' | 'system';
    livingTypography: boolean;
}

const DEFAULT_SETTINGS: BibleSettings = {
    fontSize: 18,
    lineHeight: 2.2,
    theme: 'system',
    fontFamily: 'serif',
    livingTypography: true,
};

export function useBibleSettings() {
    const [settings, setSettings] = useState<BibleSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('rb_bible_settings');
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch (e) {
                console.error("Failed to parse bible settings", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('rb_bible_settings', JSON.stringify(settings));
        }
    }, [settings, isLoaded]);

    const updateSettings = (updates: Partial<BibleSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    return { settings, updateSettings, isLoaded };
}
