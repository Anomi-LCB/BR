"use client";

import { useState } from "react";
import GroupDashboardView from "../GroupDashboardView";
import { User } from "@supabase/supabase-js";

interface GroupTabProps {
    user: User | null;
    streak: number;
    progressPercent: number;
    onTabChange?: (tab: string) => void;
}

export default function GroupTab({ user, streak, progressPercent, onTabChange }: GroupTabProps) {
    return (
        <div>
            <GroupDashboardView user={user} streak={streak} progress={progressPercent} onTabChange={onTabChange} />
        </div>
    );
}
