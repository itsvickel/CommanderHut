import { DeckDiff } from '../../types/chat';

interface Props {
  diff: DeckDiff;
  onAccept: () => void;
  onDiscard: () => void;
  disabled?: boolean;
}

/**
 * Shows a pending refinement as a reviewable change list: cuts in red,
 * adds in green, with accept/discard actions.
 */
const DeckDiffCard = ({ diff, onAccept, onDiscard, disabled }: Props) => (
  <div className="self-start w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-200 dark:border-gray-700">
    {diff.summary && (
      <p className="text-sm text-gray-700 dark:text-gray-200 m-0 mb-3">{diff.summary}</p>
    )}

    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 m-0 mb-1">
      Proposed changes ({diff.adds.length})
    </p>

    <ul className="list-none p-0 m-0 mb-3 flex flex-col gap-1">
      {diff.cuts.map(cut => (
        <li key={`cut-${cut._id}`} className="text-xs flex items-baseline gap-1.5">
          <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">−</span>
          <span className="text-red-600 dark:text-red-400 line-through">{cut.name}</span>
          {cut.reason && <span className="text-gray-400 truncate">— {cut.reason}</span>}
        </li>
      ))}
      {diff.adds.map(add => (
        <li key={`add-${add._id}`} className="text-xs flex items-baseline gap-1.5">
          <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">+</span>
          <span className="text-green-700 dark:text-green-400 font-medium">{add.name}</span>
          {add.role && <span className="text-gray-400 truncate">— {add.role}</span>}
        </li>
      ))}
    </ul>

    <div className="flex gap-2">
      <button
        onClick={onAccept}
        disabled={disabled}
        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Apply changes
      </button>
      <button
        onClick={onDiscard}
        disabled={disabled}
        className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Discard
      </button>
    </div>
  </div>
);

export default DeckDiffCard;
