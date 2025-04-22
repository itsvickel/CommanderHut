import { Card } from '../types/cardTypes';
import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

import DeckFormat from '../Constants/constant';

interface SelectedCard {
  id: string;
  quantity?: number;
}

/**
 * Submit a deck list to the backend.
 * @param {string} email_address - User's email.
 * @param {string} deck_name - Name of the deck.
 * @param {DeckFormat} format - The format of the deck (e.g., Commander, Standard).
 * @param {SelectedCard[]} selectedCards - Array of selected card objects in the deck, each containing card ID and optional quantity.
 * @param {string} [commander] - The commander card for Commander format, optional.
 * @param {string} [tags] - Tags for the deck, optional (comma-separated).
 * @param {boolean} [is_public=false] - Whether the deck is public or private, optional (defaults to false).
 * @returns {Promise<any>} - The response from the backend, which includes a confirmation message and the created deck information.
 */
export const postDeckList = async (
  email_address: string,
  deck_name: string,
  format: DeckFormat,
  selectedCards: SelectedCard[],
  commander?: string,  // Optional, needed for Commander decks
  tags?: string,       // Optional tags for the deck
  is_public: boolean = false  // Optional, defaults to false
): Promise<any> => {
  
  const requestBody: any = {
    email_address,
    deck_name,
    format,
    commander,
    tags,
    is_public,
    cards: selectedCards,
  };

  try {
    const response =  await axios.post(API_ENDPOINT.DECK_BASE_URL, requestBody);

    if (!response) {
      throw new Error('Failed to create deck');
    }

    return response;
  } catch (error) {
    console.error('Error posting deck list:', error);
    throw error; // You can handle errors more gracefully based on your needs
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
