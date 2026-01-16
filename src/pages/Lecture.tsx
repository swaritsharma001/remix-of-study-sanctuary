import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Button } from '@/components/ui/button';
import { getSubject, getLecture, getChapter } from '@/data/courseData';

const Lecture: React.FC = () => {
  const { slug, chapterId, lectureId } = useParams<{ 
    slug: string; 
    chapterId?: string; 
    lectureId: string;
  }>();
  
  const subject = getSubject(slug || '');
  const lectureNum = parseInt(lectureId || '1', 10);
  const chapterNum = chapterId ? parseInt(chapterId, 10) : undefined;
  
  const result = getLecture(slug || '', lectureNum, chapterNum);
  const chapter = chapterNum ? getChapter(slug || '', chapterNum) : undefined;

  if (!subject || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lecture not found</p>
      </div>
    );
  }

  const { lecture } = result;
  const backUrl = chapter 
    ? `/subject/${slug}/chapter/${chapterId}` 
    : `/subject/${slug}`;
  const backText = chapter ? chapter.title : subject.title;

  // Get prev/next lecture
  const lectures = chapter?.lectures || subject.lectures || [];
  const currentIndex = lectures.findIndex(l => l.id === lecture.id);
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < lectures.length - 1 ? lectures[currentIndex + 1] : null;

  const getLectureUrl = (lid: number) => {
    return chapter 
      ? `/subject/${slug}/chapter/${chapterId}/lecture/${lid}`
      : `/subject/${slug}/lecture/${lid}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to={backUrl}>
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to {backText}
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{subject.title}</span>
            {chapter && (
              <>
                <span>•</span>
                <span>Chapter {chapter.id}</span>
              </>
            )}
            <span>•</span>
            <span>Lecture {lecture.id}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {lecture.title}
          </h1>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          {lecture.type === 'youtube' ? (
            <YouTubePlayer url={lecture.videoUrl} title={lecture.title} />
          ) : (
            <VideoPlayer src={lecture.videoUrl} title={lecture.title} />
          )}
        </motion.div>

        {/* Lecture info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-8 max-w-4xl rounded-xl bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">
            About this Lecture
          </h2>
          <p className="mt-2 text-muted-foreground">
            {chapter 
              ? `This is Lecture ${lecture.id} from Chapter ${chapter.id}: ${chapter.title}. `
              : `This lecture covers important concepts in ${subject.title}. `
            }
            Take notes and practice the exercises to reinforce your learning.
          </p>

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {prevLecture && (
              <Link to={getLectureUrl(prevLecture.id)}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous Lecture
                </Button>
              </Link>
            )}
            {nextLecture && (
              <Link to={getLectureUrl(nextLecture.id)}>
                <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
                  Next Lecture
                  <span>→</span>
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Lecture;
