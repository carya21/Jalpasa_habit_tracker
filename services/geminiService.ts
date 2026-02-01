import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VerificationResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const verificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    distance: {
      type: Type.NUMBER,
      description: "The total distance extracted from the image in kilometers. Return 0 if not found.",
    },
    durationInMinutes: {
      type: Type.NUMBER,
      description: "The total duration of the workout in minutes. Convert hours/seconds to minutes. (e.g., 1h 30m -> 90, 45:00 -> 45). Return 0 if not found.",
    },
    reasoning: {
      type: Type.STRING,
      description: "Short explanation of the extracted values.",
    },
  },
  required: ["distance", "durationInMinutes", "reasoning"],
};

export const verifyWorkoutImage = async (base64Image: string): Promise<VerificationResult> => {
  try {
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Analyze this workout record. Extract:
            1. Distance (convert miles to km if needed).
            2. Duration (Time elapsed) in minutes.
            
            Return raw numbers. Do not validate logic.
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: verificationSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleanText) as VerificationResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      distance: 0,
      durationInMinutes: 0,
      reasoning: "이미지 분석에 실패했습니다.",
    };
  }
};
