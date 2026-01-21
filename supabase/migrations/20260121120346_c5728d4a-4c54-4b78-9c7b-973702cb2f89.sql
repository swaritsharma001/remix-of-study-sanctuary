-- Create quizzes table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id TEXT NOT NULL,
    subject_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz attempts table (tracks user attempts)
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    user_token TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz answers table (individual question answers)
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
    selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lecture notes table
CREATE TABLE public.lecture_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id TEXT NOT NULL,
    user_token TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create study sessions table for time tracking
CREATE TABLE public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_token TEXT NOT NULL,
    subject_slug TEXT NOT NULL,
    chapter_id TEXT,
    lecture_id TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create watch progress table if not exists
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id TEXT NOT NULL,
    user_token TEXT NOT NULL,
    progress_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(lecture_id, user_token)
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes (public read)
CREATE POLICY "Anyone can read quizzes" ON public.quizzes FOR SELECT USING (true);

-- RLS Policies for quiz_questions (public read)
CREATE POLICY "Anyone can read quiz questions" ON public.quiz_questions FOR SELECT USING (true);

-- RLS Policies for quiz_attempts
CREATE POLICY "Anyone can create quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read quiz attempts" ON public.quiz_attempts FOR SELECT USING (true);

-- RLS Policies for quiz_answers
CREATE POLICY "Anyone can create quiz answers" ON public.quiz_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read quiz answers" ON public.quiz_answers FOR SELECT USING (true);

-- RLS Policies for lecture_notes
CREATE POLICY "Anyone can create notes" ON public.lecture_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read notes" ON public.lecture_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can update their notes" ON public.lecture_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete their notes" ON public.lecture_notes FOR DELETE USING (true);

-- RLS Policies for study_sessions
CREATE POLICY "Anyone can create study sessions" ON public.study_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read study sessions" ON public.study_sessions FOR SELECT USING (true);

-- RLS Policies for watch_progress
CREATE POLICY "Anyone can create watch progress" ON public.watch_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read watch progress" ON public.watch_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can update watch progress" ON public.watch_progress FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_user_token ON public.quiz_attempts(user_token);
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX idx_lecture_notes_user_token ON public.lecture_notes(user_token);
CREATE INDEX idx_lecture_notes_lecture_id ON public.lecture_notes(lecture_id);
CREATE INDEX idx_study_sessions_user_token ON public.study_sessions(user_token);
CREATE INDEX idx_watch_progress_user_token ON public.watch_progress(user_token);