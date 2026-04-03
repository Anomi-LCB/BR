export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    nickname: string | null
                    avatar_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    nickname?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    nickname?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
            }
            user_settings: {
                Row: {
                    user_id: string
                    theme: string
                    font_size: string
                    auto_sharing: boolean
                    share_time: string | null
                    preferred_translation: string
                    updated_at: string | null
                }
                Insert: {
                    user_id: string
                    theme?: string
                    font_size?: string
                    auto_sharing?: boolean
                    share_time?: string | null
                    preferred_translation?: string
                    updated_at?: string | null
                }
                Update: {
                    user_id?: string
                    theme?: string
                    font_size?: string
                    auto_sharing?: boolean
                    share_time?: string | null
                    preferred_translation?: string
                    updated_at?: string | null
                }
            }
            user_readings: {
                Row: {
                    id: number
                    user_id: string
                    plan_id: number
                    completed_at: string | null
                    platform: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    plan_id: number
                    completed_at?: string | null
                    platform?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    plan_id?: number
                    completed_at?: string | null
                    platform?: string
                }
            }
            journal_entries: {
                Row: {
                    id: string
                    user_id: string
                    plan_id: number | null
                    content: string
                    mood: string | null
                    ai_feedback: Json | null
                    tags: string[] | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    plan_id?: number | null
                    content: string
                    mood?: string | null
                    ai_feedback?: Json | null
                    tags?: string[] | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    plan_id?: number | null
                    content?: string
                    mood?: string | null
                    ai_feedback?: Json | null
                    tags?: string[] | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
    }
}
