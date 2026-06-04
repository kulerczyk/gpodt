import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark, setIsDark } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            <span className="text-2xl">☕</span>
            <span>GPODT</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 hidden sm:block">Get Pass Or Die Tryin'</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" label="Strona główna" current={location.pathname === '/'} />
            <button
              onClick={() => setIsDark(!isDark)}
              className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Przełącz motyw"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, label, current }: { to: string; label: string; current: boolean }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        current
          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </Link>
  );
}
