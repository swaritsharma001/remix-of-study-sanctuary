import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Target,
  Flame,
  BarChart3,
  PieChart,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { useQuizAnalytics } from '@/hooks/useQuiz';
import { useAllNotes } from '@/hooks/useLectureNotes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const ProgressDashboard: React.FC = () => {
  const { analytics, loading: analyticsLoading } = useStudyAnalytics();
  const { averageScore, totalQuizzesTaken, passedQuizzes, loading: quizLoading } = useQuizAnalytics();
  const { totalNotes, loading: notesLoading } = useAllNotes();

  const loading = analyticsLoading || quizLoading || notesLoading;

  const statCards = [
    { 
      icon: Clock, 
      label: 'Total Study Time', 
      value: analytics.totalStudyTime || '0h 0m', 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      icon: BookOpen, 
      label: 'Lectures Completed', 
      value: analytics.completedLectures, 
      subValue: `${analytics.completionRate}%`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      icon: Flame, 
      label: 'Study Streak', 
      value: `${analytics.streak} days`, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      icon: Trophy, 
      label: 'Quizzes Passed', 
      value: `${passedQuizzes}/${totalQuizzesTaken}`, 
      subValue: averageScore > 0 ? `Avg: ${averageScore}%` : undefined,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
  ];

  // Pie chart data for completion
  const completionData = [
    { name: 'Completed', value: analytics.completedLectures },
    { name: 'In Progress', value: Math.max(0, analytics.totalLectures - analytics.completedLectures) },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-sm text-muted-foreground mt-1">{stat.subValue}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Study Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Weekly Study Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.weeklyData.every(d => d.minutes === 0) ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                  <BarChart3 className="h-12 w-12 opacity-30 mb-2" />
                  <p>No study data yet</p>
                  <p className="text-sm">Start watching lectures to see your progress</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} min`, 'Study Time']}
                    />
                    <Bar 
                      dataKey="minutes" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-secondary" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.totalLectures === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                  <Target className="h-12 w-12 opacity-30 mb-2" />
                  <p>No lectures started yet</p>
                  <p className="text-sm">Begin your learning journey</p>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <RechartsPie>
                      <Pie
                        data={completionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {completionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion Rate</span>
                        <span className="font-medium">{analytics.completionRate}%</span>
                      </div>
                      <Progress value={analytics.completionRate} className="h-2" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>Completed: {analytics.completedLectures}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <span>Remaining: {analytics.totalLectures - analytics.completedLectures}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-foreground" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg. Session Duration</p>
                <p className="text-xl font-bold mt-1">{analytics.avgSessionMinutes} min</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Study Sessions</p>
                <p className="text-xl font-bold mt-1">{analytics.totalSessions}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Notes Taken</p>
                <p className="text-xl font-bold mt-1">{totalNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProgressDashboard;
