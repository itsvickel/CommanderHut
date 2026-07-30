import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchDeckListByName } from '../../services/deckService';
import { selectCurrentUser } from '../../store/AuthSlice';
import Spinner from '../../Components/UI_Components/Spinner';
import ErrorState from '../../Components/UI_Components/ErrorState';

interface DeckSummary {
  _id: string;
  deck_name: string;
  format: string;
  commander?: string;
  source?: 'manual' | 'ai';
}

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDeckListByName(user.id);
      setDecks(res ?? []);
    } catch {
      setError('Failed to load your decks.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const aiDecks = decks.filter(d => d.source === 'ai').length;
  const initial = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <section className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0 truncate">
            {user?.username ?? 'Your profile'}
          </h1>
          {user?.email_address && (
            <p className="text-sm text-gray-500 dark:text-gray-400 m-0 truncate">{user.email_address}</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 m-0">Decks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">{decks.length}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 m-0">AI-built</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">{aiDecks}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 m-0">Daily AI limit</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">20</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Your decks</h2>

        {loading ? (
          <Spinner label="Loading your decks" />
        ) : error ? (
          <ErrorState message={error} retry={load} />
        ) : decks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No decks yet —{' '}
            <Link to="/decksmith" className="text-blue-600 dark:text-blue-400 underline">
              build one with Decksmith
            </Link>
          </p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {decks.map(deck => (
              <li key={deck._id}>
                <Link
                  to={`/decks/${deck._id}`}
                  className="flex items-baseline justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg no-underline hover:border-amber-400 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {deck.deck_name}
                    </span>
                    {deck.commander && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                        {deck.commander}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {deck.source === 'ai' ? 'AI' : 'Manual'} · {deck.format}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
