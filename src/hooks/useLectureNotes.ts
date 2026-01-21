import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAuthTokenFromCookie } from '@/contexts/AuthContext';

export interface LectureNote {
  id: string;
  lecture_id: string;
  user_token: string;
  content: string;
  timestamp_seconds: number;
  created_at: string;
  updated_at: string;
}

export const useLectureNotes = (lectureId?: string) => {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userToken = getAuthTokenFromCookie() || 'anonymous';

  // Fetch notes for a lecture
  const fetchNotes = useCallback(async () => {
    if (!lectureId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('lecture_notes')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('user_token', userToken)
        .order('timestamp_seconds', { ascending: true });

      if (fetchError) throw fetchError;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [lectureId, userToken]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Add a new note
  const addNote = useCallback(async (content: string, timestampSeconds: number): Promise<LectureNote | null> => {
    if (!lectureId) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('lecture_notes')
        .insert({
          lecture_id: lectureId,
          user_token: userToken,
          content,
          timestamp_seconds: timestampSeconds,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setNotes(prev => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding note:', err);
      return null;
    }
  }, [lectureId, userToken]);

  // Update a note
  const updateNote = useCallback(async (noteId: string, content: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('lecture_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (updateError) throw updateError;
      
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, content, updated_at: new Date().toISOString() } : note
      ));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating note:', err);
      return false;
    }
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('lecture_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) throw deleteError;
      
      setNotes(prev => prev.filter(note => note.id !== noteId));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting note:', err);
      return false;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};

// Hook to fetch all notes for analytics
export const useAllNotes = () => {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [loading, setLoading] = useState(false);

  const userToken = getAuthTokenFromCookie() || 'anonymous';

  const fetchAllNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lecture_notes')
        .select('*')
        .eq('user_token', userToken)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching all notes:', err);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  return {
    notes,
    loading,
    totalNotes: notes.length,
    refetch: fetchAllNotes,
  };
};
