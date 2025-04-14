import { Card } from '../types/cardTypes';
import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

 
/**
 * Fetches a card by its name or ID.
 * @param {string} query - The name or ID of the card.
 * @returns {Promise<Card>} - Returns the card data.
 */
export const fetchCardByQuery = async (query: string): Promise<Card> => {
  try {
    const response = await fetch(`${API_ENDPOINT.SCRYFALL}/search?q=${query}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch card with query: ${query}`);
    }
    const data = await response.json();
    return data.data[0]; // Assuming we're returning the first card from the search
  } catch (error) {
    console.error('Error fetching card:', error);
    throw error;
  }
};

/**
 * Fetches card details by its specific ID.
 * @param {string} cardId - The ID of the card.
 * @returns {Promise<Card>} - Returns the card data.
 */
export const fetchCardById = async (cardId: string): Promise<Card> => {
  try {
    const response = await fetch(`${API_ENDPOINT.SCRYFALL}/${cardId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch card with ID: ${cardId}`);
    }
    const card = await response.json();
    return card;
  } catch (error) {
    console.error('Error fetching card by ID:', error);
    throw error;
  }
};

/**
 * Fetches a card by its name 
 * @param {string} query - The name the card.
 * @returns {Promise<Card>} - Returns the card data.
 */
export const fetchCardByName = async (query: string): Promise<Card> => {
  try {
    const response = await fetch(`${API_ENDPOINT.CARD_QUERY}${query}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch card with query: ${query}`);
    }
    const data = await response.json();
    console.log(data);
    return data; // Assuming we're returning the first card from the search
  } catch (error) {
    console.error('Error fetching card:', error);
    throw error;
  }
};


const API_KEY = import.meta.env.VITE_TOGETHER_API_KEY; // Ensure this is set in your .env file

export const fetchCardsFromAI = async (query: string): Promise<string[]> => {
  try {
    const response = await axios.post(
      API_ENDPOINT.AI_TOGETHER_BASE,
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", // ✅ Make sure this model is available
        messages: [
          { role: "system", content: "You are a Magic: The Gathering assistant that generates card lists based on user queries." },
          { role: "user", content: `Generate a list of Magic: The Gathering cards for: "${query}". Only return the card names, separated by commas.` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content
      .trim()
      .split(",")
      .map((card: string) => card.trim());

  } catch (error) {
    console.error("Error fetching cards from AI:", error.response?.data || error);
    return [];
  }
};

export const fetchDecklistFromAI = async (query: string): Promise<string[]> => {
  try {
    const response = await axios.post(
      API_ENDPOINT.AI_TOGETHER_BASE,
      {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", // ✅ Make sure this model is available
        messages: [
          { role: "system", content: "You are a Magic: The Gathering assistant that generates card lists based on user queries." },
          { role: "user", content: `Generate a list of Magic: The Gathering cards for a deck: "${query}". Only return the card names, separated by commas.` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content
      .trim()
      .split(",")
      .map((card: string) => card.trim());

  } catch (error) {
    console.error("Error fetching cards from AI:", error.response?.data || error);
    return [];
  }
};
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
