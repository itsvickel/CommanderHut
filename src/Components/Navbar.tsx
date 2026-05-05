import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutLocal, selectAuthStatus, selectIsAdmin } from '../store/AuthSlice';
import { logoutUser } from '../services/userService.js';
import { useTheme } from '../context/ThemeContext';

interface NavLink { name: string; to: string; }

const PUBLIC_LINKS: NavLink[] = [{ name: 'Cards', to: '/cards' }];
const PROTECTED_LINKS: NavLink[] = [
  { name: 'Decks', to: '/decks' },
  { name: 'Sandbox', to: '/sandbox' },
  { name: 'AI Decksmith', to: '/decksmith' },
  { name: 'Profile', to: '/profile' },
];

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);
  const { theme, toggleTheme } = useTheme();

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout request failed:', err));
    navigate('/');
  };

  const links = status === 'authenticated' ? [...PUBLIC_LINKS, ...PROTECTED_LINKS] : PUBLIC_LINKS;
  const linkClass = 'px-3 py-1 text-sm text-gray-900 dark:text-gray-100 no-underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-1">
      {links.map((item) => (
        <Link key={item.to} to={item.to} className={linkClass}>{item.name}</Link>
      ))}
      {status === 'unauthenticated' && (
        <>
          <Link to="/login" className={linkClass}>Login</Link>
          <Link to="/register" className={linkClass}>Register</Link>
        </>
      )}
      {status === 'authenticated' && isAdmin && (
        <Link to="/admin/masterprompt" className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 no-underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Admin</Link>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        {status === 'authenticated' && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
