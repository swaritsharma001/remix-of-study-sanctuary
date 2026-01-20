import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  BookMarked,
  TrendingUp,
  Calendar,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Footer from '@/components/Footer';

const Dashboard: React.FC = () => {
  const { progress, getProgressPercent, isCompleted } = useWatchProgress();
  const { bookmarks } = useBookmarks();
  const { data: subjects } = useSubjects();

  // Calculate stats
  const stats = useMemo(() => {
    const lectureIds = Object.keys(progress);
    const totalWatched = lectureIds.length;
    const completed = lectureIds.filter(id => isCompleted(id)).length;
    const inProgress = totalWatched - completed;
    
    // Total watch time (approximate from progress data)
    const totalSeconds = lectureIds.reduce((acc, id) => {
      return acc + (progress[id]?.currentTime || 0);
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return {
      totalWatched,
      completed,
      inProgress,
      watchTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      bookmarksCount: bookmarks.length,
    };
  }, [progress, isCompleted, bookmarks]);

  // Get recently watched lectures (sorted by lastWatched)
  const recentlyWatched = useMemo(() => {
    return Object.entries(progress)
      .sort(([, a], [, b]) => b.lastWatched - a.lastWatched)
      .slice(0, 6)
      .map(([lectureId, data]) => ({
        lectureId,
        ...data,
        progressPercent: getProgressPercent(lectureId),
        isCompleted: isCompleted(lectureId),
      }));
  }, [progress, getProgressPercent, isCompleted]);

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const statCards = [
    { icon: Play, label: 'Lectures Started', value: stats.totalWatched, color: 'text-primary' },
    { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'text-green-500' },
    { icon: Clock, label: 'Watch Time', value: stats.watchTime, color: 'text-secondary' },
    { icon: BookMarked, label: 'Bookmarks', value: stats.bookmarksCount, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Your Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your learning progress and pick up where you left off
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recently Watched */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Continue Watching
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentlyWatched.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No lectures watched yet</p>
                    <Link 
                      to="/"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Browse subjects <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentlyWatched.map((item, index) => (
                      <motion.div
                        key={item.lectureId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="group relative overflow-hidden rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            item.isCompleted ? 'bg-accent' : 'bg-primary/10'
                          }`}>
                            {item.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                            ) : (
                              <Play className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">Lecture</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatTimeAgo(item.lastWatched)}
                              {!item.isCompleted && (
                                <span className="text-primary">
                                  {Math.round(item.progressPercent)}% watched
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!item.isCompleted && (
                          <Progress value={item.progressPercent} className="mt-3 h-1" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bookmarks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-orange-500" />
                  Bookmarked Lectures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookMarked className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No bookmarks yet</p>
                    <p className="text-sm text-muted-foreground">
                      Bookmark lectures to save them for later
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookmarks.slice(0, 6).map((bookmark, index) => (
                      <motion.div
                        key={bookmark.lectureId}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                      >
                        <Link to={`/subject/${bookmark.subjectId}/lecture/${bookmark.lectureId}`}>
                          <div className="group flex items-center gap-4 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                              <BookMarked className="h-5 w-5 text-secondary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{bookmark.title}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {bookmark.subjectId}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subject Progress */}
        {subjects && subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                  Subject Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <Link to={`/subject/${subject.id}`}>
                        <div className="group rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{subject.subject}</p>
                            <span className="text-sm text-muted-foreground">
                              {subject.totalVideos} lectures
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={0} className="h-2 flex-1" />
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
