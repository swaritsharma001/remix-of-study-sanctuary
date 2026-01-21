-- Create feedback table
CREATE TABLE public.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    message text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

-- Only allow reading via service role (admin panel uses auth key)
CREATE POLICY "Anyone can read feedback" 
ON public.feedback 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);