import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByCategory, ALL_QUESTIONS, shuffleAnswers } from '../data';
import { CATEGORIES } from '../data/categories';
import type { Question } from '../types';
import { useProgress } from '../hooks/useProgress';

export default function QuizMode() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  if (!categoryId) return <QuizPicker />;

  const rawQuestions = categoryId === 'all'
    ? ALL_QUESTIONS
    : getQuestionsByCategory(categoryId);

  const category = categoryId === 'all'
    ? { id: 'all', name: 'Wszystkie pytania', icon: '📚', color: 'from-violet-500 to-purple-600', questionCount: ALL_QUESTIONS.length, description: '', darkColor: '' }
    : CATEGORIES.find(c => c.id === categoryId);

  if (!category || rawQuestions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kategoria nie znaleziona.</p>
        <button onClick={() => navigate('/quiz')} className="mt-4 text-violet-600 hover:underline">Wróć</button>
      </div>
    );
  }

  return <QuizGame questions={rawQuestions} category={category} categoryId={categoryId} />;
}

function QuizPicker() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Quiz – wybierz tryb</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">4 odpowiedzi, tylko jedna jest poprawna</p>
      </div>
      <button
        onClick={() => navigate('/quiz/all')}
        className="w-full text-left bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl p-5 active:scale-[0.98] transition-transform shadow-md"
      >
        <div className="text-2xl mb-1">📚</div>
        <div className="font-bold text-base">Wszystkie 299 pytań</div>
        <div className="text-sm opacity-80 mt-0.5">Kompletny quiz ze wszystkich kategorii</div>
      </button>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Albo wybierz kategorię:</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => navigate(`/quiz/${cat.id}`)}
            className="text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 active:scale-95 transition-all hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md group"
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-base mb-2`}>
              {cat.icon}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 leading-tight">{cat.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.questionCount} pyt.</div>
          </button>
        ))}
      </div>
    </div>
  );
}

type QuizPhase = 'question' | 'answer' | 'finished';

function QuizGame({
  questions: rawQuestions,
  category,
  categoryId,
}: {
  questions: Question[];
  category: { id: string; name: string; icon: string; color: string; questionCount: number };
  categoryId: string;
}) {
  const navigate = useNavigate();
  const { addQuizResult } = useProgress();

  const questions = useMemo(
    () => [...rawQuestions].sort(() => Math.random() - 0.5).map(shuffleAnswers),
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('question');
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = questions[currentIndex];

  function handleAnswer(answerId: string) {
    if (phase !== 'question') return;
    setSelected(answerId);
    setPhase('answer');
    const isCorrect = answerId === current.correctAnswer;
    if (isCorrect) setCorrectCount(c => c + 1);
    setAnswers(prev => ({ ...prev, [current.id]: answerId }));
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setPhase('question');
      setSelected(null);
    } else {
      addQuizResult({
        date: new Date().toISOString(),
        categoryId,
        score: correctCount + (selected === current.correctAnswer ? 1 : 0),
        total: questions.length,
      });
      setPhase('finished');
    }
  }

  if (phase === 'finished') {
    const finalScore = Object.keys(answers).filter(
      id => answers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer
    ).length;
    const pct = Math.round((finalScore / questions.length) * 100);
    return <QuizResults score={finalScore} total={questions.length} pct={pct} onRestart={() => navigate(0)} onHome={() => navigate('/quiz')} />;
  }

  const progress = (currentIndex + 1) / questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/quiz')}
          className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-sm flex-shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 dark:text-white text-sm truncate">{category.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentIndex + 1}/{questions.length} · {correctCount} poprawnych</p>
        </div>
        <div className={`text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
          currentIndex === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          : correctCount / currentIndex >= 0.6 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {currentIndex === 0 ? '—' : `${Math.round((correctCount / currentIndex) * 100)}%`}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${category.color} transition-all duration-300`} style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pytanie {current.id}</div>
        <p className="text-gray-900 dark:text-white font-medium leading-relaxed text-sm sm:text-base">{current.question}</p>
      </div>

      {/* Answers */}
      <div className="space-y-2.5">
        {current.answers.map(ans => {
          let style = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 active:scale-[0.98] hover:border-violet-400 dark:hover:border-violet-600';
          if (phase === 'answer') {
            if (ans.id === current.correctAnswer) {
              style = 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200';
            } else if (ans.id === selected) {
              style = 'bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-800 dark:text-red-200';
            } else {
              style = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 opacity-60';
            }
          }

          return (
            <button
              key={ans.id}
              onClick={() => handleAnswer(ans.id)}
              disabled={phase === 'answer'}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all ${style} flex gap-3 items-start min-h-[52px]`}
            >
              <span className="font-bold flex-shrink-0 uppercase mt-0.5">{ans.id}.</span>
              <span className="leading-relaxed flex-1">{ans.text}</span>
              {phase === 'answer' && ans.id === current.correctAnswer && <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">✓</span>}
              {phase === 'answer' && ans.id === selected && ans.id !== current.correctAnswer && <span className="ml-auto text-red-500 flex-shrink-0 mt-0.5">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {phase === 'answer' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 animate-slide-up">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Wyjaśnienie</div>
          <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{current.explanation}</p>
        </div>
      )}

      {phase === 'answer' && (
        <div className="flex justify-end animate-slide-up">
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-[0.98] hover:bg-violet-700 transition-colors shadow-sm min-h-[52px]"
          >
            {currentIndex < questions.length - 1 ? 'Następne pytanie →' : 'Zakończ quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

function QuizResults({ score, total, pct, onRestart, onHome }: {
  score: number; total: number; pct: number; onRestart: () => void; onHome: () => void;
}) {
  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';
  const message = pct >= 80 ? 'Świetny wynik!' : pct >= 60 ? 'Dobry wynik!' : pct >= 40 ? 'Jest nad czym popracować' : 'Wróć do fiszek i spróbuj ponownie';
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-10">
      <div className="text-6xl">{emoji}</div>
      <div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white">{pct}%</div>
        <div className="text-gray-500 dark:text-gray-400 mt-1">{score} / {total} poprawnych odpowiedzi</div>
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-2">{message}</div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onHome} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm active:scale-95 transition-transform">
          Wybierz inny quiz
        </button>
        <button onClick={onRestart} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium text-sm active:scale-95 transition-transform">
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
