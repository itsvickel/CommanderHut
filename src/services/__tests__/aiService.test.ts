import { saveAIDeck, acceptRefinement, refineDeck, GenerationExpiredError } from '../aiService';

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

/** Builds a Response-like object streaming the given SSE text. */
const sseResponse = (body: string) => ({
  ok: true,
  body: {
    getReader: () => {
      let sent = false;
      return {
        read: async () => {
          if (sent) return { done: true, value: undefined };
          sent = true;
          return { done: false, value: new TextEncoder().encode(body) };
        },
        cancel: async () => {},
      };
    },
  },
});

describe('saveAIDeck', () => {
  it('returns the saved deck', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deck: { _id: 'deck-1', deck_name: 'Krenko' } }),
    });
    const out = await saveAIDeck('gen-1', 'Krenko');
    expect(out.deck._id).toBe('deck-1');
  });

  it('raises GenerationExpiredError on 410', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 410, json: async () => ({}) });
    await expect(saveAIDeck('gen-1', 'Krenko')).rejects.toBeInstanceOf(GenerationExpiredError);
  });

  it('survives a non-JSON error body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError('not json'); },
    });
    await expect(saveAIDeck('gen-1', 'Krenko')).rejects.toThrow('Failed to save deck');
  });
});

describe('acceptRefinement', () => {
  it('posts the generation id with credentials', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await acceptRefinement('gen-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/deck/refine/accept'),
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('raises GenerationExpiredError on 410 so the caller can recover', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ error: 'generation expired, regenerate' }),
    });
    await expect(acceptRefinement('gen-1')).rejects.toBeInstanceOf(GenerationExpiredError);
  });

  it('surfaces the backend message on other failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'no pending changes to apply' }),
    });
    await expect(acceptRefinement('gen-1')).rejects.toThrow('no pending changes to apply');
  });
});

describe('refineDeck', () => {
  const diffEvent = 'event: result\ndata: ' + JSON.stringify({
    adds: [{ _id: 'a1', name: 'Chaos Warp', role: 'removal' }],
    cuts: [{ _id: 'c1', name: 'Weak Goblin', reason: 'low impact' }],
    summary: 'Added removal.',
  }) + '\n\n';

  it('targets a generation preview when given one', async () => {
    mockFetch.mockResolvedValue(sseResponse(diffEvent));
    const diff = await refineDeck({ generationId: 'gen-1' }, 'more removal');
    expect(diff.adds).toHaveLength(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      generation_id: 'gen-1',
      instruction: 'more removal',
    });
  });

  it('targets a saved deck when given a deck id', async () => {
    mockFetch.mockResolvedValue(sseResponse(diffEvent));
    await refineDeck({ deckId: 'deck-1' }, 'more removal');
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      deck_id: 'deck-1',
      instruction: 'more removal',
    });
  });

  it('skips heartbeat comments in the stream', async () => {
    mockFetch.mockResolvedValue(sseResponse(': ping\n\n' + diffEvent));
    const diff = await refineDeck({ generationId: 'gen-1' }, 'more removal');
    expect(diff.summary).toBe('Added removal.');
  });

  it('translates an expired preview into GenerationExpiredError', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ error: 'generation expired, regenerate' }),
    });
    await expect(refineDeck({ generationId: 'gen-1' }, 'x'))
      .rejects.toBeInstanceOf(GenerationExpiredError);
  });

  it('reports an SSE error event', async () => {
    mockFetch.mockResolvedValue(
      sseResponse('event: error\ndata: {"stage":"refining","message":"no valid change"}\n\n')
    );
    await expect(refineDeck({ generationId: 'gen-1' }, 'x')).rejects.toThrow('no valid change');
  });
});
