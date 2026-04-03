Antigravity Quota-- Create group_messages table for persistent chat
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id text not null,
  user_name text not null, -- Store display name for simplicity or link to profiles
  user_email text, -- Optional for identification
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text default 'chat' -- 'chat', 'system', 'poke'
);

-- Enable RLS
alter table public.group_messages enable row level security;

-- Policy: Allow anyone to read messages for their group (simplified for open groups)
create policy "Allow read access for group members"
  on public.group_messages for select
  using (true); -- In production, checking group membership is better

-- Policy: Allow insert for anyone (simplified)
create policy "Allow insert access"
  on public.group_messages for insert
  with check (true);

-- Create index for performance
create index if not exists group_messages_group_id_idx on public.group_messages (group_id);
create index if not exists group_messages_created_at_idx on public.group_messages (created_at desc);
