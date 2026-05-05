import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchDeckListByName } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDeckListByName(user.id);
      setDecks(res ?? []);
    } catch {
      setError('Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading decks" />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <h2 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">
        Your Decks
      </h2>

      {decks.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          No decks yet —{' '}
          <Link to="/sandbox" className="text-blue-600 dark:text-blue-400 underline">
            create one in Sandbox
          </Link>
        </p>
      ) : (
        <div
          className="grid gap-8 overflow-y-auto max-h-[70vh]"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          {decks.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/decks/${item._id}`)}
              className="flex flex-col cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
            >
              <img
                src={item.commander_image || '/images/placeholder_commander.png'}
                alt={`${item.deck_name} Commander`}
                className="w-40 h-56 object-cover rounded-xl mx-auto mt-4"
              />
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100 mb-2">
                  {item.deck_name}
                </h3>
                <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded mb-2 self-start">
                  {item.format}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckPage;
