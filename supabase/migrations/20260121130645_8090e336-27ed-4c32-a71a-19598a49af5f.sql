-- Add reply fields to feedback table
ALTER TABLE public.feedback 
ADD COLUMN reply text,
ADD COLUMN replied_at timestamp with time zone,
ADD COLUMN replied_by text;

-- Allow updates to feedback (for adding replies)
CREATE POLICY "Anyone can update feedback" 
ON public.feedback 
FOR UPDATE 
USING (true)
WITH CHECK (true);