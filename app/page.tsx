"use client";

/*
Brand Voice Analyzer - Next.js + React single-file dashboard page
File name suggestion: pages/dashboard.tsx

What this file contains:
- A full React/Next.js page component implementing the Dashboard UI
  (Sidebar, Input card, Result cards, Analysis details, AI rewrite area)
- Mock API integration with /api/analyze (falls back to mocked data when API unavailable)
- Uses Tailwind CSS utility classes for styling
- Uses Recharts for charts (Pie & Radar). If you prefer Chart.js, swap accordingly.

Dependencies (install in your Next.js project):
  npm install axios recharts

Tailwind setup:
  This code assumes Tailwind CSS is already configured for your Next.js app.
  Follow https://tailwindcss.com/docs/guides/nextjs if not configured.

How to use:
  1. Put this file at `pages/dashboard.tsx` in a Next.js app (TypeScript optional). Rename extension to .tsx.
  2. Ensure Tailwind is configured and `npm run dev` runs the Next app.
  3. Optional: implement backend POST /api/analyze to accept { text } and return the shape used in `callAnalyzeAPI`.

Expected /api/analyze response shape (example):
{
  sentiment: { label: 'POSITIVE', score: 0.95 },
  readability: 62.3,
  tone: { formality: 0.7, confidence: 0.6, positivity: 0.8 },
  inclusivity: { score: 0.78, issues: [{index:5, text:'guys', suggestion:'team'}] },
  improved_text: '...'
}

Notes:
- The component is intentionally self-contained to serve as a developer-friendly starting point.
- For production, split into smaller components, add auth, rate limiting, and server-side model calls.
*/

import React, { useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

// Recharts is client-side only; dynamic import to avoid SSR issues
const Recharts = dynamic(() => import("recharts"), { ssr: false });

// Because dynamic import returns the module, we still import chart components inside a small wrapper
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

//const SAMPLE_TEXT = `We are thrilled to announce our latest product update! Our team worked incredibly hard and we're super excited to share it with you. Thanks to all our supporters.`;

const SAMPLE_TEXT = `https://www.timhortons.ca/tims-for-good`;

const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD"];

export default function Dashboard() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [formality, setFormality] = useState(0);

  async function callAnalyzeAPI(inputText: string) {
    //const provider = "huggingface"; // or "openai", could be made selectable
    const provider = "openai"; // or "openai", could be made selectable

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          provider: provider, // 可选: openai / huggingface
        }),
      });


      const json = await resp.json();
      const data = json.data; // ✅ 现在一定是对象，不是字符串

      console.log("API response data:", data);

      console.log("Improved Text:", data?.chineseText);
