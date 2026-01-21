import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIGreeting = async (username: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a very short, professional, and welcoming one-sentence greeting for a user named ${username} who is logging into an enterprise portal. Keep it under 15 words.`,
      config: {
        temperature: 0.7,
      }
    });
    // The .text property is a getter that returns string | undefined
    return response.text || `Welcome back, ${username}! Ready to manage your modules?`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Welcome back, ${username}! Have a productive day.`;
  }
};