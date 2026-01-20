import { useState, useEffect, useCallback } from 'react';

const BOOKMARKS_KEY = 'lecture_bookmarks';
const NOTES_KEY = 'lecture_notes';

interface BookmarkData {
  lectureId: string;
  subjectId: string;
  title: string;
  bookmarkedAt: number;
}

interface NoteData {
  lectureId: string;
  note: string;
  updatedAt: number;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [notes, setNotes] = useState<Record<string, NoteData>>({});

  // Load data from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(BOOKMARKS_KEY);
    const savedNotes = localStorage.getItem(NOTES_KEY);
    
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }
    
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse notes:', e);
      }
    }
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback((lectureId: string, subjectId: string, title: string) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.lectureId === lectureId);
      let updated: BookmarkData[];
      
      if (exists) {
        updated = prev.filter(b => b.lectureId !== lectureId);
      } else {
        updated = [...prev, { lectureId, subjectId, title, bookmarkedAt: Date.now() }];
      }
      
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if lecture is bookmarked
  const isBookmarked = useCallback((lectureId: string): boolean => {
    return bookmarks.some(b => b.lectureId === lectureId);
  }, [bookmarks]);

  // Save note for a lecture
  const saveNote = useCallback((lectureId: string, note: string) => {
    setNotes(prev => {
      const updated = {
        ...prev,
        [lectureId]: { lectureId, note, updatedAt: Date.now() },
      };
      localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get note for a lecture
  const getNote = useCallback((lectureId: string): string => {
    return notes[lectureId]?.note || '';
  }, [notes]);

  // Delete note
  const deleteNote = useCallback((lectureId: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[lectureId];
      localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    bookmarks,
    notes,
    toggleBookmark,
    isBookmarked,
    saveNote,
    getNote,
    deleteNote,
  };
};
