"use client";

import { useState } from "react";
import { Sparkles, X, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import RhemaInsight from "./RhemaInsight";

export default function RhemaFab() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm md:items-end md:justify-end md:p-6"
                        onClick={() => setIsOpen(false)}
                    >

                        <div
                            className="w-full max-w-xl h-[80vh] bg-background/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ErrorBoundary fallback={
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                                    <AlertCircle className="w-12 h-12 text-red-500/50" />
                                    <p className="text-sm text-muted-foreground">
                                        챗봇을 불러오는 중 문제가 발생했습니다.<br />
                                        잠시 후 다시 시도해주세요.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                                        닫기
                                    </Button>
                                </div>
                            }>
                                <RhemaInsight onClose={() => setIsOpen(false)} />
                            </ErrorBoundary>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="fixed bottom-24 right-6 z-40"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    size="icon"
                    className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${isOpen
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-indigo-500/25"
                        }`}
                >
                    {isOpen ? <X size={24} /> : <Sparkles size={24} />}
                </Button>
            </motion.div>
        </>
    );
}
