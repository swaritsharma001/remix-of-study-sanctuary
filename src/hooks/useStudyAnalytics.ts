import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAuthTokenFromCookie } from '@/contexts/AuthContext';

export interface StudySession {
  id: string;
  user_token: string;
  subject_slug: string;
  chapter_id: string | null;
  lecture_id: string | null;
  duration_seconds: number;
  session_date: string;
  created_at: string;
}

export interface WatchProgressData {
  id: string;
  lecture_id: string;
  user_token: string;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export const useStudyAnalytics = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgressData[]>([]);
  const [loading, setLoading] = useState(false);

  const userToken = getAuthTokenFromCookie() || 'anonymous';

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_token', userToken)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch watch progress
      const { data: progressData, error: progressError } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_token', userToken);

      if (progressError) throw progressError;
      setWatchProgress(progressData || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Record a study session
  const recordSession = useCallback(async (
    subjectSlug: string,
    durationSeconds: number,
    chapterId?: string,
    lectureId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_token: userToken,
          subject_slug: subjectSlug,
          chapter_id: chapterId || null,
          lecture_id: lectureId || null,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;
      fetchAnalytics(); // Refresh data
      return true;
    } catch (err) {
      console.error('Error recording session:', err);
      return false;
    }
  }, [userToken, fetchAnalytics]);

  // Update watch progress
  const updateWatchProgress = useCallback(async (
    lectureId: string,
    progressSeconds: number,
    durationSeconds: number
  ): Promise<boolean> => {
    try {
      const completed = (progressSeconds / durationSeconds) >= 0.9;
      
      const { error } = await supabase
        .from('watch_progress')
        .upsert({
          lecture_id: lectureId,
          user_token: userToken,
          progress_seconds: progressSeconds,
          duration_seconds: durationSeconds,
          completed,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'lecture_id,user_token',
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating watch progress:', err);
      return false;
    }
  }, [userToken]);

  // Calculate analytics
  const analytics = useMemo(() => {
    // Total study time
    const totalStudySeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const totalHours = Math.floor(totalStudySeconds / 3600);
    const totalMinutes = Math.floor((totalStudySeconds % 3600) / 60);

    // Lectures completed
    const completedLectures = watchProgress.filter(p => p.completed).length;
    const totalLectures = watchProgress.length;

    // Study streak (consecutive days)
    const uniqueDays = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < uniqueDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDays[i] === expected || (i === 0 && uniqueDays[i] === today)) {
        streak++;
      } else if (i === 0) {
        // Allow for today not being counted yet
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (uniqueDays[i] === yesterday.toISOString().split('T')[0]) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Weekly study data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayMinutes = sessions
        .filter(s => s.session_date === dateStr)
        .reduce((sum, s) => sum + Math.round(s.duration_seconds / 60), 0);
      
      weeklyData.push({ day: dayName, minutes: dayMinutes, date: dateStr });
    }

    // Subject-wise progress
    const subjectProgress: { [key: string]: { total: number; completed: number } } = {};
    sessions.forEach(s => {
      if (!subjectProgress[s.subject_slug]) {
        subjectProgress[s.subject_slug] = { total: 0, completed: 0 };
      }
      subjectProgress[s.subject_slug].total += s.duration_seconds;
    });

    // Average session duration
    const avgSessionMinutes = sessions.length > 0 
      ? Math.round((totalStudySeconds / sessions.length) / 60)
      : 0;

    return {
      totalStudyTime: `${totalHours}h ${totalMinutes}m`,
      totalStudyMinutes: Math.round(totalStudySeconds / 60),
      completedLectures,
      totalLectures,
      completionRate: totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0,
      streak,
      weeklyData,
      subjectProgress,
      avgSessionMinutes,
      totalSessions: sessions.length,
    };
  }, [sessions, watchProgress]);

  return {
    sessions,
    watchProgress,
    loading,
    analytics,
    recordSession,
    updateWatchProgress,
    refetch: fetchAnalytics,
  };
};
