import { GoogleGenAI } from "@google/genai";
import { Aura } from "../types";

// Initialize Gemini
// Note: In a real production app, you might want to proxy this through a backend to protect the key,
// but for this frontend-only demo as per instructions, we use process.env.API_KEY.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateAuraLore = async (aura: Aura): Promise<string> => {
  if (!apiKey) {
    return "The stars are silent (API Key missing).";
  }

  try {
    const prompt = `
      You are the Oracle of a mystical RNG game. 
      Write a cryptic, powerful, and very short flavor text (lore) for an aura named "${aura.name}".
      
      Details:
      - Rarity Tier: ${aura.tier}
      - Chance: 1 in ${aura.chance.toLocaleString()}
      
      Requirements:
      - Max 25 words.
      - Make it sound epic, mysterious, or cosmic.
      - Do not include the name of the aura in the description, just describe its essence.
      - Return ONLY the text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Lore Error:", error);
    return "The void refuses to speak.";
  }
};