"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { SmartCard } from "./ui/smart-card";
import { Users, UserPlus, Trophy, Flame, MessageCircle, Send, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-client";
import { User, RealtimeChannel } from "@supabase/supabase-js";

interface GroupMember {
    id: string;
    email: string;
    name: string;
    streak: number;
    progress: number;
    lastActive: string;
    isOnline: boolean;
}

interface Presence {
    name: string;
    online_at?: string;
    streak?: number;
    progress?: number;
    presence_ref?: string;
}

interface BroadcastPayload {
    memberName?: string;
    userName?: string;
    type?: string;
    text?: string;
    from?: string;
    to?: string;
    emoji?: string;
}

interface DBMessage {
    id: number;
    group_id: string;
    user_name: string;
    user_email: string;
    message: string;
    type: string; // 'chat', 'system', etc.
    created_at: string;
}

interface GroupChallengeViewProps {
    user: User | null;
    streak: number;
    progress: number;
}

export default function GroupChallengeView({ user, streak, progress }: GroupChallengeViewProps) {
    const [groupId, setGroupId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState("");
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [messages, setMessages] = useState<{ user: string, text: string, type: string }[]>([]);
    const [presenceState, setPresenceState] = useState<Record<string, Presence[]>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [pokeNotification, setPokeNotification] = useState<{ from: string, emoji: string } | null>(null);
    const supabase = createClient();

    // Load group from local storage or DB
    useEffect(() => {
        const savedGroup = localStorage.getItem('bible_group_id');
        if (savedGroup) setGroupId(savedGroup);
    }, []);

    // Load messages from Supabase (Persistent)
    useEffect(() => {
        if (!groupId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Error fetching messages:", error);
            } else if (data) {
                // Map DB format to UI format
                const formatted = (data as DBMessage[]).map((m) => ({
                    user: m.user_name,
                    text: m.message,
                    type: m.type
                }));
                setMessages(formatted);
            }
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase.channel(`group-chat-${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`
            }, (payload: any) => {
                const newMsg = payload.new as DBMessage;
                setMessages(prev => [{
                    user: newMsg.user_name,
                    text: newMsg.message,
                    type: newMsg.type
                }, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, supabase]);

    // Sync Members from Chat History and Presence (Updated to use DB messages)
    useEffect(() => {
        const uniqueUsers = new Set<string>();
        // 1. Get users from chat history
        messages.forEach(msg => {
            if (msg.user !== 'System') uniqueUsers.add(msg.user);
        });

        // 2. Get users from Presence State
        Object.values(presenceState).forEach((presences) => {
            if (Array.isArray(presences)) {
                presences.forEach((p) => {
                    if (p.name) uniqueUsers.add(p.name);
                });
            }
        });

        // 3. Current User
        if (user) {
            uniqueUsers.add(user.email?.split('@')[0] || '익명');
        }

        const updatedMembers = Array.from(uniqueUsers).map(userName => {
            // Check if user is in presence state (Online)
            let isOnline = false;
            let lastActive = new Date().toISOString();

            // Check presence for online status
            const onlinePresence = Object.values(presenceState).flat().find((p) => p.name === userName);
            if (onlinePresence) {
                isOnline = true;
                lastActive = onlinePresence.online_at || new Date().toISOString();
            }

            const memberStreak = onlinePresence?.streak ?? (userName === (user?.email?.split('@')[0] || '익명') ? streak : Math.floor(Math.random() * 20));
            const memberProgress = onlinePresence?.progress ?? (userName === (user?.email?.split('@')[0] || '익명') ? progress : Math.floor(Math.random() * 100));

            return {
                id: userName,
                email: "",
                name: userName,
                streak: memberStreak,
                progress: memberProgress,
                lastActive: lastActive,
                isOnline: isOnline
            };
        });

        updatedMembers.sort((a, b) => {
            if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
            return a.isOnline ? -1 : 1;
        });

        setMembers(updatedMembers);

    }, [messages, presenceState, user, streak, progress]);

    // Supabase Realtime Sync
    useEffect(() => {
        if (!groupId || !user) return;

        const channel = supabase.channel(`group-${groupId}`, {
            config: {
                presence: { key: user.id }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setPresenceState(state as Record<string, Presence[]>);
            })
            .on('broadcast', { event: 'activity' }, (payload: { payload: BroadcastPayload }) => {
                const actualPayload = (payload as any).payload || payload;
                const { memberName: name, type: msgType } = actualPayload as BroadcastPayload;

                if (name && msgType) {
                    const msg = msgType === 'complete'
                        ? `${name}님이 오늘의 말씀을 완독했습니다! 🎉`
                        : `${name}님이 성경 읽기를 시작했습니다. 🙌`;
                    setMessages(prev => [{ user: 'System', text: msg, type: 'system' }, ...prev].slice(0, 50));
                }
            })

            .on('broadcast', { event: 'poke' }, (payload: any) => {
                const actualPayload = (payload as any).payload || payload;
                const { from, to, emoji } = actualPayload as BroadcastPayload;
                const myName = user.email?.split('@')[0] || '익명';
                // Only show notification if I am the target
                if (to === myName && from && emoji) {
                    setPokeNotification({ from, emoji });
                    setTimeout(() => setPokeNotification(null), 3000);
                }
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    await channel.track({
                        id: user.id,
                        name: user.email?.split('@')[0] || '익명',
                        online_at: new Date().toISOString(),
                        streak: streak,
                        progress: progress
                    });
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                }
            });


        return () => {
            supabase.removeChannel(channel);
            setIsConnected(false);
        };
    }, [groupId, user, streak, progress, supabase]);

    const handleJoinGroup = () => {
        if (inviteCode.trim()) {
            setGroupId(inviteCode);
            localStorage.setItem('bible_group_id', inviteCode);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !groupId) return;

        const userName = user?.email?.split('@')[0] || '익명';
        const text = newMessage;

        // Insert into DB
        const { error } = await supabase.from('group_messages').insert({
            group_id: groupId,
            user_name: userName,
            user_email: user?.email,
            message: text,
            type: 'chat'
        });

        if (error) {
            console.error("Message send failed:", error);
            alert("메시지 전송 실패");
        } else {
            setNewMessage("");
        }
    };

    const handlePoke = (targetName: string) => {
        if (!groupId || !user) return;
        const myName = user.email?.split('@')[0] || '익명';

        supabase.channel(`group-${groupId}`).send({
            type: 'broadcast',
            event: 'poke',
            payload: { from: myName, to: targetName, emoji: "👋" }
        });
    };

    if (!groupId) {
        return (
            <div className="space-y-6 py-4 animate-in fade-in duration-700">
                <SmartCard variant="elevated" className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-serif font-black mb-2">공동체와 함께 읽기</h2>
                    <p className="text-sm text-muted-foreground mb-8">가족, 교회, 소그룹 멤버들과 함께 읽으며<br />서로 격려하고 진행률을 공유해보세요.</p>

                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="초대 코드 입력 (예: MYCHURCH)"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-4 text-center font-bold tracking-widest outline-none focus:border-primary transition-all"
                        />
                        <button
                            onClick={handleJoinGroup}
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            그룹 참여하기
                        </button>
                    </div>
                </SmartCard>

                <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">OR</span>
                    <div className="flex-1 h-px bg-border/50" />
                </div>

                <button className="w-full py-3 rounded-2xl border border-dashed border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 transition-all flex items-center justify-center gap-2">
                    <UserPlus size={14} />
                    새로운 챌린지 그룹 만들기
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-2 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-tighter">Group Challenge</div>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black leading-none">{groupId}</h2>
                        <button
                            onClick={() => {
                                if (groupId) {
                                    const text = `[성경 365] 함께 읽기에 초대합니다! 🙌\n\n초대 코드: ${groupId}\n\n앱에서 코드를 입력하고 참여해보세요.`;
                                    navigator.clipboard.writeText(text);
                                    alert("초대 메시지가 복사되었습니다");
                                }
                            }}
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-1"
                        >
                            <span>초대 코드 복사</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            const { encryptInviteCode } = await import("@/lib/crypto");
                            const encryptedCode = encryptInviteCode(groupId);

                            import("@/lib/share-service").then(({ shareViaKakao }) => {
                                shareViaKakao(
                                    `[성경 365] 함께 읽기 초대장 💌\n\n초대 코드: ${groupId}\n\n우리 함께 말씀을 읽으며 서로 격려해요!`,
                                    `https://bible-365-app.vercel.app/invite?code=${encryptedCode}`
                                );
                            });
                        }}
                        className="p-2 bg-[#FEE500] text-[#3C1E1E] rounded-full hover:bg-[#FEE500]/80 transition-colors shadow-sm"
                        title="카카오톡 초대"
                    >
                        <MessageCircle size={14} className="fill-[#3C1E1E] stroke-none" />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("정말 그룹에서 나가시겠습니까?")) {
                                localStorage.removeItem('bible_group_id');
                                setGroupId(null);
                            }
                        }}
                        className="p-2 bg-muted text-muted-foreground rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                        title="그룹 나가기"
                    >
                        <span className="text-xs font-bold">OUT</span>
                    </button>
                </div>
            </div>

            {/* Leaderboard Summary */}
            <SmartCard variant="default" className="p-4 bg-muted/20 border-border/30">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                    {members.length > 0 ? members.slice(0, 5).map((member, i) => (
                        <div key={i} className="flex-none flex flex-col items-center gap-2 min-w-[60px]">
                            <div className="relative">
                                <div className={cn(
                                    "w-12 h-12 rounded-full border-2 bg-background overflow-hidden flex items-center justify-center text-xs font-bold",
                                    member.name === (user?.email?.split('@')[0] || '익명') ? "border-primary text-primary" : "border-muted-foreground/20"
                                )}>
                                    {member.name.substring(0, 2)}
                                </div>
                                {i === 0 && <Trophy className="absolute -top-2 -right-2 text-yellow-500 fill-yellow-500" size={16} />}
                                {member.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold truncate w-14">{member.name}</p>
                                <div className="flex items-center gap-0.5 justify-center mb-1">
                                    <Flame size={8} className="text-orange-500" />
                                    <span className="text-[9px] font-bold">{member.streak} 일</span>
                                </div>
                                {member.name !== (user?.email?.split('@')[0] || '익명') && (
                                    <button
                                        onClick={() => handlePoke(member.name)}
                                        className="text-[8px] bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold transition-colors"
                                    >
                                        응원하기
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="w-full text-center py-4 text-xs text-muted-foreground">
                            아직 멤버가 없습니다. 친구를 초대해보세요!
                        </div>
                    )}
                    <div className="w-px h-10 bg-border/50" />
                    <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-50">
                        <Users size={16} className="text-muted-foreground" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">More members</span>
                    </div>
                </div>
            </SmartCard>

            {/* Realtime Activity & Chat */}
            <SmartCard variant="elevated" className="bg-card flex flex-col min-h-[400px]">
                {/* Messages List */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto h-[320px] no-scrollbar">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30 py-20">
                            <MessageCircle size={32} />
                            <p className="text-xs font-bold">첫 인사를 나누거나<br />오늘의 읽기를 완료하고 소식을 전해보세요.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={cn(
                            "group animate-in slide-in-from-bottom-2 duration-300",
                            (msg.type === 'system' || msg.user === 'System') ? "flex justify-center" : "flex flex-col items-start"
                        )}>
                            {(msg.type === 'system' || msg.user === 'System') ? (
                                <span className="bg-primary/5 text-primary text-[9px] font-bold px-3 py-1 rounded-full border border-primary/10">
                                    {msg.text}
                                </span>
                            ) : (
                                <div className="max-w-[85%]">
                                    <span className="text-[9px] font-bold text-muted-foreground ml-1 mb-1 block uppercase tracking-tighter">{msg.user}</span>
                                    <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-none text-xs font-medium shadow-sm border border-border/30">
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="메시지 입력..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-primary/50 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/10"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </SmartCard>

            {/* Live Status */}
            <div className="flex items-center gap-2 px-2 text-[10px] text-muted-foreground font-bold italic">
                <Zap size={10} className={cn("transition-colors", isConnected ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
                <span>{isConnected ? "실시간으로 다른 지체들과 연결되어 있습니다" : "연결 중입니다..."}</span>
            </div>

            {/* Poke Notification Overlay */}
            {pokeNotification && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 animate-in zoom-in-50 fade-in duration-300">
                    <div className="bg-background/90 backdrop-blur-md border border-primary/20 shadow-2xl rounded-3xl p-6 text-center space-y-2 pointer-events-auto">
                        <div className="text-4xl animate-bounce">{pokeNotification.emoji}</div>
                        <div>
                            <p className="text-sm font-black text-primary">{pokeNotification.from}님의 응원!</p>
                            <p className="text-xs text-muted-foreground">함께 기도하고 있어요</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
