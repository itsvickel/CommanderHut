import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

export interface DeckUpdatePayload {
  deck_name?: string;
  format?: string;
  commander?: string;
  commander_image?: string;
  tags?: string[];
  is_public?: boolean;
  deck_list?: Array<{ card: string; quantity: number }>;
}

export interface DeckCreatePayload {
  deck_name: string;
  format: 'Commander' | 'Standard' | 'Modern';
  commander?: string;
  commander_image?: string;
  deck_list: Array<{ card: string; quantity: number }>;
  tags?: string[];
  is_public?: boolean;
}

/** Creates a new deck via POST /api/decks (requires auth cookie). */
export const postDeckList = async (payload: DeckCreatePayload) => {
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      // Attach backend error details (and status) for the UI to consume
      const error = new Error(result.error || 'Failed to post deck');
      (error as any).details = result;
      (error as any).status = response.status;
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error posting deck:', error);
    throw error; // Let caller handle the error object
  }
};

/**
 * Submit a deck list to the backend. 
 * @returns {Promise<any>} - The response from the backend (e.g., confirmation message).
 */
export interface PublicDecksPage {
  decks: any[];
  total: number;
  page: number;
  pages: number;
}

/** Fetches the paginated list of public decks (no auth required). */
export const fetchPublicDecks = async (limit = 12): Promise<PublicDecksPage> => {
  try {
    const response = await axios.get(API_ENDPOINT.DECK_BASE_URL, { params: { limit } });
    return response.data as PublicDecksPage;
  } catch (error) {
    console.error('Error fetching public decks:', error);
    throw error;
  }
};

export const fetchDeckListByName = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_ENDPOINT.DECK_BY_USER}/${userId}`, { withCredentials: true });
    if (!response || !response.data) throw new Error('Failed to fetch user decklist');
    return response.data;
  } catch (error) {
    console.error('Error fetching user deck list:', error);
    throw error;
  }
};

export const fetchDeckListByID = async (id: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_ENDPOINT.DECK_BY_ID}${id}`);
    if (!response || !response.data) throw new Error('Failed to fetch deck');
    return response.data;
  } catch (error) {
    console.error('Error fetching deck by ID:', error);
    throw error;
  }
};

export const updateDeck = async (
  id: string,
  payload: { name?: string; cards?: { name: string; quantity: number }[] }
): Promise<any> => {
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Failed to update deck');
      (error as any).details = result;
      throw error;
    }
    return result;
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

export const deleteDeck = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete deck');
    }
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};
