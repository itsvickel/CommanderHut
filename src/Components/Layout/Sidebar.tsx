import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus } from '../../store/AuthSlice';

interface NavItem {
  label: string;
  icon: string;
  to: string;
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'AI Decksmith', icon: '🤖', to: '/decksmith', requiresAuth: true },
  { label: 'My Decks',     icon: '🃏', to: '/decks',     requiresAuth: true },
  { label: 'Cards',        icon: '🔍', to: '/cards',     requiresAuth: false },
  { label: 'Sandbox',      icon: '⚡', to: '/sandbox',   requiresAuth: false },
];

const Sidebar = () => {
  const location = useLocation();
  const isAuthenticated = useSelector(selectAuthStatus) === 'authenticated';

  const iconBtn = (to: string, icon: string, label: string) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        key={to}
        to={to}
        title={label}
        aria-label={label}
        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-colors ${
          isActive
            ? 'bg-amber-500 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
        }`}
      >
        {icon}
      </Link>
    );
  };

  return (
    <aside className="flex-shrink-0 w-16 bg-gray-800 flex flex-col items-center py-3 gap-1">
      {NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated).map(item =>
        iconBtn(item.to, item.icon, item.label)
      )}
      {isAuthenticated && (
        <div className="mt-auto">
          {iconBtn('/profile', '👤', 'Profile')}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
