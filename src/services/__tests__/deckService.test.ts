import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { updateDeck, deleteDeck } from '../deckService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

beforeEach(() => vi.clearAllMocks());

describe('updateDeck', () => {
  it('sends PATCH request and returns updated deck', async () => {
    const mockDeck = { _id: 'abc123', deck_name: 'New Name' };
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: mockDeck });

    const result = await updateDeck('abc123', { deck_name: 'New Name' });

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('abc123'),
      { deck_name: 'New Name' }
    );
    expect(result).toEqual(mockDeck);
  });

  it('throws on non-2xx response', async () => {
    mockedAxios.patch = vi.fn().mockRejectedValue({ response: { status: 403 } });
    await expect(updateDeck('abc123', {})).rejects.toMatchObject({ response: { status: 403 } });
  });
});

describe('deleteDeck', () => {
  it('sends DELETE request', async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({ status: 204 });
    await deleteDeck('abc123');
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('abc123'));
  });

  it('throws on failure', async () => {
    mockedAxios.delete = vi.fn().mockRejectedValue({ response: { status: 404 } });
    await expect(deleteDeck('abc123')).rejects.toMatchObject({ response: { status: 404 } });
  });
});
