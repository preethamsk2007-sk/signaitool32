
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export class GeminiService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-3-flash-preview';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async translateSign(base64Image: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: `Identify the ASL sign. 
              Output: ONE word/label only.
              If unclear: "NO_SIGN_DETECTED".
              Be extremely concise. No punctuation.`,
            },
          ],
        },
        config: {
          temperature: 0.0,
          topP: 0.1,
        },
      });

      const text = response.text || '';
      return text.trim();
    } catch (error) {
      console.error("Gemini translation error:", error);
      throw new Error("API busy or network slow.");
    }
  }

  async polishSentence(rawWords: string): Promise<string> {
    try {
      if (!rawWords.trim()) return "";
      
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.modelName,
        contents: `The following is a list of words captured via sign language recognition: "${rawWords}". 
        Construct a single, grammatically correct and natural English sentence using these words. 
        Only output the sentence. No extra text.`,
        config: {
          temperature: 0.7,
        },
      });

      return (response.text || rawWords).trim();
    } catch (error) {
      console.error("Sentence polishing error:", error);
      return rawWords;
    }
  }
}

export const geminiService = new GeminiService();
