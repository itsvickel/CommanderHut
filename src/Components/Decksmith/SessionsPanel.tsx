import { DecksmithSession } from '../../store/decksmithSlice';

interface Props {
  sessions: DecksmithSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

function relativeDate(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(isoString).toLocaleDateString();
}

const SessionsPanel = ({ sessions, activeSessionId, onSelectSession, onNewSession }: Props) => (
  <div className="flex-shrink-0 w-[220px] bg-gray-800 flex flex-col border-r border-gray-700">
    <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
      Sessions
    </div>
    <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-2">
      {sessions.map(session => {
        const isActive = session.id === activeSessionId;
        return (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors border-l-2 ${
              isActive
                ? 'bg-gray-700 border-amber-400 text-gray-100'
                : 'border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="font-medium truncate">{session.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{relativeDate(session.createdAt)}</div>
          </button>
        );
      })}
    </div>
    <div className="px-3 py-3 border-t border-gray-700">
      <button
        onClick={onNewSession}
        className="w-full py-2 text-sm font-semibold text-amber-400 border border-amber-400 rounded-md hover:bg-amber-400 hover:text-gray-900 transition-colors"
      >
        + New session
      </button>
    </div>
  </div>
);

export default SessionsPanel;
