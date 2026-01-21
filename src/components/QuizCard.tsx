import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy,
  ArrowRight,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuiz, QuizQuestion } from '@/hooks/useQuiz';
import { cn } from '@/lib/utils';

interface QuizCardProps {
  chapterId: string;
  subjectSlug: string;
}

type QuizState = 'idle' | 'taking' | 'completed';

const QuizCard: React.FC<QuizCardProps> = ({ chapterId, subjectSlug }) => {
  const { quiz, questions, bestAttempt, loading, submitQuiz } = useQuiz(chapterId);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }[]>([]);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const startQuiz = () => {
    setQuizState('taking');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setStartTime(Date.now());
    setResult(null);
    setShowExplanation(false);
  };

  const selectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    if (showExplanation) return;
    setSelectedOption(option);
  };

  const confirmAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correct_option;
    setShowExplanation(true);

    // Save answer
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, selectedOption }]);
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Quiz completed - submit
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const allAnswers = [...answers, { questionId: currentQuestion.id, selectedOption: selectedOption! }];
      
      const attempt = await submitQuiz(allAnswers, timeTaken);
      if (attempt) {
        setResult({
          score: attempt.score,
          correct: attempt.correct_answers,
          total: attempt.total_questions,
        });
        setQuizState('completed');
      }
    }
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questions.length === 0) {
    return null; // No quiz available
  }

  const getOptionStyle = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!showExplanation) {
      return selectedOption === option 
        ? 'border-primary bg-primary/10' 
        : 'border-border hover:border-primary/50';
    }
    
    if (option === currentQuestion?.correct_option) {
      return 'border-green-500 bg-green-500/10';
    }
    if (option === selectedOption && option !== currentQuestion?.correct_option) {
      return 'border-destructive bg-destructive/10';
    }
    return 'border-border opacity-50';
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Chapter Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {quizState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <p className="text-muted-foreground mb-4">
                Test your knowledge with {questions.length} questions
              </p>
              
              {bestAttempt && (
                <div className="mb-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Best Score: <strong className="text-primary">{bestAttempt.score}%</strong></span>
                  </div>
                </div>
              )}
              
              <Button onClick={startQuiz} className="gap-2">
                <Brain className="h-4 w-4" />
                Start Quiz
              </Button>
            </motion.div>
          )}

          {quizState === 'taking' && currentQuestion && (
            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question */}
              <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

              {/* Options */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof QuizQuestion] as string;
                  return (
                    <motion.button
                      key={option}
                      whileHover={!showExplanation ? { scale: 1.01 } : {}}
                      whileTap={!showExplanation ? { scale: 0.99 } : {}}
                      onClick={() => selectOption(option)}
                      disabled={showExplanation}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3',
                        getOptionStyle(option)
                      )}
                    >
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                        selectedOption === option ? 'bg-primary text-primary-foreground border-primary' : 'border-current'
                      )}>
                        {option}
                      </span>
                      <span className="flex-1">{optionText}</span>
                      {showExplanation && option === currentQuestion.correct_option && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      )}
                      {showExplanation && option === selectedOption && option !== currentQuestion.correct_option && (
                        <XCircle className="h-5 w-5 text-destructive shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-muted/50"
                >
                  <p className="text-sm text-muted-foreground">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-3">
                {!showExplanation ? (
                  <Button 
                    onClick={confirmAnswer} 
                    disabled={!selectedOption}
                    className="gap-2"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} className="gap-2">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>Next <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <>Finish Quiz</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {quizState === 'completed' && result && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={cn(
                  'mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4',
                  result.score >= 60 ? 'bg-green-500/20' : 'bg-destructive/20'
                )}
              >
                {result.score >= 60 ? (
                  <Trophy className="h-12 w-12 text-green-500" />
                ) : (
                  <XCircle className="h-12 w-12 text-destructive" />
                )}
              </motion.div>

              <h3 className="text-2xl font-bold mb-2">
                {result.score >= 60 ? 'Great Job!' : 'Keep Practicing!'}
              </h3>
              
              <p className="text-4xl font-bold text-primary mb-2">{result.score}%</p>
              
              <p className="text-muted-foreground mb-6">
                You got {result.correct} out of {result.total} questions correct
              </p>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={startQuiz} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retry Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default QuizCard;
