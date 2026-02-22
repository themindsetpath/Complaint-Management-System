
import { GoogleGenAI } from "@google/genai";

export const analyzeComplaint = async (title: string, description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze the following student complaint and provide a short 1-sentence summary of the main grievance and the likely urgency (Low, Medium, High). 
    Title: ${title}
    Description: ${description}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not perform smart analysis.";
  }
};
