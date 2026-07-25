import { DeckAnalysis } from '../../types/analysis';

interface Props {
  analysis: DeckAnalysis;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ramp: 'Ramp',
  draw: 'Card draw',
  removal: 'Removal',
  counterspell: 'Counterspells',
  tutor: 'Tutors',
  board_wipe: 'Board wipes',
  recursion: 'Recursion',
};

const StatTile = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
    <p className="text-xs text-gray-500 dark:text-gray-400 m-0">{label}</p>
    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 leading-tight">{value}</p>
  </div>
);

/** Horizontal bar chart of the mana curve, scaled to its own maximum. */
const CurveChart = ({ curve }: { curve: Record<string, number> }) => {
  const max = Math.max(1, ...Object.values(curve));
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(curve).map(([bucket, count]) => (
        <div key={bucket} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-8 flex-shrink-0 text-right">{bucket}</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded h-4 overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-600 rounded"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 w-6 flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
};

const DeckAnalysisPanel = ({ analysis, onClose }: Props) => {
  const { stats } = analysis;

  return (
    <section
      aria-label="Deck analysis"
      className="max-w-screen-xl mx-auto mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold m-0 text-gray-900 dark:text-gray-100">Deck analysis</h2>
        <button
          onClick={onClose}
          aria-label="Close analysis"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer text-xl leading-none"
        >
          ×
        </button>
      </div>

      {analysis.verdict && (
        <p className="text-sm text-gray-700 dark:text-gray-200 mb-4 m-0">{analysis.verdict}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
        <StatTile label="Cards" value={stats.total_cards} />
        <StatTile label="Lands" value={stats.lands} />
        <StatTile label="Avg mana value" value={stats.average_mana_value} />
        <StatTile label="Est. bracket" value={stats.estimated_bracket} />
        <StatTile label="Est. price" value={`$${stats.total_price_usd}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Mana curve
          </h3>
          <CurveChart curve={stats.curve} />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Role coverage
          </h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <li key={key} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>{label}</span>
                <span className="font-semibold">{stats.role_counts[key] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          {analysis.strengths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">
                Strengths
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-300 pl-4 m-0 flex flex-col gap-1">
                {analysis.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
          {analysis.weaknesses.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                Weaknesses
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-300 pl-4 m-0 flex flex-col gap-1">
                {analysis.weaknesses.map(w => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {stats.off_identity.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-4 m-0">
          Illegal for this commander's color identity: {stats.off_identity.join(', ')}
        </p>
      )}

      {analysis.suggestions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Suggested upgrades
          </h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {analysis.suggestions.map(s => (
              <li key={s._id} className="text-xs">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                {s.reason && <span className="text-gray-500 dark:text-gray-400"> — {s.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DeckAnalysisPanel;
