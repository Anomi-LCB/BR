import { registerPlugin } from '@capacitor/core';

export interface WidgetData {
    title: string;
    verse: string;
    progress: number;
    teaserVerse?: string;
    date: string;
    isLockScreenEnabled?: boolean;
    lockScreenStartTime?: number;
    lockScreenEndTime?: number;
    lockScreenMaxImpressions?: number;
}

export interface WidgetDataBridgePlugin {
    updateWidgetData(data: WidgetData): Promise<void>;
    startLockScreenTest(): Promise<void>;
    checkOverlayPermission(): Promise<{ granted: boolean }>;
    requestOverlayPermission(): Promise<void>;
}

// Register the plugin (Must match the name in WidgetDataBridge.kt)
const WidgetDataBridge = registerPlugin<WidgetDataBridgePlugin>('WidgetDataBridge');

export default WidgetDataBridge;
