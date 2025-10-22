// File: app/api/analyze/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Real OpenAI-powered Brand Voice Analyzer API
 * Uses GPT model to analyze text tone, inclusivity, and readability.
 *
 * Requirements:
 * 1️⃣  install openai SDK:  npm install openai
 * 2️⃣  add your key in .env.local:
 *      OPENAI_API_KEY=sk-xxxxxx
 */

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { message: "Text input required" },
        { status: 400 }
      );
    }

    // 🧠 Step 1. 让 GPT 分析语气、一致性、包容性和可读性
    const prompt = `
You are an AI assistant that analyzes brand communication.
Please analyze the following content in following dimensions:
1. Tone Consistency (0-100)
2. Inclusivity (0-100)
3. Readability (0-100)
4. Provide improvement suggestions.
5. formality (0-100)
6. confidence (0-100)
7. positivity (0-100)

Return the result in strict JSON format:
{
  "sentiment": 
  {
    "label": "POSITIVE" or "NEUTRAL",
    "score": number,
  },
  "readability": number,
  "tone": {
    "formality": number,
    "confidence": number,
    "positivity": number
  },
 
  "inclusivity": 
	{
        "score": number,
        "issues": string[],
    },
  "improvedText": string
}

Text to analyze:
"""${text}"""
    `;

    //console.log("-------------- Prompt sent to OpenAI:", prompt);
    const response = await axios.post(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional brand communication analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    //console.log("---------- 1 ------------");
    //console.log(response.data);

    const raw = response.data.choices[0].message?.content?.trim() || "{}";

    console.log("---------- 3 ------------");
    console.log(raw);
    //const parsed = JSON.parse(raw);
    //return NextResponse.json(raw);
    return new Response(raw, { status: 200 });

    //return new Response(JSON.stringify(response.data), { status: 200 });
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
