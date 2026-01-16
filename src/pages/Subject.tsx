import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calculator, FlaskConical, Languages, BookOpenText } from 'lucide-react';
import LectureCard from '@/components/LectureCard';
import ChapterCard from '@/components/ChapterCard';
import { Button } from '@/components/ui/button';
import { getSubject } from '@/data/courseData';

const subjectIcons: Record<string, React.ElementType> = {
  hindi: Languages,
  english: BookOpenText,
  maths: Calculator,
  science: FlaskConical,
};

const Subject: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const subject = getSubject(slug || '');
  const IconComponent = subjectIcons[slug || ''] || BookOpen;

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Subject not found</p>
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
          <Link to="/">
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Subjects
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
              <IconComponent className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {subject.title}
              </h1>
              <p className="text-muted-foreground">
                {subject.hasChapters ? 'All Chapters' : 'All Lectures'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Count badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {subject.hasChapters 
              ? `${subject.chapters?.length || 0} Chapters`
              : `${subject.lectures?.length || 0} Lectures`
            }
          </span>
        </motion.div>

        {/* Content */}
        <div className="mx-auto max-w-2xl space-y-4">
          {subject.hasChapters ? (
            // Show chapters
            subject.chapters?.map((chapter, index) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                chapterNumber={chapter.id}
                subjectSlug={slug || ''}
                delay={0.2 + index * 0.08}
              />
            ))
          ) : (
            // Show lectures directly
            subject.lectures?.map((lecture, index) => (
              <LectureCard
                key={lecture.id}
                title={lecture.title}
                lectureNumber={lecture.id}
                duration="--:--"
                subjectSlug={slug || ''}
                delay={0.2 + index * 0.08}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Subject;
