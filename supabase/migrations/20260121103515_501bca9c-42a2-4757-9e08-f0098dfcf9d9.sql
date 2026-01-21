-- Add image column to latest_notification table
ALTER TABLE public.latest_notification 
ADD COLUMN IF NOT EXISTS image TEXT DEFAULT NULL;