import { updateDeck, deleteDeck } from '../deckService';

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('updateDeck', () => {
  it('sends PATCH request with credentials and returns updated deck', async () => {
    const mockDeck = { _id: 'abc123', deck_name: 'New Name' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDeck,
    });

    const result = await updateDeck('abc123', { name: 'New Name' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('abc123'),
      expect.objectContaining({ method: 'PATCH', credentials: 'include' })
    );
    expect(result).toEqual(mockDeck);
  });

  it('throws with backend error message on non-2xx response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Forbidden' }),
    });
    await expect(updateDeck('abc123', {})).rejects.toThrow('Forbidden');
  });
});

describe('deleteDeck', () => {
  it('sends DELETE request with credentials', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await deleteDeck('abc123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('abc123'),
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    );
  });

  it('throws on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Deck not found' }),
    });
    await expect(deleteDeck('abc123')).rejects.toThrow('Deck not found');
  });
});
