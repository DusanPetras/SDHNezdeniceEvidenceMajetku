import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAssetDescription = async (name: string, category: string): Promise<string> => {
  if (!process.env.API_KEY) return "API klíč nenalezen. Nemohu vygenerovat popis.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Jsi zkušený hasičský technik SDH Nezdenice. Napiš stručný, profesionální technický popis (max 2 věty) pro majetek: "${name}" v kategorii "${category}". Zaměř se na účel použití.`,
    });
    return (response.text || "").trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Nepodařilo se vygenerovat popis.";
  }
};

export const generateMaintenanceAdvice = async (asset: Asset): Promise<string> => {
  if (!process.env.API_KEY) return "<li>API klíč nenalezen.</li>";

  try {
    const prompt = `
      Jako technický správce sboru dobrovolných hasičů, navrhni stručný plán údržby (bodově) pro tento majetek:
      Název: ${asset.name}
      Kategorie: ${asset.category}
      Stáří: Pořízeno ${asset.purchaseDate}
      Stav: ${asset.condition}
      
      Výstup formátuj jako jednoduchý seznam HTML (pouze <li> elementy).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "<li>Nepodařilo se načíst doporučení údržby.</li>";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "<li>Nepodařilo se načíst doporučení údržby.</li>";
  }
};