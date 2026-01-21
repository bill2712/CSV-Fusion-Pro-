import { GoogleGenAI, Type } from "@google/genai";
import { AISummary } from '../types';

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // In a real app we might handle this gracefully in UI
    console.warn("API_KEY is not defined.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy' });
};

export const summarizeCSV = async (csvHead: string): Promise<AISummary> => {
  try {
    const ai = getGeminiClient();
    
    // Using flash-preview for speed and efficiency on text tasks
    const modelId = 'gemini-2.0-flash-exp'; 

    const prompt = `
      Analyze the following CSV data snippet (first 20-50 rows). 
      Provide a concise 2-sentence summary of what this dataset appears to represent.
      Also extract up to 5 key topic keywords.
      
      CSV Snippet:
      ${csvHead}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
            },
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      summary: result.summary || "Unable to summarize.",
      keywords: result.keywords || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate summary.");
  }
};