import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase-client';
import WidgetDataBridge from "@/lib/widget-bridge";
import { Database } from '@/types/supabase';

type UserReading = Database['public']['Tables']['user_readings']['Row'];
export interface JournalEntry {
    id: string;
    plan_id: number | null;
    content: string;
    mood?: string;
    rhema_verse?: string; // New field for tagged bible verse
    ai_feedback?: string;
    created_at: string;
    updated_at?: string; // Added for sync
}

interface BibleState {
    // State
    completedPlanIds: number[];
    streak: number;
    journals: JournalEntry[];
    activityLog: Record<string, number>;
    isLoading: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    currentTeaser: string;
    isAiEnabled: boolean; // New AI context status (Requested Option 2)

    // Offline Mutation Queue
    offlineMutations: {
        readings: Record<number, 'insert' | 'delete'>; // id -> action
        journals: string[]; // ids of modified journals
    };

    // Actions
    toggleReading: (planId: number, userId?: string) => Promise<void>;
    updateWidget: (teaser?: string) => Promise<void>;
    addJournal: (entry: Omit<JournalEntry, 'id' | 'created_at'>, userId?: string) => Promise<void>;
    logActivity: (dateStr: string, level: number) => void;
    toggleAiStatus: (enabled: boolean) => void; // Added for Option 2
    loadInitialData: (userId?: string) => Promise<void>;
    syncWithSupabase: (userId: string) => Promise<void>;

    // Optimistic Helpers
    isCompleted: (planId: number) => boolean;
}

