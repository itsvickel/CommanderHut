import { Card } from '../types/cardTypes';
import axios from 'axios';


// Base API URL (you can change this later based on your backend)
const API_URL = 'https://api.scryfall.com/cards';

/**
 * Fetches a card by its name or ID.
 * @param {string} query - The name or ID of the card.
 * @returns {Promise<Card>} - Returns the card data.
 */
export const fetchCardByQuery = async (query: string): Promise<Card> => {
  try {
    const response = await fetch(`${API_URL}/search?q=${query}`);
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
    const response = await fetch(`${API_URL}/${cardId}`);
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

const API_AI_URL = "https://api.together.xyz/v1/chat/completions"; // ✅ Corrected URL
const API_KEY = import.meta.env.VITE_TOGETHER_API_KEY; // Ensure this is set in your .env file

export const fetchCardsFromAI = async (query: string): Promise<string[]> => {
  try {
    const response = await axios.post(
      API_AI_URL,
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
      API_AI_URL,
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
