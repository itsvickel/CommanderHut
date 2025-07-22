import { Card } from '../types/cardTypes';
import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

// deckService.ts
import { Deck } from '../interfaces/deck';

interface SelectedCard {
  id: string;
  quantity?: number;
}

/**
 * Submits a new deck to the backend.
 *
 * @param {string} email_address - The user's email address.
 * @param {string} deck_name - The name of the deck to be created.
 * @param {DeckFormat} format - The deck format (e.g., "Commander", "Standard", etc.).
 * @param {SelectedCard[]} selectedCards - An array of selected cards, each containing a card ID and quantity.
 * @param {string} [commander] - Optional. The commander card name (required for Commander decks).
 * @param {string} [tags] - Optional. Comma-separated tags for categorizing the deck.
 * @param {boolean} [is_public=false] - Optional. Whether the deck should be publicly visible. Defaults to false.
 * @returns {Promise<any>} A promise that resolves to the backend response containing the created deck data or an error.
 */

export const postDeckList = async (payload: any) => {
  console.log(payload);
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),  // <-- Important: stringify full payload object
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error posting deck:', error);
    return null;
  }
};

/**
 * Submit a deck list to the backend. 
 * @returns {Promise<any>} - The response from the backend (e.g., confirmation message).
 */
export const fetchAllDecks = async (): Promise<any> => {
  try {
    const response = await axios.get(API_ENDPOINT.DECK_BASE_URL);

    if (!response || !response.data) {
      throw new Error("Failed to submit the deck list");
    }

    console.log("List of decks", response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting deck list:", error);
    throw error;
  }
};

/**
 * fetching decklist by username 
 * @returns {Promise<any>} - The response from the backend (e.g., confirmation message).
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
 * @returns {Promise<any>} - The response from the backend (e.g., confirmation message).
 */
export const fetchDeckListByID = async (id: number): Promise<any> => {
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