export const useBibleStore = create<BibleState>()(
    persist(
        (set, get) => ({
            completedPlanIds: [],
            streak: 0,
            journals: [],
            activityLog: {},
            isLoading: false,
            isSyncing: false,
            lastSyncedAt: null,
            currentTeaser: "내가 너와 함께 있어 네가 어디로 가든지 너를 지키며 (창 28:15)",
            isAiEnabled: true, // Default to ON for premium experience
            offlineMutations: { readings: {}, journals: [] },

            isCompleted: (planId) => get().completedPlanIds.includes(planId),

            loadInitialData: async (userId) => {
                const state = get();
                if (userId) {
                    // Start sync in background if we have data or it's been a while
                    // For now, if no data, fetch immediately.
                    if (state.completedPlanIds.length === 0 && !state.lastSyncedAt) {
                        get().syncWithSupabase(userId);
                    }
                }
            },

            toggleReading: async (planId, userId) => {
                const { completedPlanIds, offlineMutations } = get();
                const isAlreadyCompleted = completedPlanIds.includes(planId);
                const supabase = createClient();
                const action = isAlreadyCompleted ? 'delete' : 'insert';

                // 1. Optimistic Update
                if (isAlreadyCompleted) {
                    set({ completedPlanIds: completedPlanIds.filter(id => id !== planId) });
                } else {
                    set({ completedPlanIds: [...completedPlanIds, planId] });
                }

                // 2. Queue Mutation (assume offline first)
                // If action cancels previous pending action? e.g. insert then delete -> remove from queue?
                // Logic: if queued 'insert' and now 'delete' -> remove key.
                // if queued 'delete' and now 'insert' -> remove key.
                // However, simpler to just overwrite with latest intent for now.
                const newReadings: Record<number, 'insert' | 'delete'> = { ...offlineMutations.readings, [planId]: action };
                set({ offlineMutations: { ...offlineMutations, readings: newReadings } });

                // 3. Update Widget
                get().updateWidget();

                // 4. Try Immediate Sync (if logged in)
                if (userId) {
                    try {
                        if (action === 'delete') {
                            const { error } = await supabase.from('user_readings').delete().eq('user_id', userId).eq('plan_id', planId);
                            if (error) throw error;
                        } else {
                            const { error } = await supabase.from('user_readings').insert({ user_id: userId, plan_id: planId });
                            if (error) throw error;
                        }

                        // If successful, remove from queue
                        const currentMutations = get().offlineMutations;
                        const { [planId]: _, ...remaining } = currentMutations.readings;
                        set({ offlineMutations: { ...currentMutations, readings: remaining } });

                    } catch (e) {
                        console.warn("Offline: Action queued", e);
                        // Queue remains populated
                    }
                }
            },

            addJournal: async (entry, userId) => {
                const newJournal: JournalEntry = {
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ...entry,
                    plan_id: entry.plan_id ?? null
                };

                const { journals, offlineMutations } = get();
                set({
                    journals: [newJournal, ...journals],
                    offlineMutations: {
                        ...offlineMutations,
                        journals: [...offlineMutations.journals, newJournal.id]
                    }
                });

                if (userId) {
                    const supabase = createClient();
                    try {
                        const payload = {
                            user_id: userId,
                            ...newJournal
                        };
                        const { error } = await supabase.from('journal_entries').upsert(payload);
                        if (error) throw error;

                        // Success: clear from queue
                        const currentMutations = get().offlineMutations;
                        set({
                            offlineMutations: {
                                ...currentMutations,
                                journals: currentMutations.journals.filter(id => id !== newJournal.id)
                            }
                        });

                        // Trigger Embedding Generation (Fire and forget)
                        fetch('/api/journal/embed', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                journalId: newJournal.id,
                                content: newJournal.content,
                                userId: userId
                            })
                        }).catch(err => console.error("Embedding trigger failed:", err));

                    } catch (e) {
                        console.warn("Offline: Journal queued", e);
                    }
                }
            },


            updateWidget: async (teaser?: string) => {
                try {
                    if (teaser) {
                        set({ currentTeaser: teaser });
                    }
                    const state = get();
                    const completedCount = state.completedPlanIds.length;
                    const today = new Date();
                    const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

                    await WidgetDataBridge.updateWidgetData({
                        title: "성경 365",
                        verse: `오늘 ${state.activityLog[dateStr] === 3 ? '묵상 완료' : state.activityLog[dateStr] === 2 ? '영상 시청' : '말씀 읽기'}`,
                        progress: Math.min(completedCount, 100),
                        date: dateStr,
                        teaserVerse: state.currentTeaser
                    });
                } catch (e) {
                    console.error("Widget Update Failed:", e);
                }
            },

            logActivity: (dateStr, level) => {
                set(state => {
                    const currentLevel = state.activityLog[dateStr] || 0;
                    // Only update if new level is higher (1 -> 2 -> 3)
                    if (level > currentLevel) {
                        return { activityLog: { ...state.activityLog, [dateStr]: level } };
                    }
                    return state;
                });
            },
            toggleAiStatus: (enabled) => {
                set({ isAiEnabled: enabled });
            },

            syncWithSupabase: async (userId) => {
                if (!userId) return;

                const { isSyncing, offlineMutations, lastSyncedAt, journals } = get();
                if (isSyncing) return; // Prevent double sync

                set({ isSyncing: true });
                const supabase = createClient();

                try {
                    // 1. UPLOAD: Process Offline Mutations

                    // A. Readings
                    const readingIds = Object.keys(offlineMutations.readings).map(Number);
                    if (readingIds.length > 0) {
                        const inserts = readingIds.filter(id => offlineMutations.readings[id] === 'insert');
                        const deletes = readingIds.filter(id => offlineMutations.readings[id] === 'delete');

                        if (inserts.length > 0) {
                            const payload = inserts.map(id => ({ user_id: userId, plan_id: id, platform: 'web_sync' }));
                            await supabase.from('user_readings').upsert(payload, { onConflict: 'user_id, plan_id', ignoreDuplicates: true });
                        }
                        if (deletes.length > 0) {
                            await supabase.from('user_readings').delete().eq('user_id', userId).in('plan_id', deletes);
                        }

                        // Clear readings queue
                        set(state => ({ offlineMutations: { ...state.offlineMutations, readings: {} } }));
                    }

                    // B. Journals
                    if (offlineMutations.journals.length > 0) {
                        const dirtyJournals = journals.filter(j => offlineMutations.journals.includes(j.id));
                        if (dirtyJournals.length > 0) {
                            const payload = dirtyJournals.map(j => ({
                                id: j.id,
                                user_id: userId,
                                plan_id: j.plan_id,
                                content: j.content,
                                mood: j.mood,
                                rhema_verse: j.rhema_verse,
                                ai_feedback: j.ai_feedback,
                                created_at: j.created_at,
                                updated_at: j.updated_at || new Date().toISOString()
                            }));
                            const { error } = await supabase.from('journal_entries').upsert(payload);
                            if (!error) {
                                set(state => ({ offlineMutations: { ...state.offlineMutations, journals: [] } }));
                            }
                        }
                    }

                    // 2. DOWNLOAD: Delta Pull

                    // A. Readings: Always fetch full list of IDs (lightweight) to handle deletions from other devices correctly
                    const { data: remoteReadings } = await supabase
                        .from('user_readings')
                        .select('plan_id')
                        .eq('user_id', userId);

                    if (remoteReadings) {
                        const remoteIds = remoteReadings.map((r: { plan_id: number }) => r.plan_id);
                        set({ completedPlanIds: remoteIds });
                    }

                    // B. Journals: Delta fetch
                    let journalQuery = supabase.from('journal_entries').select('*').eq('user_id', userId);
                    if (lastSyncedAt) {
                        // Assuming 'created_at' for now, ideally 'updated_at' if schema supports
                        // If schema doesn't have updated_at, fallback to created_at
                        journalQuery = journalQuery.gt('created_at', lastSyncedAt);
                    }

                    const { data: newJournals } = await journalQuery;

                    if (newJournals && newJournals.length > 0) {
                        set(state => {
                            const incoming = newJournals.map((j: any) => ({
                                id: j.id,
                                plan_id: j.plan_id,
                                content: j.content,
                                mood: j.mood,
                                rhema_verse: j.rhema_verse,
                                ai_feedback: j.ai_feedback,
                                created_at: j.created_at,
                                updated_at: j.updated_at
                            }));

                            // Merge: Incoming wins
                            const existingIds = new Set(state.journals.map(j => j.id));
                            // Map existing journals by ID
                            const mergedMap = new Map(state.journals.map(j => [j.id, j]));

                            // Update or Add incoming
                            incoming.forEach((j: JournalEntry) => mergedMap.set(j.id, j));

                            const mergedArray = Array.from(mergedMap.values()).sort((a, b) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            );

                            return { journals: mergedArray };
                        });
                    }

                    set({ lastSyncedAt: new Date().toISOString() });

                } catch (e) {
                    console.error("Sync Cycle Failed:", e);
                } finally {
                    set({ isSyncing: false });
                }
            }
        }),
        {
            name: 'bible-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                completedPlanIds: state.completedPlanIds,
                journals: state.journals,
                activityLog: state.activityLog,
                lastSyncedAt: state.lastSyncedAt,
                currentTeaser: state.currentTeaser,
                isAiEnabled: state.isAiEnabled,
                offlineMutations: state.offlineMutations
            }),
        }
    )
);
