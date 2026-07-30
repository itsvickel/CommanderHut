import { Card } from '../types/cardTypes';
import API_ENDPOINT from "../Constants/api";

/**
 * Fetches a random list of card details.
 * @param {number} limit - The number of random cards to fetch.
 * @returns {Promise<Card[]>} - Returns an array of card data.
 */
export const fetchListOfRandomCards = async (limit: number): Promise<Card[]> => {
  try {
    const response = await fetch(`${API_ENDPOINT.RANDOM_CARD_LIST}?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch random list of cards");
    }

    const cards = await response.json();
    return cards;
  } catch (error) {
    console.error("Error fetching random list of cards:", error);
    throw error;
  }
};

/**
 * Fetches a list of cards matching the fuzzy name.
 * @param {string} name - The search query.
 * @returns {Promise<Card[]>} - An array of card results.
 */
export const fetchCardByName = async (name: string): Promise<Card[]> => {
  try {
    const response = await fetch(API_ENDPOINT.CARD_QUERY_BY_NAME + encodeURIComponent(name));
    if (!response.ok) {
      throw new Error("Failed to fetch the cards");
    }

    const cards = await response.json();
    return cards;
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw error;
  }
};
