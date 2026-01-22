-- Create message reactions table
CREATE TABLE public.chat_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_token TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  UNIQUE(message_id, user_token, emoji)
);

-- Enable Row Level Security
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reactions
CREATE POLICY "Anyone can read reactions" 
ON public.chat_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add reactions" 
ON public.chat_reactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can remove their own reactions" 
ON public.chat_reactions 
FOR DELETE 
USING (true);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;