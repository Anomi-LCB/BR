-- 성경 읽기 계획 테이블
CREATE TABLE IF NOT EXISTS reading_plan (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  verses JSONB NOT NULL,
  day_of_year INTEGER NOT NULL,
  category TEXT,
  summary TEXT,
  reading_time TEXT
);

-- 사용자별 진행 상황 테이블 (Legacy: user_progress)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES reading_plan(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- New Tables for Bible 365 v5.0
-- 1. 성경 읽기 기록 (New Standard)
CREATE TABLE IF NOT EXISTS user_readings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES reading_plan(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform TEXT DEFAULT 'web',
  PRIMARY KEY (user_id, plan_id)
);

-- 2. 묵상 저널 (Journals)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES reading_plan(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  mood TEXT,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rhema AI : Vector Store Setup
-- Enable pgvector extension
create extension if not exists vector;

-- Journal Embeddings Table
CREATE TABLE IF NOT EXISTS journal_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding vector(768), -- Gemini 1.5 Pro embedding dimension (usually 768)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Vector Search
CREATE INDEX ON journal_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to match journals
create or replace function match_journals (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  journal_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    je.id,
    je.journal_id,
    j.content,
    1 - (je.embedding <=> query_embedding) as similarity
  from journal_embeddings je
  join journal_entries j on je.journal_id = j.id
  where 1 - (je.embedding <=> query_embedding) > match_threshold
  and je.user_id = p_user_id
  order by je.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS Settings
ALTER TABLE user_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own readings" ON user_readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readings" ON user_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own readings" ON user_readings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own journals" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own embeddings" ON journal_embeddings FOR SELECT USING (auth.uid() = user_id);
