import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import {
  fetchMTGIdea,
  refineDeck,
  acceptRefinement,
  GenerationExpiredError,
  ProgressEvent,
  RefineTarget,
} from '../services/aiService';
import { updateDeck } from '../services/deckService';
import MessageList, { ProgressState } from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';
import DeckDiffCard from '../Components/Decksmith/DeckDiffCard';
import SessionsPanel from '../Components/Decksmith/SessionsPanel';
import {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  setPendingDiff,
  setSavedDeckId,
  clearGenerationId,
  acceptPendingDiff,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
} from '../store/decksmithSlice';
import { AppDispatch } from '../store';

const GENERATE_STAGE_IDS = [
  'generating',
  'validating_commander',
  'commander',
  'validating_cards',
  'filling',
  'finalising',
];

const REFINE_STAGE_IDS = ['analysing', 'candidates', 'refining', 'validating'];

const IDLE_PROGRESS: ProgressState = {
  activeStage: null,
  activeMessage: '',
  completedStages: [],
  error: null,
};

const Decksmith = () => {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector(selectSessions);
  const activeSessionId = useSelector(selectActiveSessionId);
  const activeSession = useSelector(selectActiveSession);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(IDLE_PROGRESS);

  useEffect(() => {
    if (!activeSessionId) {
      dispatch(createSession());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeProgressHandler = (
    stageIds: string[],
    mode: ProgressState['mode']
  ) => (event: ProgressEvent) => {
    const idx = stageIds.indexOf(event.stage);
    setProgress({
      activeStage: event.stage,
      activeMessage: event.message,
      completedStages: idx > 0 ? stageIds.slice(0, idx) : [],
      error: null,
      mode,
    });
  };

  const reportFailure = (sessionId: string, err: unknown, fallbackStage: string) => {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
    setProgress(prev => ({
      ...prev,
      error: { stage: prev.activeStage ?? fallbackStage, message: errorMessage },
    }));
    dispatch(appendMessage({
      sessionId,
      message: {
        role: 'assistant',
        content: `Something went wrong: ${errorMessage}`,
        timestamp: Date.now(),
      },
    }));
  };

  const generateDeck = async (sessionId: string, userMsg: Message) => {
    const allMessages = [...(activeSession?.messages ?? []), userMsg];
    const prompt = buildPromptFromMessages(allMessages);
    const deck = await fetchMTGIdea(
      prompt,
      makeProgressHandler(GENERATE_STAGE_IDS, 'generate')
    );

    setProgress(prev => ({ ...prev, completedStages: GENERATE_STAGE_IDS, activeStage: null }));

    dispatch(appendMessage({
      sessionId,
      message: {
        role: 'assistant',
        content: deck.strategy
          ? `Here's your **${deck.commander}** deck!\n\n${deck.strategy}`
          : `Here's your **${deck.commander}** deck!`,
        timestamp: Date.now(),
      },
    }));
    dispatch(setDeck({ sessionId, deck }));
  };

  const refineExistingDeck = async (sessionId: string, target: RefineTarget, text: string) => {
    const diff = await refineDeck(
      target,
      text,
      makeProgressHandler(REFINE_STAGE_IDS, 'refine')
    );

    setProgress(prev => ({ ...prev, completedStages: REFINE_STAGE_IDS, activeStage: null }));

    dispatch(appendMessage({
      sessionId,
      message: {
        role: 'assistant',
        content: diff.summary || `Proposed ${diff.adds.length} change(s) — review them below.`,
        timestamp: Date.now(),
      },
    }));
    dispatch(setPendingDiff({ sessionId, diff }));
  };

  // Once a deck exists, follow-up messages refine it instead of starting over.
  // A saved deck is refined by id; an unsaved one by its generation preview.
  const refineTarget = (): RefineTarget | null => {
    const deck = activeSession?.deck;
    if (deck?.savedDeckId) return { deckId: deck.savedDeckId };
    if (deck?.generationId) return { generationId: deck.generationId };
    return null;
  };

  const handleSend = async (text: string) => {
    if (!activeSessionId) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    dispatch(appendMessage({ sessionId: activeSessionId, message: userMsg }));

    setLoading(true);
    setProgress(IDLE_PROGRESS);
    const target = refineTarget();
    try {
      if (target) {
        await refineExistingDeck(activeSessionId, target, text);
      } else {
        await generateDeck(activeSessionId, userMsg);
      }
    } catch (err) {
      if (err instanceof GenerationExpiredError) {
        // The preview is gone; drop it so the next message generates afresh.
        dispatch(clearGenerationId({ sessionId: activeSessionId }));
        reportFailure(
          activeSessionId,
          new Error('That deck is no longer open for refining — send your request again to build a new one.'),
          'refining'
        );
      } else {
        reportFailure(activeSessionId, err, target ? 'refining' : 'generating');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Commits the staged diff. An unsaved generation is applied to its preview
   * server-side; a saved deck is patched directly, keeping the commander in
   * the list so it stays a complete 100.
   */
  const handleAcceptDiff = async () => {
    const deck = activeSession?.deck;
    const diff = activeSession?.pendingDiff;
    if (!activeSessionId || !deck || !diff) return;

    setLoading(true);
    try {
      if (deck.generationId) {
        await acceptRefinement(deck.generationId);
      } else if (deck.savedDeckId) {
        const cutIds = new Set(diff.cuts.map(c => c._id));
        const cards = [
          { name: deck.commander, quantity: 1 },
          ...deck.cards
            .filter(c => !cutIds.has(c._id))
            .map(c => ({ name: c.name, quantity: c.quantity })),
          ...diff.adds.map(a => ({ name: a.name, quantity: 1 })),
        ];
        await updateDeck(deck.savedDeckId, { cards });
      } else {
        throw new Error('This deck is no longer open for editing');
      }
      dispatch(acceptPendingDiff({ sessionId: activeSessionId }));
    } catch (err) {
      if (err instanceof GenerationExpiredError) {
        dispatch(clearGenerationId({ sessionId: activeSessionId }));
      }
      reportFailure(activeSessionId, err, 'refining');
    } finally {
      setLoading(false);
    }
  };

  const pendingDiff = activeSession?.pendingDiff ?? null;

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
      <SessionsPanel
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => dispatch(setActiveSession(id))}
        onNewSession={() => dispatch(createSession())}
      />
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
        <MessageList
          messages={activeSession?.messages ?? []}
          // Keep the stage list visible after a failure so the red ✕ and its
          // message are actually readable.
          loading={loading || !!progress.error}
          progress={loading || progress.error ? progress : undefined}
          footer={pendingDiff && activeSessionId ? (
            <DeckDiffCard
              diff={pendingDiff}
              disabled={loading}
              onAccept={handleAcceptDiff}
              onDiscard={() => dispatch(setPendingDiff({ sessionId: activeSessionId, diff: null }))}
            />
          ) : undefined}
        />
        <ChatInput
          onSend={handleSend}
          // Reviewing a proposed change first keeps the deck and the server
          // preview from drifting apart.
          disabled={loading || !!pendingDiff}
          placeholder={pendingDiff
            ? 'Apply or discard the proposed changes to continue'
            : activeSession?.deck
              ? 'Refine your deck — e.g. "more removal", "swap Sol Ring"'
              : undefined}
        />
      </div>
      <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: '320px' }}>
        <DeckPanel
          deck={activeSession?.deck ?? null}
          onSave={(deckName, deckId) => {
            if (!activeSessionId) return;
            dispatch(updateSessionTitle({ sessionId: activeSessionId, title: deckName }));
            // Saving consumes the generation preview; refine the saved deck now.
            if (deckId) dispatch(setSavedDeckId({ sessionId: activeSessionId, deckId }));
            dispatch(clearGenerationId({ sessionId: activeSessionId }));
          }}
        />
      </div>
    </div>
  );
};

export default Decksmith;
