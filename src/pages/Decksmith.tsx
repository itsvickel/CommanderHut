import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { fetchMTGIdea, ProgressEvent } from '../services/aiService';
import MessageList, { ProgressState } from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';
import SessionsPanel from '../Components/Decksmith/SessionsPanel';
import {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
} from '../store/decksmithSlice';
import { AppDispatch } from '../store';

const STAGE_IDS = [
  'generating',
  'validating_commander',
  'commander',
  'validating_cards',
  'filling',
  'finalising',
];

const Decksmith = () => {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector(selectSessions);
  const activeSessionId = useSelector(selectActiveSessionId);
  const activeSession = useSelector(selectActiveSession);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    activeStage: null,
    activeMessage: '',
    completedStages: [],
    error: null,
  });

  useEffect(() => {
    if (!activeSessionId) {
      dispatch(createSession());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProgress = (event: ProgressEvent) => {
    const idx = STAGE_IDS.indexOf(event.stage);
    setProgress({
      activeStage: event.stage,
      activeMessage: event.message,
      completedStages: idx > 0 ? STAGE_IDS.slice(0, idx) : [],
      error: null,
    });
  };

  const handleSend = async (text: string) => {
    if (!activeSessionId) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    dispatch(appendMessage({ sessionId: activeSessionId, message: userMsg }));

    setLoading(true);
    setProgress({ activeStage: null, activeMessage: '', completedStages: [], error: null });

    try {
      const allMessages = [...(activeSession?.messages ?? []), userMsg];
      const prompt = buildPromptFromMessages(allMessages);
      const deck = await fetchMTGIdea(prompt, handleProgress);

      setProgress(prev => ({ ...prev, completedStages: STAGE_IDS, activeStage: null }));

      const aiMsg: Message = {
        role: 'assistant',
        content: deck.strategy
          ? `Here's your **${deck.commander}** deck!\n\n${deck.strategy}`
          : `Here's your **${deck.commander}** deck!`,
        timestamp: Date.now(),
      };
      dispatch(appendMessage({ sessionId: activeSessionId, message: aiMsg }));
      dispatch(setDeck({ sessionId: activeSessionId, deck }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setProgress(prev => ({
        ...prev,
        error: { stage: prev.activeStage ?? 'generating', message: errorMessage },
      }));
      dispatch(appendMessage({
        sessionId: activeSessionId,
        message: {
          role: 'assistant',
          content: `Something went wrong: ${errorMessage}`,
          timestamp: Date.now(),
        },
      }));
    } finally {
      setLoading(false);
    }
  };

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
        />
        <ChatInput onSend={handleSend} disabled={loading} />
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
