import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lecture_progress';

interface ProgressData {
  [lectureId: string]: {
    currentTime: number;
    duration: number;
    lastWatched: number;
  };
}

export const useWatchProgress = (lectureId?: string) => {
  const [progress, setProgress] = useState<ProgressData>({});

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse watch progress:', e);
      }
    }
  }, []);

  // Save progress for a specific lecture
  const saveProgress = useCallback((id: string, currentTime: number, duration: number) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [id]: {
          currentTime,
          duration,
          lastWatched: Date.now(),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get progress percentage for a lecture
  const getProgressPercent = useCallback((id: string): number => {
    const data = progress[id];
    if (!data || !data.duration) return 0;
    return Math.min(100, (data.currentTime / data.duration) * 100);
  }, [progress]);

  // Get saved time for resuming
  const getSavedTime = useCallback((id: string): number => {
    return progress[id]?.currentTime || 0;
  }, [progress]);

  // Check if lecture is completed (watched more than 90%)
  const isCompleted = useCallback((id: string): boolean => {
    return getProgressPercent(id) >= 90;
  }, [getProgressPercent]);

  // Current lecture progress
  const currentProgress = lectureId ? progress[lectureId] : undefined;
  const currentPercent = lectureId ? getProgressPercent(lectureId) : 0;

  return {
    progress,
    saveProgress,
    getProgressPercent,
    getSavedTime,
    isCompleted,
    currentProgress,
    currentPercent,
  };
};
