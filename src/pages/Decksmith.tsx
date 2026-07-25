import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { fetchMTGIdea, refineDeck, ProgressEvent } from '../services/aiService';
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

  const refineExistingDeck = async (sessionId: string, generationId: string, text: string) => {
    const diff = await refineDeck(
      generationId,
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

  const handleSend = async (text: string) => {
    if (!activeSessionId) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    dispatch(appendMessage({ sessionId: activeSessionId, message: userMsg }));

    setLoading(true);
    setProgress(IDLE_PROGRESS);

    // Once a deck exists, follow-up messages refine it instead of starting over.
    const generationId = activeSession?.deck?.generationId;
    try {
      if (generationId) {
        await refineExistingDeck(activeSessionId, generationId, text);
      } else {
        await generateDeck(activeSessionId, userMsg);
      }
    } catch (err) {
      reportFailure(activeSessionId, err, generationId ? 'refining' : 'generating');
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
          loading={loading}
          progress={loading ? progress : undefined}
          footer={pendingDiff && activeSessionId ? (
            <DeckDiffCard
              diff={pendingDiff}
              disabled={loading}
              onAccept={() => dispatch(acceptPendingDiff({ sessionId: activeSessionId }))}
              onDiscard={() => dispatch(setPendingDiff({ sessionId: activeSessionId, diff: null }))}
            />
          ) : undefined}
        />
        <ChatInput
          onSend={handleSend}
          disabled={loading}
          placeholder={activeSession?.deck
            ? 'Refine your deck — e.g. "more removal", "swap Sol Ring"'
            : undefined}
        />
      </div>
      <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: '320px' }}>
        <DeckPanel
          deck={activeSession?.deck ?? null}
          onSave={(deckName) => {
            if (activeSessionId) {
              dispatch(updateSessionTitle({ sessionId: activeSessionId, title: deckName }));
            }
          }}
        />
      </div>
    </div>
  );
};

export default Decksmith;
