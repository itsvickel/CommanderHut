import axios from "axios";
import API_ENDPOINT from "../Constants/api";

export const fetchMTGIdea = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(
      API_ENDPOINT.AI_DEEPSEEK_BASE,
      { prompt },
      { withCredentials: true }
    );
    return response.data.result;
  } catch (error) {
    console.error("AI service error:", error);
    throw new Error("Failed to fetch AI response");
  }
};
