"use client";



import React, { useEffect, useState, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { useCovenantStore } from "@/store/useCovenantStore";

import { User } from "@supabase/supabase-js";

import { Users, Send, Copy, LogOut, MessageSquare, Loader2, ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { shareContent } from "@/lib/share-service";



// --- Chat Bubble Component ---

const ChatBubble = ({ msg, isMine }: { msg: any; isMine: boolean }) => {

    if (msg.type === 'system') {

        return (

            <div className="flex justify-center my-3">

                <div className="px-4 py-2 bg-primary/5 rounded-full border border-primary/15 max-w-[85%]">

                    <p className="text-[11px] font-bold text-primary/70 leading-relaxed whitespace-pre-wrap text-center">

                        {msg.message}

                    </p>

                </div>

            </div>

        );

    }



    return (

        <div className={cn("flex items-end gap-2 max-w-[85%]", isMine ? "ml-auto flex-row-reverse" : "mr-auto")}>

            {/* Avatar (only for others) */}

            {!isMine && (

                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-muted text-muted-foreground shadow-sm mb-1">

                    {msg.user_name.slice(0, 1)}

                </div>

            )}



            <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>

                {/* Name (only for others) */}

                {!isMine && (

                    <span className="text-[11px] font-semibold text-foreground/60 mb-1 ml-1">{msg.user_name}</span>

                )}



                {/* Bubble */}

                <div className={cn(

                    "px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm",

                    isMine

                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"

                        : "bg-card border border-border/50 text-foreground/90 rounded-2xl rounded-bl-md"

                )}>

                    {msg.message}

                </div>



                {/* Time */}

                <span className={cn("text-[10px] text-muted-foreground/60 mt-0.5", isMine ? "mr-1" : "ml-1")}>

                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

                </span>

            </div>

        </div>

    );

};



// --- Chat Feed ---

const ChatFeed = ({ messages, myName }: { messages: any[]; myName: string }) => {

    const feedRef = useRef<HTMLDivElement>(null);



    useEffect(() => {

        if (feedRef.current) {

            feedRef.current.scrollTop = feedRef.current.scrollHeight;

        }

    }, [messages]);



    return (

        <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 no-scrollbar">

            {messages.length === 0 && (

                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-3 pt-16">

                    <MessageSquare className="w-10 h-10 text-primary/40" />

                    <p className="text-sm font-medium">?꾩쭅 ?섎닎???놁뒿?덈떎.<br />?ㅻ뒛 諛쏆? ??쒕? 媛??癒쇱? ?섎닠蹂댁꽭??</p>

                </div>

            )}



            {messages.slice().reverse().map((msg, i) => (

                <motion.div

                    key={msg.id || i}

                    initial={{ opacity: 0, y: 8 }}

                    animate={{ opacity: 1, y: 0 }}

                    transition={{ duration: 0.25 }}

                >

                    <ChatBubble msg={msg} isMine={msg.user_name === myName} />

                </motion.div>

            ))}

        </div>

    );

};



// --- Main Component ---

interface GroupDashboardViewProps {

    user: User | null;

    streak: number;

    progress: number;

    onTabChange?: (tab: string) => void;

}



export default function GroupDashboardView({ user, streak, progress, onTabChange }: GroupDashboardViewProps): React.JSX.Element | null {

    const {

        groupId,

        members,

        messages,

        isConnected,

        joinSquad,

        setGroupId,

        sendMessage,

        sendNudge,

        leaveSquad

    } = useCovenantStore();



    const [inviteCodeInput, setInviteCodeInput] = useState("");

    const [inputText, setInputText] = useState("");

    const [isJoining, setIsJoining] = useState(false);

    const [showMembersPopup, setShowMembersPopup] = useState(false);



    // Group Creation Modal State

    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newGroupName, setNewGroupName] = useState("");

    const [newGroupTheme, setNewGroupTheme] = useState("留ㅼ씪 1??留먯? 臾듭긽");

    const THEMES = ["留ㅼ씪 1??留먯? 臾듭긽", "?좎뼵 吏???먭뎄", "諛붿슱?쒖떊 源딆씠 ?쎄린", "紐⑥꽭?ㅺ꼍 ?뺣났", "?먯쑀濡쒖슫 ?섎닎"];



    // Generate anonymous user if not logged in

    const cachedAnon = typeof window !== 'undefined' ? localStorage.getItem('anon_user') : null;

    let effectiveUser = user;

    if (!effectiveUser) {

        if (!cachedAnon) {

            const newName = '??쒕줈????' + Math.floor(Math.random() * 900 + 100);

            localStorage.setItem('anon_user', newName);

            effectiveUser = { id: 'anon_' + Date.now(), email: newName + '@anon.com', user_metadata: { first_name: newName } } as any;

        } else {

            effectiveUser = { id: 'anon_cached', email: cachedAnon + '@anon.com', user_metadata: { first_name: cachedAnon } } as any;

        }

    }



    const myName = (effectiveUser as any)?.user_metadata?.first_name || cachedAnon || '익명';



    // Initialize

    useEffect(() => {

        const saved = localStorage.getItem('bible_group_id');

        if (saved && !groupId) {

            joinSquad(saved, effectiveUser);

        }

    }, [effectiveUser, groupId, joinSquad]);



    const handleJoin = async () => {

        if (!inviteCodeInput.trim()) return;

        setIsJoining(true);

        await joinSquad(inviteCodeInput.trim().toUpperCase(), effectiveUser);

        setIsJoining(false);

    };



    const handleCreateGroup = async () => {

        setIsJoining(true);

        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        await joinSquad(newCode, effectiveUser);



        await sendMessage(`🎉 [${newGroupName || '새로운 코이노니아'}] 그룹이 시작되었습니다!\n\n이번 테마: ${newGroupTheme}\n서로를 격려하며 말씀을 묵상해보세요.`, 'system', effectiveUser);



        setShowCreateModal(false);

        setIsJoining(false);



        const shareText = `[성경 365]\n'${newGroupName || '새로운 코이노니아'}' 그룹의 멤버로 초대합니다.\n\n초대 코드: ${newCode}\n성경 읽고 나누며 함께 은혜받아요!`;

        shareContent("코이노니아 초대", shareText);

    };



    const handleSend = () => {

        if (inputText.trim()) {

            sendMessage(inputText, 'chat', user);

            setInputText("");

        }

    };



    // --- Lobby (No Group Joined) ---

    if (!groupId) {

        return (

            <div className="h-[80vh] flex flex-col items-center justify-center space-y-8 px-6 animate-in fade-in zoom-in-95 duration-700">

                <div className="text-center space-y-4">

                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3">

                        <Users className="w-10 h-10 text-primary -rotate-3" />

                    </div>

                    <h2 className="text-3xl font-serif font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">

                        嫄곕）??紐⑥엫

                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px] mx-auto">

                        怨듬룞泥댁? ?④퍡 留먯???臾듭긽?섍퀬<br />諛쏆? ??쒕? ?섎늻??蹂댁꽭??

                    </p>

                </div>



                <div className="w-full max-w-sm space-y-4">

                    <div className="relative">

                        <input

                            type="text"

                            placeholder="珥덈? 肄붾뱶 ?낅젰"

                            value={inviteCodeInput}

                            onChange={(e) => setInviteCodeInput(e.target.value)}

                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}

                            className="w-full h-14 pl-6 pr-14 text-lg font-bold rounded-2xl bg-card border border-border focus:border-primary/50 outline-none shadow-sm transition-all uppercase placeholder:normal-case placeholder:font-normal"

                        />

                        <button

                            onClick={handleJoin}

                            disabled={isJoining}

                            className="absolute right-2 top-2 bottom-2 w-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"

                        >

                            {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}

                        </button>

                    </div>



                    <div className="flex items-center gap-4 py-4 opacity-50">

                        <div className="h-px flex-1 bg-border" />

                        <span className="text-xs font-medium">?먮뒗</span>

                        <div className="h-px flex-1 bg-border" />

                    </div>



                    <button

                        onClick={() => setShowCreateModal(true)}

                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"

                    >

                        ?덈줈??洹몃９ 留뚮뱾湲?

                    </button>

                </div>



                {/* Create Group Modal */}

                <AnimatePresence>

                    {showCreateModal && (

                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

                            <motion.div

                                initial={{ opacity: 0 }}

                                animate={{ opacity: 1 }}

                                exit={{ opacity: 0 }}

                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"

                                onClick={() => setShowCreateModal(false)}

                            />

                            <motion.div

                                initial={{ opacity: 0, scale: 0.95, y: 20 }}

                                animate={{ opacity: 1, scale: 1, y: 0 }}

                                exit={{ opacity: 0, scale: 0.95, y: 20 }}

                                className="relative bg-card w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-hidden"

                            >

                                <div className="space-y-6 relative z-10">

                                    <div className="text-center space-y-2">

                                        <h3 className="text-xl font-serif font-black">肄붿씠?몃땲???좎꽕</h3>

                                        <p className="text-xs text-muted-foreground font-medium">?덈줈???뚭렇猷뱀쓣 留뚮뱾怨?吏?몃뱾??珥덈??섏꽭??</p>

                                    </div>



                                    <div className="space-y-4">

                                        <div className="space-y-2">

                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">洹몃９ ?대쫫</label>

                                            <input

                                                type="text"

                                                className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border/50 text-sm font-bold focus:border-primary/50 outline-none transition-colors"

                                                placeholder="예: 예담 청년부 1조"

                                                value={newGroupName}

                                                onChange={e => setNewGroupName(e.target.value)}

                                            />

                                        </div>

                                        <div className="space-y-2">

                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">異붿쿇 ?뚮쭏 (?좏깮)</label>

                                            <div className="flex flex-wrap gap-2">

                                                {THEMES.map(t => (

                                                    <button

                                                        key={t}

                                                        onClick={() => setNewGroupTheme(t)}

                                                        className={cn(

                                                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",

                                                            newGroupTheme === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"

                                                        )}

                                                    >

                                                        {t}

                                                    </button>

                                                ))}

                                            </div>

                                        </div>

                                    </div>



                                    <div className="pt-2">

                                        <button

                                            onClick={handleCreateGroup}

                                            disabled={isJoining}

                                            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"

                                        >

                                            {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : '紐⑥엫 ?쒖옉?섍린 (珥덈? 留곹겕 ?앹꽦)'}

                                        </button>

                                    </div>

                                </div>

                            </motion.div>

                        </div>

                    )}

                </AnimatePresence>

            </div>

        );

    }



    // --- Chat Room (Group Joined) ---

    const onlineCount = members.filter((m: any) => m.isOnline).length;



    return (

        <div className="fixed inset-0 z-40 flex flex-col bg-background" style={{ willChange: 'auto' }}>

            {/* Compact Chat Header */}

            <div className="shrink-0 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>

                <div className="flex items-center justify-between px-4 py-2.5">

                    <div className="flex items-center gap-3">

                        <button

                            onClick={() => onTabChange?.("home")}

                            className="p-1.5 -ml-1 text-foreground/60 hover:text-foreground transition-colors"

                        >

                            <ChevronLeft size={22} />

                        </button>

                        <div>

                            <h1 className="text-base font-black tracking-tight">Koinonia</h1>

                            <div className="flex items-center gap-1.5">

                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-px rounded tracking-wider">{groupId}</span>

                                {isConnected && (

                                    <span className="flex items-center gap-1 text-[9px] text-green-500 font-bold">

                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live

                                    </span>

                                )}

                                <button

                                    onClick={() => setShowMembersPopup(true)}

                                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-2"

                                >

                                    {members.length}紐?쨌 {onlineCount} ?묒냽

                                </button>

                            </div>

                        </div>

                    </div>



                    <div className="flex items-center gap-1">

                        <button

                            onClick={() => {

                                navigator.clipboard.writeText(groupId);

                            }}

                            className="p-2 text-foreground/50 hover:text-primary transition-colors"

                        >

                            <Copy size={16} />

                        </button>

                        <button

                            onClick={() => {

                                if (confirm("??洹몃９???좊굹?쒓쿋?듬땲源?")) leaveSquad();

                            }}

                            className="p-2 text-foreground/50 hover:text-destructive transition-colors"

                        >

                            <LogOut size={14} />

                        </button>

                    </div>

                </div>

            </div>



            {/* Chat Messages */}

            <ChatFeed messages={messages} myName={myName} />



            {/* Input Dock - pinned above NavDock */}

            <div className="shrink-0 bg-card border-t border-border/40 px-3 py-2 pb-24">

                <div className="flex items-end gap-2 max-w-lg mx-auto">

                    <div className="flex-1 bg-muted/40 rounded-2xl border border-border/50 focus-within:border-primary/40 focus-within:bg-muted/60 transition-colors overflow-hidden">

                        <textarea

                            value={inputText}

                            onChange={(e) => setInputText(e.target.value)}

                            placeholder="?ㅻ뒛??臾듭긽???섎늻?대낫?몄슂..."

                            className="w-full bg-transparent px-4 py-2.5 text-[14px] resize-none max-h-28 min-h-[40px] outline-none placeholder:text-muted-foreground/50 no-scrollbar block"

                            rows={1}

                            onKeyDown={(e) => {

                                if (e.key === 'Enter' && !e.shiftKey) {

                                    e.preventDefault();

                                    handleSend();

                                }

                            }}

                        />

                    </div>

                    <button

                        onClick={handleSend}

                        disabled={!inputText.trim()}

                        className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"

                    >

                        <Send size={16} className="ml-0.5" />

                    </button>

                </div>

            </div>



            {/* Members Popup */}

            <AnimatePresence>

                {showMembersPopup && (

                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

                        <motion.div

                            initial={{ opacity: 0 }}

                            animate={{ opacity: 1 }}

                            exit={{ opacity: 0 }}

                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"

                            onClick={() => setShowMembersPopup(false)}

                        />

                        <motion.div

                            initial={{ scale: 0.95, opacity: 0 }}

                            animate={{ scale: 1, opacity: 1 }}

                            exit={{ scale: 0.95, opacity: 0 }}

                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}

                            className="relative bg-card w-full max-w-sm rounded-[2rem] p-5 shadow-2xl max-h-[60vh] overflow-y-auto z-10"

                        >

                            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

                            <h3 className="text-sm font-black mb-3">李몄뿬 硫ㅻ쾭 ({members.length}紐?</h3>

                            <div className="space-y-3">

                                {members.map((m: any, i: number) => (

                                    <div key={m.name || i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">

                                        <div className={cn(

                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",

                                            m.isOnline ? "bg-primary/10 text-primary border-2 border-primary/30" : "bg-muted text-muted-foreground"

                                        )}>

                                            {m.name.slice(0, 2)}

                                        </div>

                                        <div className="flex-1 min-w-0">

                                            <p className="text-sm font-bold truncate">{m.name}</p>

                                            <p className="text-[10px] text-muted-foreground">
                                                {m.isOnline ? (
                                                    <span className="text-green-500 font-bold">🟢 접속 중</span>
                                                ) : (
                                                    '오프라인'
                                                )}
                                                {m.status === 'reading' && ' · 말씀 묵상중'}
                                                {m.status === 'done' && ' · 통독 완료'}
                                            </p>

                                        </div>

                                        <div className="text-[10px] text-muted-foreground/60">

                                            ?뵦 {m.streak || 0}??

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </motion.div>

                    </div>

                )}

            </AnimatePresence>

        </div>

    );

}

