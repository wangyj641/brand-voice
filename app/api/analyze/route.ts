// File: app/api/analyze/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

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
      "https://api-inference.huggingface.co/models/llama-2-7b-chat",
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
          Authorization: `Bearer ${process.env.OPENAI_API_TOKEN}`,
        },
      }
    );

    const raw = response.data.choices[0].message?.content?.trim() || "{}";

    // 去掉 Markdown 包裹的 ```json ``` 代码块
    const cleaned = raw
      .replace(/^```(json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    return cleaned;
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// 统一入口
export async function POST(req: Request) {
  try {
    const { text, provider = "huggingface" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    let result;
    if (provider === "openai") {
      result = await analyzeWithOpenAI(text);
    }

    console.log("------------------- Analysis result:", result);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze text" },
      { status: 500 }
    );
  }
}
