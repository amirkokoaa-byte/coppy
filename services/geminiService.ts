
import { GoogleGenAI, Type } from "@google/genai";
import { AIModelType } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeContent = async (content: string, model: AIModelType = 'gemini-3-flash-preview') => {
  const ai = getAI();
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        isSafe: { type: Type.BOOLEAN },
        suggestion: { type: Type.STRING },
      },
      required: ["type", "suggestion"]
    }
  };

  // If using Pro, we can enable thinking for better analysis
  if (model === 'gemini-3-pro-preview') {
    config.thinkingConfig = { thinkingBudget: 2000 };
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: `Analyze the following content and identify if it is a safe link, an email, a phone number, or plain text. 
    If it is a link, evaluate its potential safety based on patterns.
    Content: "${content}"
    Return JSON format with properties: type (link, email, phone, text), isSafe (boolean, for links), suggestion (string in Arabic with professional advice).`,
    config
  });

  return JSON.parse(response.text);
};

export const translateText = async (text: string, model: AIModelType = 'gemini-3-flash-preview', targetLang: string = 'Arabic') => {
  const ai = getAI();
  const config: any = {};
  
  if (model === 'gemini-3-pro-preview') {
    config.thinkingConfig = { thinkingBudget: 1000 };
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: `Translate the following text to ${targetLang} accurately, maintaining the tone: "${text}"`,
    config
  });
  return response.text;
};

export const extractTextFromImage = async (base64Image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: 'Extract all text from this image accurately. Return only the extracted text.' }
      ]
    }
  });
  
  let extracted = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.text) extracted += part.text;
  }
  return extracted;
};
