import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomQuestions, shuffleAnswers } from '../data';
import type { Question } from '../types';
import { useProgress } from '../hooks/useProgress';

const TEST_SIZE = 30;

export default function TestMode() {
  const navigate = useNavigate();
  const { addTestResult, progress } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'test' | 'results'>('intro');
  const [score, setScore] = useState(0);

  const questions = useMemo(() => getRandomQuestions(TEST_SIZE).map(shuffleAnswers), []);

  function handleFinish(finalScore: number, questionIds: number[]) {
    setScore(finalScore);
    addTestResult({
      date: new Date().toISOString(),
      score: finalScore,
      total: TEST_SIZE,
      questionIds,
    });
    setPhase('results');
  }

  if (phase === 'intro') {
    return <TestIntro onStart={() => setPhase('test')} history={progress.testResults} />;
  }

  if (phase === 'results') {
    return <TestResults score={score} total={TEST_SIZE} onRetry={() => navigate(0)} onHome={() => navigate('/')} />;
  }

  return <TestExam questions={questions} onFinish={handleFinish} />;
}

function TestIntro({ onStart, history }: { onStart: () => void; history: Array<{date: string; score: number; total: number}> }) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-3 py-6">
        <div className="text-5xl">📝</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Próbny egzamin</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {TEST_SIZE} losowo wybranych pytań ze wszystkich kategorii. Odpowiadaj jak na prawdziwym kolokwium!
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <div className="font-semibold text-gray-900 dark:text-white">Zasady testu</div>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex gap-2"><span>✓</span> {TEST_SIZE} pytań z różnych kategorii</li>
          <li className="flex gap-2"><span>✓</span> 4 odpowiedzi do wyboru, 1 poprawna</li>
          <li className="flex gap-2"><span>✓</span> Wyjaśnienie po każdej odpowiedzi</li>
          <li className="flex gap-2"><span>✓</span> Wyniki zapisywane w historii</li>
        </ul>
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="font-semibold text-gray-900 dark:text-white mb-3">Poprzednie wyniki</div>
          <div className="space-y-2">
            {history.slice(0, 5).map((r, i) => {
              const pct = Math.round((r.score / r.total) * 100);
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(r.date).toLocaleDateString('pl-PL')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-300">{r.score}/{r.total}</span>
                    <span className={`font-bold ${pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-colors shadow-md"
      >
        Zacznij egzamin →
      </button>
    </div>
  );
}

function TestExam({
  questions,
  onFinish,
}: {
  questions: Question[];
  onFinish: (score: number, ids: number[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'question' | 'answer'>('question');
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<number, string>>({});

  const current = questions[currentIndex];

  function handleAnswer(answerId: string) {
    if (phase !== 'question') return;
    setSelected(answerId);
    setPhase('answer');
    if (answerId === current.correctAnswer) setCorrectCount(c => c + 1);
    setAllAnswers(prev => ({ ...prev, [current.id]: answerId }));
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setPhase('question');
      setSelected(null);
    } else {
      const finalScore = Object.keys(allAnswers).filter(
        id => allAnswers[parseInt(id)] === questions.find(q => q.id === parseInt(id))?.correctAnswer
      ).length;
      onFinish(finalScore, questions.map(q => q.id));
    }
  }

  const progress = (currentIndex + 1) / questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">Próbny egzamin</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pytanie {currentIndex + 1} / {questions.length} • {correctCount} poprawnych</p>
        </div>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${correctCount / (currentIndex + 1) >= 0.6 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {Math.round((correctCount / (currentIndex + 1)) * 100)}%
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pytanie {current.id}</div>
        <p className="text-gray-900 dark:text-white font-medium leading-relaxed">{current.question}</p>
      </div>

      {/* Answers */}
      <div className="space-y-2">
        {current.answers.map(ans => {
          let style = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
          if (phase === 'answer') {
            if (ans.id === current.correctAnswer) {
              style = 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200';
            } else if (ans.id === selected) {
              style = 'bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-800 dark:text-red-200';
            } else {
              style = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 opacity-50';
            }
          }

          return (
            <button
              key={ans.id}
              onClick={() => handleAnswer(ans.id)}
              disabled={phase === 'answer'}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${style} flex gap-3 items-start`}
            >
              <span className="font-bold flex-shrink-0 uppercase">{ans.id}.</span>
              <span className="leading-relaxed">{ans.text}</span>
              {phase === 'answer' && ans.id === current.correctAnswer && (
                <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex-shrink-0">✓</span>
              )}
              {phase === 'answer' && ans.id === selected && ans.id !== current.correctAnswer && (
                <span className="ml-auto text-red-500 flex-shrink-0">✗</span>
              )}
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
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {currentIndex < questions.length - 1 ? 'Następne pytanie →' : 'Zakończ egzamin'}
          </button>
        </div>
      )}
    </div>
  );
}

function TestResults({ score, total, onRetry, onHome }: {
  score: number;
  total: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 60;
  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '✅' : pct >= 40 ? '📚' : '😅';

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-10">
      <div className="text-6xl">{emoji}</div>
      <div>
        <div className={`text-5xl font-bold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {pct}%
        </div>
        <div className="text-gray-500 dark:text-gray-400 mt-2">{score} / {total} poprawnych odpowiedzi</div>
        <div className={`text-xl font-bold mt-2 ${passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
          {passed ? '✓ ZDANE!' : '✗ Nie zdane'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {pct >= 80 ? 'Excellent! Dobrze przygotowany/a do kolokwium.' :
           pct >= 60 ? 'Przeszedłeś/aś próg. Powtórz słabsze kategorie.' :
           pct >= 40 ? 'Potrzeba więcej nauki. Wróć do fiszek.' :
           'Wróć do podstaw i zacznij od fiszek.'}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={onHome} className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Strona główna
        </button>
        <button onClick={onRetry} className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors">
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
