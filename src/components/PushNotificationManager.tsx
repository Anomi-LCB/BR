"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function PushNotificationManager() {
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        const registerPush = async () => {
            try {
                // Dynamically import to avoid SSR issues
                const { PushNotifications } = await import('@capacitor/push-notifications');

                // Check permission ??never block app launch
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    // User denied ??gracefully continue without push
                    console.warn('Push notification permission not granted ??app continues normally');
                    return;
                }

                // Register safely
                try {
                    await PushNotifications.register();
                } catch (regErr) {
                    console.warn('Push registration failed (non-critical):', regErr);
                    return;
                }

                // Listeners
                PushNotifications.addListener('registration', (token) => {
                    console.log('Push Token:', token.value);
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.warn('Push Registration Error (non-critical):', error);
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push Received:', notification);
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push Action:', notification);
                });

            } catch (e) {
                // Absolute catch-all: NEVER block app startup
                console.warn('Push notification setup failed gracefully:', e);
            }
        };

        registerPush();

        return () => {
            import('@capacitor/push-notifications').then(({ PushNotifications }) => {
                PushNotifications.removeAllListeners();
            }).catch(() => { });
        };
    }, []);

    return null;
}
