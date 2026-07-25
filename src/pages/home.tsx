import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchPublicDecks } from '../services/deckService';
import { selectIsAuthenticated, selectCurrentUser } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const Home = () => {
  const isLogged = useSelector(selectIsAuthenticated);
  const username = useSelector(selectCurrentUser)?.username;
  const navigate = useNavigate();

  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPublicDecks(12);
      setDecks(page.decks ?? []);
    } catch {
      setError('Failed to load community decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Build Commander decks with AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
          Describe the deck you want and Decksmith builds a legal, synergy-driven
          100-card list — then refine it in conversation or have it analysed
          card by card.
        </p>
        {isLogged ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-600 dark:text-gray-400 m-0">Welcome back, {username}.</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/decksmith"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold no-underline transition-colors"
              >
                Open Decksmith
              </Link>
              <Link
                to="/decks"
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-semibold no-underline transition-colors"
              >
                My decks
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Link
              to="/register"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold no-underline transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-semibold no-underline transition-colors"
            >
              Log in
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">
          Community decks
        </h2>

        {loading ? (
          <Spinner label="Loading community decks" />
        ) : error ? (
          <ErrorState message={error} retry={load} />
        ) : decks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No public decks yet — share one from its deck page to see it here.
          </p>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
          >
            {decks.map((deck) => (
              <button
                key={deck._id}
                onClick={() => navigate(`/decks/${deck._id}`)}
                className="text-left flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden border-none cursor-pointer p-0"
              >
                <img
                  src={deck.commander_image || '/images/placeholder_commander.png'}
                  alt={`${deck.deck_name} commander`}
                  className="w-36 h-52 object-cover rounded-xl mx-auto mt-4"
                />
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-base font-bold truncate text-gray-900 dark:text-gray-100 m-0 mb-1">
                    {deck.deck_name}
                  </h3>
                  {deck.commander && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate m-0 mb-2">
                      {deck.commander}
                    </p>
                  )}
                  <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded self-start mt-auto">
                    {deck.format}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
