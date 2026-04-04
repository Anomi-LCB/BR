    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL UNIQUE,
    subscription_json JSONB NOT NULL,
    alarm_time TIME NOT NULL DEFAULT '06:00:00',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS(Row Level Security) 설정 (보안)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. 누구나 구독 정보를 등록/업데이트 할 수 있도록 정책 설정 (실무에서는 익명 사용자 허용)
CREATE POLICY "Allow anonymous insert/update" 
ON public.push_subscriptions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE public.push_subscriptions IS '웹 푸시 알림 구독 정보를 저장하는 테이블입니다.';
