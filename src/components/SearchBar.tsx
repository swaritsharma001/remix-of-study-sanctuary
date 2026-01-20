import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useSubjects } from '@/hooks/useSubjects';
import { fetchLecturesBySubject, ApiLecture } from '@/services/api';

interface SearchResult {
  lecture: ApiLecture;
  subjectId: string;
  subjectName: string;
}

const SearchBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: subjects } = useSubjects();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search lectures across all subjects
  useEffect(() => {
    if (!query.trim() || !subjects) {
      setResults([]);
      return;
    }

    const searchLectures = async () => {
      setIsSearching(true);
      const allResults: SearchResult[] = [];
      
      try {
        const lecturePromises = subjects.map(async (subject) => {
          try {
            const lectures = await fetchLecturesBySubject(subject.id);
            return lectures
              .filter(lecture => 
                lecture.title.toLowerCase().includes(query.toLowerCase())
              )
              .map(lecture => ({
                lecture,
                subjectId: subject.id,
                subjectName: subject.subject,
              }));
          } catch {
            return [];
          }
        });
        
        const results = await Promise.all(lecturePromises);
        results.forEach(r => allResults.push(...r));
        
        setResults(allResults.slice(0, 8)); // Limit to 8 results
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchLectures, 300);
    return () => clearTimeout(debounce);
  }, [query, subjects]);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
      </motion.button>

      {/* Search modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Search container */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-1/2 top-24 z-50 w-[90%] max-w-xl -translate-x-1/2"
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-modal">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search lectures..."
                    className="border-0 bg-transparent py-4 text-lg focus-visible:ring-0"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                  {isSearching && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {!isSearching && query && results.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No lectures found for "{query}"
                    </div>
                  )}

                  {!isSearching && results.length > 0 && (
                    <div className="space-y-1">
                      {results.map((result) => (
                        <Link
                          key={result.lecture._id}
                          to={`/subject/${result.subjectId}/lecture/${result.lecture._id}`}
                          onClick={handleResultClick}
                        >
                          <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Play className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{result.lecture.title}</p>
                              <p className="text-sm text-muted-foreground">{result.subjectName}</p>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!query && (
                    <div className="py-8 text-center text-muted-foreground">
                      Start typing to search lectures...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
