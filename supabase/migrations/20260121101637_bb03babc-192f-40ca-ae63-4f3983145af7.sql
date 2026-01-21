-- Create table to store the latest notification for service worker to fetch
CREATE TABLE public.latest_notification (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title TEXT NOT NULL DEFAULT 'StudyX',
  body TEXT NOT NULL DEFAULT 'New content available',
  icon TEXT DEFAULT '/notification-icon.png',
  url TEXT DEFAULT '/',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.latest_notification ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (service worker needs this)
CREATE POLICY "Anyone can read latest notification"
  ON public.latest_notification
  FOR SELECT
  USING (true);

-- Insert default row
INSERT INTO public.latest_notification (id, title, body, icon, url) 
VALUES (1, 'StudyX', 'New content available', '/notification-icon.png', '/');