// File: app/api/analyze/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function analyzeWithOpenAI(text: string) {
  try {
    //const { text } = await req.json();

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

    const raw = response.data.choices[0].message?.content?.trim() || "{}";
    console.log("---------- 3 ------------");
    console.log(raw);
    return raw;
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";

async function analyzeWithHuggingFace(text: string) {
  const response = await fetch(HUGGINGFACE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("HuggingFace response:", result);
  return result;
}

// 调用 OpenAI
async function analyzeWithOpenAI2(text: string) {
  console.log("------------------- Calling openai model");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a brand tone analysis expert." },
        {
          role: "user",
          content: `
Analyze the following text for tone, inclusivity, and readability.
Return a JSON like:
{
  "scores": {"toneConsistency": number, "inclusivity": number, "readability": number},
  "summaries": {"toneSummary": string, "inclusivityFeedback": string, "readabilityAdvice": string},
  "improvedText": string
}

Text:
"""${text}"""
        `,
        },
      ],
      temperature: 0.4,
    }),
  });

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

// 统一入口
export async function POST(req: Request) {
  try {
    const { text, provider = "huggingface" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    //console.log("------------------- Received text for analysis:", text);

    let result;
    if (provider === "openai") {
      result = await analyzeWithOpenAI(text);
    } else {
      result = await analyzeWithHuggingFace(text);
    }

    console.log("------------------- Analysis result:", result);

    //return NextResponse.json(result);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze text" },
      { status: 500 }
    );
  }
}
