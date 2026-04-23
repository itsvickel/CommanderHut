import axios from "axios";
import API_ENDPOINT from "../Constants/api";
import { ParsedDeck } from "../types/chat";

export const fetchMTGIdea = async (prompt: string): Promise<ParsedDeck> => {
  try {
    const response = await axios.post(
      API_ENDPOINT.AI_GENERATE,
      { prompt, format: 'Commander' },
      { withCredentials: true }
    );
    const data = response.data;
    if (!data.commander || !Array.isArray(data.cards)) {
      throw new Error('Unexpected response shape');
    }
    return {
      generationId: data.generation_id ?? '',
      commander: data.commander.name,
      commanderImageUri: data.commander.image_uris?.normal ?? data.commander.image_uris?.small ?? '',
      cards: data.cards,
      strategy: data.strategy ?? '',
    };
  } catch (error) {
    console.error("AI service error:", error);
    throw new Error("Failed to fetch AI response");
  }
};
