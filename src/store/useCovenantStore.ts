import { create } from 'zustand';
import { createClient } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- Types ---
export interface SquadMember {
    id: string; // user_id or email hash
    name: string;
    avatarUrl?: string;
    isOnline: boolean;
    status: 'idle' | 'reading' | 'reflecting' | 'done';
    currentReading?: string; // e.g. "Psalm 23"
    lastActive: string;
    streak: number;
}

export interface SquadMessage {
    id: number;
    user_name: string;
    user_email?: string;
    message: string;
    type: 'chat' | 'reflection' | 'system' | 'nudge';
    created_at: string;
    payload?: any; // For rich content like audio duration, verse ref
}

interface CovenantState {
    groupId: string | null;
    members: SquadMember[];
    messages: SquadMessage[];
    isConnected: boolean;

    // Actions
    setGroupId: (id: string | null) => void;
    joinSquad: (code: string, user: any) => Promise<void>;
    leaveSquad: () => void;
    sendMessage: (content: string, type?: SquadMessage['type'], userPayload?: any) => Promise<void>;
    updateStatus: (status: SquadMember['status'], reading?: string) => Promise<void>;
    sendNudge: (targetName: string) => Promise<void>;

    // Internal
    _channel: RealtimeChannel | null;
    _cleanup: () => void;
}

export const useCovenantStore = create<CovenantState>((set, get) => ({
    groupId: null,
    members: [],
    messages: [],
    isConnected: false,
    _channel: null,

    setGroupId: (id) => {
        if (id) localStorage.setItem('bible_group_id', id);
        else localStorage.removeItem('bible_group_id');
        set({ groupId: id });
    },

    joinSquad: async (code, user) => {
        const supabase = createClient();
        get().setGroupId(code);

        // 1. Load History
        const { data } = await supabase
            .from('group_messages')
            .select('*')
            .eq('group_id', code)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            set({
                messages: (data as any[]).map(m => ({
                    ...m,
                    type: m.type || 'chat'
                }))
            });
        }

        // 2. Setup Realtime
        const channel = supabase.channel(`squad-${code}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const members: SquadMember[] = [];

                // Merge presence state into member list
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        members.push({
                            id: p.name, // using name as ID for simplicity if user.id absent
                            name: p.name,
                            isOnline: true,
                            status: p.status || 'idle',
                            currentReading: p.currentReading,
                            lastActive: p.online_at,
                            streak: p.streak || 0
                        });
                    });
                });

                // Deduplicate by name/id
                const unique = Array.from(new Map(members.map(m => [m.name, m])).values());
                set({ members: unique });
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${code}`
            }, (payload: { new: any }) => {
                const newMsg = payload.new;
                set(state => {
                    if (state.messages.some(m => m.id === newMsg.id)) return state;
                    return {
                        messages: [{
                            ...newMsg,
                            type: newMsg.type || 'chat'
                        } as SquadMessage, ...state.messages]
                    };
                });
            })
            .on('broadcast', { event: 'nudge' }, (payload: { payload: { to: string, from: string } }) => {
                // Check if payload is nested or direct
                const data = payload.payload || payload;
                const { to } = data as { to: string, from: string };

                // Handle nudge (show toast, vibrate)
                // We'll expose this via a computed selector or event emitter pattern if needed
                // For now, just log or add a system message locally?
                // Actually, let's add a temporary message
                if (to === user.email?.split('@')[0]) {
                    // It's for me!
                    // Implementation detail: User component should listen to store changes or we use a separate "notifications" array
                }
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    set({ isConnected: true });
                    await channel.track({
                        name: user.email?.split('@')[0] || 'Anonymous',
                        online_at: new Date().toISOString(),
                        status: 'idle',
                        streak: 0 // Fetch actual streak from user profile if available
                    });
                }
            });

        set({ _channel: channel });
    },

    leaveSquad: () => {
        get()._cleanup();
        get().setGroupId(null);
    },

    sendMessage: async (content, type = 'chat', userPayload) => {
        const { groupId } = get();
        if (!groupId) return;

        const supabase = createClient();
        let user = userPayload;
        if (!user) {
            const { data } = await supabase.auth.getUser();
            user = data?.user;
        }

        const userName = user?.email?.split('@')[0] || user?.user_metadata?.first_name || 'Anonymous';
        const userEmail = user?.email || '';

        // Optimistic UI update
        const tempMsg: SquadMessage = {
            id: Date.now() + Math.random(), // Temporary ID
            user_name: userName,
            user_email: userEmail,
            message: content,
            type: type as any,
            created_at: new Date().toISOString()
        };

        set(state => ({ messages: [tempMsg, ...state.messages] }));

        const { data } = await supabase.from('group_messages').insert({
            group_id: groupId,
            user_name: userName,
            user_email: userEmail,
            message: content,
            type,
        }).select().single();

        // Update temp message with real DB message
        if (data) {
            set(state => ({
                messages: state.messages.map(m => m.id === tempMsg.id ? data as SquadMessage : m)
            }));
        }
    },

    updateStatus: async (status, reading) => {
        const { _channel } = get();
        if (_channel) {
            await _channel.track({
                status,
                currentReading: reading,
                online_at: new Date().toISOString()
            });
        }
    },

    sendNudge: async (targetName) => {
        const { _channel, groupId } = get();
        if (_channel && groupId) {
            await _channel.send({
                type: 'broadcast',
                event: 'nudge',
                payload: { to: targetName, from: 'Me' } // 'Me' should be real name
            });
        }
    },

    _cleanup: () => {
        const { _channel } = get();
        if (_channel) {
            const supabase = createClient();
            supabase.removeChannel(_channel);
        }
        set({ isConnected: false, members: [], messages: [], _channel: null });
    }
}));
