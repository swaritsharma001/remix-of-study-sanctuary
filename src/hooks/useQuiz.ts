import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAuthTokenFromCookie } from '@/contexts/AuthContext';

export interface Quiz {
  id: string;
  chapter_id: string;
  subject_slug: string;
  title: string;
  description: string | null;
  passing_score: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_token: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number | null;
  completed_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
}

export const useQuiz = (chapterId?: string) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userToken = getAuthTokenFromCookie() || 'anonymous';

  // Fetch quiz for a chapter
  const fetchQuiz = useCallback(async () => {
    if (!chapterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (quizError) throw quizError;
      
      if (quizData) {
        setQuiz(quizData);
        
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order_index');

        if (questionsError) throw questionsError;
        setQuestions((questionsData || []) as QuizQuestion[]);

        // Fetch user's attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizData.id)
          .eq('user_token', userToken)
          .order('completed_at', { ascending: false });

        if (attemptsError) throw attemptsError;
        setAttempts(attemptsData || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [chapterId, userToken]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Submit quiz attempt
  const submitQuiz = useCallback(async (
    answers: { questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }[],
    timeTakenSeconds: number
  ): Promise<QuizAttempt | null> => {
    if (!quiz) return null;

    try {
      // Calculate score
      let correctCount = 0;
      const answerResults = answers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        const isCorrect = question?.correct_option === answer.selectedOption;
        if (isCorrect) correctCount++;
        return {
          question_id: answer.questionId,
          selected_option: answer.selectedOption,
          is_correct: isCorrect,
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);

      // Create attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          user_token: userToken,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          time_taken_seconds: timeTakenSeconds,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // Save individual answers
      const answersToInsert = answerResults.map(result => ({
        attempt_id: attemptData.id,
        ...result,
      }));

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      // Update attempts list
      setAttempts(prev => [attemptData, ...prev]);
      
      return attemptData;
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting quiz:', err);
      return null;
    }
  }, [quiz, questions, userToken]);

  // Get best attempt
  const bestAttempt = attempts.reduce<QuizAttempt | null>((best, current) => {
    if (!best || current.score > best.score) return current;
    return best;
  }, null);

  return {
    quiz,
    questions,
    attempts,
    bestAttempt,
    loading,
    error,
    submitQuiz,
    refetch: fetchQuiz,
  };
};

// Hook to fetch all quiz attempts for analytics
export const useQuizAnalytics = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  const userToken = getAuthTokenFromCookie() || 'anonymous';

  const fetchAllAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_token', userToken)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (err) {
      console.error('Error fetching quiz attempts:', err);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchAllAttempts();
  }, [fetchAllAttempts]);

  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  const totalQuizzesTaken = attempts.length;
  const passedQuizzes = attempts.filter(a => a.score >= 60).length;

  return {
    attempts,
    loading,
    averageScore,
    totalQuizzesTaken,
    passedQuizzes,
    refetch: fetchAllAttempts,
  };
};
