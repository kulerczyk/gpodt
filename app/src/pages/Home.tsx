import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { ALL_QUESTIONS } from '../data';
import { useProgress } from '../hooks/useProgress';

export default function Home() {
  const navigate = useNavigate();
  const { progress } = useProgress();

  const totalQuestions = ALL_QUESTIONS.length;
  const totalTests = progress.testResults.length;
  const lastTestScore = progress.testResults[0]
    ? Math.round((progress.testResults[0].score / progress.testResults[0].total) * 100)
    : null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-6">
        <div className="text-5xl">☕</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          <span className="text-violet-600 dark:text-violet-400">GPODT</span>
        </h1>
        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase">Get Pass Or Die Tryin'</p>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Przygotuj się do kolokwium z 299 pytaniami ze wszystkich kategorii Java.
          Ucz się z fiszkami, ćwicz quizy i sprawdź się w trybie egzaminacyjnym.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Wszystkich pytań" value={totalQuestions} color="violet" />
        <StatCard label="Kategorii" value={CATEGORIES.length} color="blue" />
        <StatCard label="Rozwiązanych testów" value={totalTests} color="emerald" />
        <StatCard
          label="Ostatni test"
          value={lastTestScore !== null ? `${lastTestScore}%` : '—'}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionCard
          icon="🃏"
          title="Fiszki"
          description="Ucz się pytań z odpowiedziami podzielonymi na kategorie"
          onClick={() => navigate('/study')}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <ActionCard
          icon="🎯"
          title="Quiz"
          description="4 odpowiedzi do wyboru – ćwicz per kategoria lub wszystkie 299"
          onClick={() => navigate('/quiz')}
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <ActionCard
          icon="📝"
          title="Próbny egzamin"
          description="30 losowych pytań – sprawdź swoją gotowość do kolokwium"
          onClick={() => navigate('/test')}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Kategorie</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onStudy={() => navigate(`/study/${cat.id}`)}
              onQuiz={() => navigate(`/quiz/${cat.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75 mt-0.5">{label}</div>
    </div>
  );
}

function ActionCard({
  icon, title, description, onClick, color,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-2xl p-6 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg hover:shadow-xl`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-bold text-lg mb-1">{title}</div>
      <div className="text-sm opacity-80">{description}</div>
    </button>
  );
}

function CategoryCard({
  category,
  onStudy,
  onQuiz,
}: {
  category: typeof CATEGORIES[0];
  onStudy: () => void;
  onQuiz: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-lg flex-shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">{category.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{category.questionCount} pytań</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{category.description}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onStudy}
          className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          🃏 Fiszki
        </button>
        <button
          onClick={onQuiz}
          className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors font-medium"
        >
          🎯 Quiz
        </button>
      </div>
    </div>
  );
}
