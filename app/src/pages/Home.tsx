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
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2 py-4">
        <div className="text-5xl">☕</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          <span className="text-violet-600 dark:text-violet-400">GPODT</span>
        </h1>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
          Get Pass Or Die Tryin'
        </p>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
          299 pytań, 9 kategorii Java. Fiszki, quiz i próbny egzamin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pytań" value={totalQuestions} color="violet" />
        <StatCard label="Kategorii" value={CATEGORIES.length} color="blue" />
        <StatCard label="Testów" value={totalTests} color="emerald" />
        <StatCard
          label="Ostatni test"
          value={lastTestScore !== null ? `${lastTestScore}%` : '—'}
          color="amber"
        />
      </div>

      {/* Quick actions – hidden on mobile (use bottom nav) */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        <ActionCard icon="🃏" title="Fiszki" description="Ucz się z pytań i odpowiedzi" onClick={() => navigate('/study')} color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <ActionCard icon="🎯" title="Quiz" description="Ćwicz pytania ze 4 opcjami" onClick={() => navigate('/quiz')} color="bg-gradient-to-br from-blue-500 to-cyan-600" />
        <ActionCard icon="📝" title="Próbny egzamin" description="30 losowych pytań" onClick={() => navigate('/test')} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
      </div>

      {/* Mobile quick action tiles */}
      <div className="sm:hidden grid grid-cols-3 gap-2">
        {[
          { icon: '🃏', label: 'Fiszki', to: '/study', bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
          { icon: '🎯', label: 'Quiz', to: '/quiz', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
          { icon: '📝', label: 'Egzamin', to: '/test', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
        ].map(item => (
          <button key={item.to} onClick={() => navigate(item.to)}
            className={`${item.bg} rounded-xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Kategorie</h2>
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
    <div className={`rounded-xl p-3 sm:p-4 ${colors[color]}`}>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-0.5">{label}</div>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick, color }: {
  icon: string; title: string; description: string; onClick: () => void; color: string;
}) {
  return (
    <button onClick={onClick} className={`${color} text-white rounded-2xl p-5 text-left active:scale-[0.98] hover:scale-[1.02] transition-transform shadow-lg`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-bold">{title}</div>
      <div className="text-sm opacity-80 mt-1">{description}</div>
    </button>
  );
}

function CategoryCard({ category, onStudy, onQuiz }: {
  category: typeof CATEGORIES[0]; onStudy: () => void; onQuiz: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-base flex-shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{category.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{category.questionCount} pytań</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onStudy} className="flex-1 text-xs py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-transform font-medium min-h-[36px]">
          🃏 Fiszki
        </button>
        <button onClick={onQuiz} className="flex-1 text-xs py-2 px-3 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 active:scale-95 transition-transform font-medium min-h-[36px]">
          🎯 Quiz
        </button>
      </div>
    </div>
  );
}
