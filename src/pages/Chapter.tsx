import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSubject, getChapter } from '@/data/courseData';

const Chapter: React.FC = () => {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const subject = getSubject(slug || '');
  const chapter = getChapter(slug || '', parseInt(chapterId || '1', 10));

  if (!subject || !chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to={`/subject/${slug}`}>
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to {subject.title}
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
              <span className="font-display text-xl font-bold text-primary-foreground">
                {chapter.id}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{subject.title} • Chapter {chapter.id}</p>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {chapter.title}
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Lecture count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {chapter.lectures.length} Lectures
          </span>
        </motion.div>

        {/* Lecture list */}
        <div className="mx-auto max-w-2xl space-y-4">
          {chapter.lectures.map((lecture, index) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.08, type: 'spring', damping: 20 }}
            >
              <Link to={`/subject/${slug}/chapter/${chapterId}/lecture/${lecture.id}`}>
                <motion.div
                  whileHover={{ scale: 1.01, x: 8 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover"
                >
                  {/* Play button */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:gradient-primary">
                    <Play className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      Lecture {lecture.id}
                    </p>
                    <h3 className="font-semibold text-foreground truncate">
                      {lecture.title}
                    </h3>
                  </div>

                  {/* Type badge */}
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    lecture.type === 'youtube' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {lecture.type === 'youtube' ? 'YouTube' : 'HLS'}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chapter;
