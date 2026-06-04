import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByCategory } from '../data';
import { CATEGORIES } from '../data/categories';
import type { Question } from '../types';
import { useProgress } from '../hooks/useProgress';

export default function StudyMode() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { markStudied, isStudied } = useProgress();

  if (!categoryId) return <CategoryPicker />;

  const questions = getQuestionsByCategory(categoryId);
  const category = CATEGORIES.find(c => c.id === categoryId);

  if (!category || questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kategoria nie znaleziona.</p>
        <button onClick={() => navigate('/study')} className="mt-4 text-violet-600 hover:underline">
          Wróć
        </button>
      </div>
    );
  }

  return <FlashcardDeck questions={questions} category={category} onMarkStudied={markStudied} isStudied={isStudied} />;
}

function CategoryPicker() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Fiszki – wybierz kategorię</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Kliknij na kartę pytania, aby zobaczyć odpowiedź i wyjaśnienie</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => navigate(`/study/${cat.id}`)}
            className="text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:shadow-md group"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg mb-3`}>
              {cat.icon}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">{cat.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cat.questionCount} pytań</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FlashcardDeck({
  questions,
  category,
  onMarkStudied,
  isStudied,
}: {
  questions: Question[];
  category: typeof CATEGORIES[0];
  onMarkStudied: (id: number) => void;
  isStudied: (id: number) => boolean;
}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [key, setKey] = useState(0);

  const current = questions[currentIndex];
  const studied = isStudied(current.id);

  const goTo = useCallback((idx: number) => {
    setIsFlipped(false);
    setKey(k => k + 1);
    setCurrentIndex(idx);
  }, []);

  const prev = () => goTo(Math.max(0, currentIndex - 1));
  const next = () => {
    onMarkStudied(current.id);
    goTo(Math.min(questions.length - 1, currentIndex + 1));
  };

  const flip = () => {
    if (!isFlipped) onMarkStudied(current.id);
    setIsFlipped(f => !f);
  };

  const progress = (currentIndex + 1) / questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/study')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ←
        </button>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-sm`}>
          {category.icon}
        </div>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">{category.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentIndex + 1} / {questions.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${category.color} transition-all duration-300`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        key={key}
        className="flip-card cursor-pointer select-none"
        style={{ height: '320px' }}
        onClick={flip}
      >
        <div className={`flip-card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front w-full h-full bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pytanie {current.id}</span>
              {studied && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Przejrzane</span>}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {current.question}
              </p>
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">Kliknij, aby zobaczyć odpowiedź</div>
          </div>

          {/* Back */}
          <div className="flip-card-back w-full h-full bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-2xl border-2 border-violet-200 dark:border-violet-800 p-6 flex flex-col shadow-sm overflow-y-auto">
            <div className="mb-3">
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Odpowiedź</span>
            </div>
            <div className="mb-3">
              <div className="bg-violet-100 dark:bg-violet-900/40 rounded-lg p-3">
                <span className="font-bold text-violet-700 dark:text-violet-300 uppercase text-sm mr-2">
                  {current.correctAnswer.toUpperCase()}.
                </span>
                <span className="text-violet-800 dark:text-violet-200 text-sm font-medium">
                  {current.answers.find(a => a.id === current.correctAnswer)?.text}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Wyjaśnienie</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{current.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All answers list */}
      {isFlipped && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2 animate-slide-up">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Wszystkie odpowiedzi</div>
          {current.answers.map(ans => (
            <div
              key={ans.id}
              className={`flex gap-2 p-2 rounded-lg text-sm ${
                ans.id === current.correctAnswer
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className={`font-bold flex-shrink-0 ${ans.id === current.correctAnswer ? 'text-emerald-600' : 'text-gray-400'}`}>
                {ans.id.toUpperCase()}.
              </span>
              <span>{ans.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ← Poprzednie
        </button>

        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-violet-500 w-4'
                  : isStudied(questions[i].id)
                  ? 'bg-emerald-400 dark:bg-emerald-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
        >
          Następne →
        </button>
      </div>
    </div>
  );
}
