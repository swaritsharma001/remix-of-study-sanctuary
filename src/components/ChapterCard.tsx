import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Chapter } from '@/data/courseData';

interface ChapterCardProps {
  chapter: Chapter;
  chapterNumber: number;
  subjectSlug: string;
  delay?: number;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  chapterNumber,
  subjectSlug,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
    >
      <Link to={`/subject/${subjectSlug}/chapter/${chapter.id}`}>
        <motion.div
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.99 }}
          className="group flex items-center gap-4 rounded-xl bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover"
        >
          {/* Chapter number badge */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl gradient-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">
              {chapterNumber}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              Chapter {chapterNumber}
            </p>
            <h3 className="font-semibold text-foreground line-clamp-1">
              {chapter.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {chapter.lectures.length} Lectures
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ChapterCard;