//console.log("Formality:", data?.tone?.formality);


      return data;
    } catch (e) {
      // Fallback: return mocked analysis so the UI still works without backend
      console.warn("Analyze API failed — using mock data", e);
      await new Promise((r) => setTimeout(r, 600));
      return mockAnalysis(inputText);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please paste text or a URL to analyze.");
      return;
    }
    setError(null);
    const data = await callAnalyzeAPI(trimmed);
    //console.log("------------- Final analysis result:", data);
    //console.log("------------- Formality score:", data.readability);
    //console.log(data.readability);
    setResult(data);
    //setFormality(data.tone.formality);
    //console.log("------------- Result set in state:", formality);

  }

  function mockAnalysis(inputText: string) {
    console.log("------------- Mock analyzing text:", inputText);
    // Naive mock scoring based on length and presence of certain words
    const positivity = /thank|thanks|excited|thrill|great/i.test(inputText)
      ? 0.8
      : 0.45;
    const formality = /we are|our team|announce/i.test(inputText) ? 0.7 : 0.4;
    const confidence = /will|guarantee|definitely/i.test(inputText)
      ? 0.75
      : 0.55;
    const inclusivityIssues = [];
    if (/guys|ladies|manpower/i.test(inputText)) {
      inclusivityIssues.push({ index: 0, text: "guys", suggestion: "team" });
    }
    const readability = Math.max(30, 90 - inputText.split(" ").length / 2);

    return {
      sentiment: {
        label: positivity > 0.6 ? "POSITIVE" : "NEUTRAL",
        score: positivity,
      },
      readability,
      tone: { formality, confidence, positivity },
      inclusivity: {
        score: 1 - inclusivityIssues.length * 0.2,
        issues: inclusivityIssues,
      },
      improved_text: `Improved (mock): ${inputText.replace(/guys/gi, "team")}`,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-60 bg-white rounded-2xl shadow p-4 flex flex-col gap-4">
            <div className="text-2xl font-semibold text-indigo-700">
              Brand Voice AI
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              <a className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Dashboard
              </a>
              <a className="px-3 py-2 rounded-md hover:bg-slate-100">History</a>
              <a className="px-3 py-2 rounded-md hover:bg-slate-100">
                Brand Voice
              </a>
              <a className="px-3 py-2 rounded-md hover:bg-slate-100">
                Settings
              </a>
            </nav>
            <div className="mt-auto text-sm text-slate-500">
              Logged in as{" "}
              <span className="font-medium text-slate-700">Wang</span>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Top input card */}
            <section className="bg-white rounded-2xl shadow p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="text-input"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Paste text or URL to analyze
                  </label>
                  <textarea
                    id="text-input"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    aria-label="Paste text or URL"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleAnalyze}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700"
                      aria-disabled={loading}
                    >
                      {loading ? "Analyzing..." : "Analyze"}
                    </button>
                    <button
                      onClick={() => setText(SAMPLE_TEXT)}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Use sample text
                    </button>
                    <button
                      onClick={() => {
                        setText("");
                        setResult(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50"
                    >
                      Clear
                    </button>
                  </div>
                  {error && <p className="mt-3 text-rose-600">{error}</p>}
                </div>

                <div className="w-72">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm text-indigo-700 font-semibold">
                      Quick Tips
                    </div>
                    <ul className="mt-2 text-sm text-slate-600 list-disc pl-4">
                      <li>
                        Keep posts under 150 words for higher readability.
                      </li>
                      <li>
                        Prefer gender-neutral terms (e.g., team instead of
                        guys).
                      </li>
                      <li>Use active voice to increase clarity.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Result summary cards */}
            <section className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="text-sm font-medium text-slate-600">
                  Tone Consistency
                </h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height={110}>
                      <PieChart>
                        <Pie
                          data={
                            result
                              ? [
                                  {
                                    name: "Formality",
                                    value: Math.round(
                                      (result.tone?.formality || 0) * 100
                                    ),
                                  },
                                  {
                                    name: "Positivity",
                                    value: Math.round(
                                      (result.tone?.positivity || 0) * 100
                                    ),
                                  },
                                  {
                                    name: "Confidence",
                                    value: Math.round(
                                      (result.tone?.confidence || 0) * 100
                                    ),
                                  },
                                ]
                              : [{ name: "none", value: 100 }]
                          }
                          dataKey="value"
                          innerRadius={28}
                          outerRadius={45}
                          paddingAngle={2}
                        >
                          {(result ? [0, 1, 2] : [0]).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">
                      {result
                        ? `${Math.round(
                            (((result?.tone?.formality || 0) +
                              (result?.tone?.positivity || 0) +
                              (result?.tone?.confidence || 0)) /
                              3) 
              
                          )}`
                        : "--"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Brand alignment score
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="text-sm font-medium text-slate-600">
                  Inclusivity
                </h3>
                <div className="mt-4">
                  <div className="text-3xl font-semibold">
                    {result
                      ? `${Math.round((result?.inclusivity?.score || 0))}`
                      : "--"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Inclusivity score
                  </div>
                  <div className="mt-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full">
                      <div
                        style={{
                          width: result
                            ? `${Math.round(
                                (result?.inclusivity?.score || 0) 
                              )}%`
                            : "0%",
                        }}
                        className="h-3 rounded-full bg-green-400"
                      />
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      {result &&
                      result.inclusivity?.issues &&
                      result.inclusivity?.issues?.length > 0
                        ? `${result?.inclusivity?.issues?.length} issue(s) found`
                        : "No major issues found"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="text-sm font-medium text-slate-600">
                  Readability
                </h3>
                <div className="mt-4">
                  <div className="text-3xl font-semibold">
                    {result ? `${Math.round(result.readability)}` : "--"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Flesch Reading Ease
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    {result
                      ? result.readability > 60
                        ? "Easy to read"
                        : result.readability > 40
                        ? "Moderate"
                        : "Difficult"
                      : "—"}
                  </div>
                </div>
              </div>
            </section>

            {/* Details and AI rewrite */}
            <section className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-2xl shadow p-5">
                <h3 className="text-lg font-medium">Original Text</h3>
                <div className="mt-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {result?.originalText }
                  </pre>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium">Detected issues</h4>
                  <div className="mt-2 text-sm text-slate-600">
                    {
                    result?.inclusivity?.issues?.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {result.inclusivity.issues.map((it, idx) => (
                          <li key={idx}>
                            {it.text} — suggestion:{" "}
                            <span className="font-medium">{it.suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No inclusivity issues detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="text-lg font-medium">AI Rewrite</h3>
                <div className="mt-3">
                  <textarea
                    readOnly
                    value={result ? result.improvedText : ""}
                    rows={8}
                    className="w-full rounded-lg border border-slate-200 p-3 bg-slate-50"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        result ? result.improvedText : ""
                      )
                    }
                    className="px-3 py-2 rounded-lg border bg-white"
                  >
                    Copy
                  </button>
                  <a
                    href={
                      result
                        ? `data:text/plain;charset=utf-8,${encodeURIComponent(
                            result.improved_text
                          )}`
                        : "#"
                    }
                    download="improved_text.txt"
                    className="px-3 py-2 rounded-lg border bg-white"
                  >
                    Download
                  </a>
                </div>
              </div>
            </section>

            {/* Tone Radar */}
            <section className="mt-6 bg-white rounded-2xl shadow p-5">
              <h3 className="text-lg font-medium">Tone Breakdown</h3>
              <div className="mt-4 w-full" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    data={
                      result
                        ? [
                            {
                              subject: "Formality",
                              A: Math.round((result?.tone?.formality || 0) * 100),
                            },
                            {
                              subject: "Positivity",
                              A: Math.round(
                                (result?.tone?.positivity || 0) * 100
                              ),
                            },
                            {
                              subject: "Confidence",
                              A: Math.round(
                                (result?.tone?.confidence || 0) * 100
                              ),
                            },
                          ]
                        : [{ subject: "No data", A: 0 }]
                    }
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#3B82F6"
                      fill="#60A5FA"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
