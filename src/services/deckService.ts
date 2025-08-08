import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

// deckService.ts
import type { Deck } from '../Interface/deck';

/**
 * Submits a new deck to the backend.
 */
export const postDeckList = async (deck: Deck): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINT.DECK_BASE_URL, deck);

    if (!response) {
      throw new Error('Failed to create deck');
    }

    return response;
  } catch (error) {
    console.error('Error posting deck list:', error);
    throw error;
  }
};

/**
 * Fetch all decks
 */
export const fetchAllDecks = async (): Promise<any> => {
  try {
    const response = await axios.get(API_ENDPOINT.DECK_BASE_URL);

    if (!response || !response.data) {
      throw new Error("Failed to submit the deck list");
    }

    return response.data;
  } catch (error) {
    console.error("Error submitting deck list:", error);
    throw error;
  }
};

/**
 * fetching decklist by username 
 */
export const fetchDeckListByName = async (): Promise<any> => {
  try {
    const response = await axios.get(API_ENDPOINT.DECK_BY_USER);

    if (!response || !response.data) {
      throw new Error("Failed fetch user decklist");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching deck list:", error);
    throw error;
  }
};

/**
 * fetching deck list by ID
 */
export const fetchDeckListByID= async (id : number | string): Promise<any> => {
  try {
    const response = await axios.get(API_ENDPOINT.DECK_BY_ID + id);

    if (!response || !response.data) {
      throw new Error("Failed fetch user decklist");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching deck list:", error);
    throw error;
  }
};
