-- Add DELETE policy for chat messages (allow all deletions, admin check done in app)
CREATE POLICY "Anyone can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (true);