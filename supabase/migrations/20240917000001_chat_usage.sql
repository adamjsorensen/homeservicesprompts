
-- Create chat_usage table to track usage of the chat API
CREATE TABLE IF NOT EXISTS public.chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model VARCHAR NOT NULL,
  messages_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all chat usage
CREATE POLICY "Admins can view all chat usage" 
  ON public.chat_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Allow users to see their own chat usage
CREATE POLICY "Users can view their own chat usage" 
  ON public.chat_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot directly insert, update or delete
-- Only the edge function can insert records
