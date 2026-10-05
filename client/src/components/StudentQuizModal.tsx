import React, { useState, useEffect } from 'react';
import {
  Trophy,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  X,
  Sparkles,
  Loader2,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../types';
import { generateStudentQuiz, recordQuizResult, getStoredUser } from '../utils/auth';

interface StudentQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  summaryContent?: string;
  gradeLevel?: string;
  onQuizCompleted?: (score: number, total: number) => void;
}

export const StudentQuizModal: React.FC<StudentQuizModalProps> = ({
  isOpen,
  onClose,
  topic,
  summaryContent,
  gradeLevel = 'high',
  onQuizCompleted,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && topic) {
      loadQuiz();
    }
  }, [isOpen, topic]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsCompleted(false);

    try {
      const qList = await generateStudentQuiz(topic, summaryContent || '', gradeLevel);
      setQuestions(qList);
    } catch (err: any) {
      setError(err.message || 'Could not load quiz questions.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;

  const handleSelectOption = (optIndex: number) => {
    if (hasAnsweredCurrent) return; // Prevent changing after revealing explanation
    const nextAnswers = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(nextAnswers);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate final score
      let score = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) {
          score += 1;
        }
      });

      setIsCompleted(true);

      // Trigger celebratory confetti if passed!
      if (score >= Math.ceil(questions.length * 0.6)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Record to student profile if logged in
      const user = getStoredUser();
      if (user) {
        try {
          await recordQuizResult(topic, score, questions.length);
        } catch (saveErr) {
          console.warn('Could not record quiz result:', saveErr);
        }
      }

      if (onQuizCompleted) {
        onQuizCompleted(score, questions.length);
      }
    }
  };

  // Calculate score for completion screen
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-paper-surface border border-paper-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-lg font-bold text-paper-text">Knowledge Check</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sage/15 text-sage border border-sage/30">
                  Concept Mastery
                </span>
              </div>
              <p className="text-xs text-paper-text-dim">Test what you learned about &ldquo;{topic}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-surface transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto" />
              <p className="text-xs text-paper-text-dim font-medium">
                Synthesizing student concept check questions from research dossier...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <div className="text-xs text-red-500 font-medium">{error}</div>
              <button
                onClick={loadQuiz}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-white text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Quiz Generation</span>
              </button>
            </div>
          ) : isCompleted ? (
            /* Results Screen */
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-terracotta/10 text-terracotta mx-auto flex items-center justify-center border-2 border-terracotta/30 animate-in zoom-in-75">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-paper-text">
                  Quiz Completed!
                </h3>
                <p className="text-xs text-paper-text-dim max-w-sm mx-auto">
                  You scored <span className="font-mono font-bold text-terracotta text-sm">{calculateScore()} / {questions.length}</span> on conceptual understanding of {topic}.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={loadQuiz}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-paper-surface hover:bg-paper-surface-2 text-paper-text text-xs font-medium border border-paper-line transition"
                >
                  <RotateCcw className="w-4 h-4 text-terracotta" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-600 transition shadow-sm"
                >
                  <span>Return to Dossier</span>
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Screen */
            <div className="space-y-5 animate-in fade-in">
              {/* Question Index Progress */}
              <div className="flex items-center justify-between text-xs text-paper-text-dim">
                <span className="font-mono font-semibold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[11px] font-mono">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-paper-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <h3 className="font-serif text-base sm:text-lg font-bold text-paper-text leading-snug">
                {currentQ.question}
              </h3>

              {/* Options List */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const isCorrect = optIdx === currentQ.correctIndex;

                  let optionStyle =
                    'border-paper-line bg-paper-surface hover:bg-paper-surface-2 text-paper-text';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      optionStyle =
                        'border-sage bg-sage/15 text-sage font-medium shadow-sm';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400';
                    } else {
                      optionStyle = 'opacity-60 border-paper-line';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-terracotta bg-terracotta/10 text-terracotta';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${optionStyle}`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-paper-surface-2 border border-paper-line shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </div>

                      {hasAnsweredCurrent && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Educational Explanation (shown immediately after selecting) */}
              {hasAnsweredCurrent && (
                <div className="p-4 rounded-xl bg-paper-surface-2 border border-paper-line space-y-1.5 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-paper-text">
                    <Lightbulb className="w-4 h-4 text-terracotta" />
                    <span>Learning Explanation</span>
                  </div>
                  <p className="text-xs text-paper-text-dim leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isCompleted && !isLoading && !error && currentQ && (
          <div className="px-6 py-3.5 border-t border-paper-line bg-paper-surface-2/40 flex items-center justify-between">
            <span className="text-[11px] text-paper-text-dim">
              {hasAnsweredCurrent
                ? 'Review the learning point, then proceed to the next question.'
                : 'Select an answer to reveal conceptual explanation.'}
            </span>
            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
                hasAnsweredCurrent
                  ? 'bg-terracotta text-white hover:bg-terracotta-600'
                  : 'bg-paper-line text-paper-text-dim cursor-not-allowed'
              }`}
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
