// background.js — Nuance Service Worker

console.log("🧠 Nuance Service Worker initializing…");

try {
    importScripts('env.js');
    console.log("🔐 env.js loaded successfully.");
} catch (e) {
    console.error("❌ CRITICAL: Could not load env.js!", e);
}

importScripts('ExtPay.js');
const extpay = ExtPay('nuance-6746');
extpay.startBackground();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        handleAsyncRequest(request.text, request.language || 'auto', request.mode || 'counter', sendResponse);
        return true; 
    }
});

async function handleAsyncRequest(text, language, mode, sendResponse) {
    try {
        console.log(`🤖 Requesting analysis (Lang: ${language}, Mode: ${mode})…`);
        const result = await askGroq(text, language, mode);
        sendResponse({ success: true, ...result });
    } catch (error) {
        console.error("❌ Analysis error:", error.message);
        sendResponse({ success: false, error: error.message });
    }
}

async function askGroq(articleText, language = 'auto', mode = 'counter') {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    if (typeof ENV === 'undefined' || !ENV.GROQ_API_KEY) throw new Error("API Key not found.");

    const cleanedText = articleText.substring(0, 3000);

    let langRule = language === 'auto' || language === 'Auto' 
        ? "Detect the primary language of the 'Article'. You MUST write the 'arguments' and 'biasReason' in THAT exact detected language."
        : `You MUST write the 'arguments' and 'biasReason' ENTIRELY in ${language}. DO NOT output any other language.`;

    // ─── A MAGIA DOS MODOS (LENSES) ───
    let modeInstruction = "Arguments must be 3 short, logical counter-points challenging the article's main thesis.";
    if (mode === 'fallacy') modeInstruction = "Identify 3 logical fallacies or manipulative rhetoric techniques used in the article. Name the fallacy and explain where it occurs.";
    if (mode === 'factcheck') modeInstruction = "Fact-check 3 specific, verifiable claims made in the article. State clearly if they are true, false, or misleading, and explain why.";

    const systemPrompt = `You are 'Nuance', a professional fact-checker.
Analyze the article and return ONLY a valid JSON object. No markdown.

{
  "biasScore": 85,
  "biasReason": "Short explanation of the bias score.",
  "arguments": ["Point 1", "Point 2", "Point 3"],
  "sources": [{ "name": "Source Name", "url": "https://url.com" }]
}

CRITICAL RULES:
1. FOCUS MODE: ${modeInstruction}
2. BIAS METER: Evaluate objectivity. 0 = Completely neutral. 100 = Extremely biased/propaganda.
3. TRANSLATION: ${langRule}
4. SOURCE ORIGIN: The "sources" must match the culture/country of the ORIGINAL article.
5. JSON ONLY.`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${ENV.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Article:\n\n${cleanedText}` }
            ],
            temperature: 0.1
        })
    });

    if (!response.ok) throw new Error(`Groq API Error ${response.status}`);
    let content = (await response.json()).choices[0].message.content.trim();
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    try { return JSON.parse(content); } 
    catch (e) { return { arguments: [content], sources: [], biasScore: 50, biasReason: "Analysis failed." }; }
}