import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutLocal, selectAuthStatus } from '../../store/AuthSlice';
import { logoutUser } from '../../services/userService.js';
import { useTheme } from '../../context/ThemeContext';

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

const TopBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const { theme, toggleTheme } = useTheme();

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout failed:', err));
    navigate('/login');
  };

  return (
    <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
      <span className="font-bold text-base text-gray-900 dark:text-gray-100 select-none">
        ⚔ CommanderHut
      </span>
      <div className="flex items-center gap-2">
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
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
