
import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly when initializing the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSystemInsights = async (systemSummary: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this tank monitoring system status: ${systemSummary}. 
      Provide a concise (3-4 bullet points) summary of system health, refill recommendations, and any critical anomalies. 
      Format as markdown. Be professional.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // The text property directly returns the string output. Do not call as a method.
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Insight service currently unavailable.";
  }
};
