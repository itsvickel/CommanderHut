import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchAllDecks, deleteDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import DeckOverflowMenu from '../Components/Deck/DeckOverflowMenu';
import DeleteDeckModal from '../Components/Deck/DeleteDeckModal';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllDecks();
      setDecks(res ?? []);
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError('Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDeck(deleteTarget.id);
      setDecks(prev => prev.filter(d => d._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Error deleting deck:', err);
      setDeleteError(err?.response?.data?.error ?? 'Failed to delete deck. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading decks" />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <div className="w-[90%] max-w-[960px] mx-auto mt-12 p-4">
      <h2 className="text-[2.5rem] mb-10 text-center text-[#222] font-bold">Your Decks</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 overflow-y-scroll max-h-[70vh]">
        {decks.length === 0 ? (
          <p className="text-[1.2rem] text-center text-[#666] col-span-full">No decks found. Create one!</p>
        ) : (
          decks.map((item) => {
            const isOwner = item.owner === currentUser?.id;
            return (
              <div
                key={item._id}
                onClick={() => navigate(`/decks/${item._id}`)}
                className="relative flex flex-col cursor-pointer bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] overflow-hidden transition-[transform,box-shadow] duration-[250ms] ease-[ease] hover:-translate-y-[5px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] [&:hover_img]:scale-110"
              >
                {isOwner && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <DeckOverflowMenu
                      onEdit={() => navigate(`/decks/${item._id}/edit`)}
                      onDelete={() => setDeleteTarget({ id: item._id, name: item.deck_name })}
                    />
                  </div>
                )}
                <img
                  src={item.commander_image || '/images/placeholder_commander.png'}
                  alt={`${item.deck_name} Commander`}
                  className="w-[160px] h-[224px] object-cover rounded-t-xl mx-auto mb-4 bg-[#f9f9f9] transition-transform duration-500 will-change-transform"
                />
                <div className="px-5 pb-6 pt-4 flex flex-col flex-grow">
                  <h3 className="text-[1.6rem] mb-3 text-[#111] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{item.deck_name}</h3>
                  <div className="mt-auto text-[#555] text-[0.9rem] flex flex-col gap-1">
                    <span className="font-medium text-[#666]"><strong>Owner:</strong> {item.owner_email || 'Anonymous'}</span>
                    <span className="font-medium text-[#666]">
                      <strong>Last Updated:</strong>{' '}
                      {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <DeleteDeckModal
        isOpen={!!deleteTarget}
        deckName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />
    </div>
  );
};

export default DeckPage;
