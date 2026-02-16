
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
              text: `Analyze the hand posture in this image. 
              1. Observe the finger positions (extended, folded, or touching).
              2. Note the palm orientation and hand shape.
              3. Identify the most likely American Sign Language (ASL) letter or common word.
              
              Output ONLY the word or letter identified. 
              If the hand is not clearly performing a sign, output "NO_SIGN_DETECTED".`,
            },
          ],
        },
        config: {
          systemInstruction: "You are an expert ASL (American Sign Language) interpreter. You specialize in identifying static hand signs from video frames with high precision. You analyze hand geometry, finger occlusion, and orientation to provide the most accurate translation.",
          temperature: 0.1,
          topP: 0.8,
          // Adding thinking budget to allow the model to reason about the hand shape before deciding on the label
          thinkingConfig: { thinkingBudget: 1024 }
        },
      });

      const text = response.text || '';
      // Sanitize output to get just the word/letter
      const result = text.trim().split(/\s+/)[0].replace(/[^a-zA-Z_]/g, '');
      return result || 'NO_SIGN_DETECTED';
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
