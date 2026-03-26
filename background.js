// background.js — Nuance Service Worker

console.log("🧠 Nuance Service Worker initializing…");

try {
    importScripts('env.js');
    console.log("🔐 env.js loaded successfully.");
} catch (e) {
    console.error("❌ CRITICAL: Could not load env.js!", e);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        handleAnalysis(request.text, request.language || 'auto', sendResponse);
        return true; // Keep message channel open for async response
    }
});

async function handleAnalysis(text, language, sendResponse) {
    try {
        console.log(`🤖 Requesting analysis from Groq (language: ${language})…`);
        const result = await askGroq(text, language);
        console.log("✅ Analysis complete.");
        sendResponse({ success: true, ...result });
    } catch (error) {
        console.error("❌ Analysis error:", error.message);
        sendResponse({ success: false, error: error.message });
    }
}

async function askGroq(articleText, language = 'auto') {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    if (typeof ENV === 'undefined' || !ENV.GROQ_API_KEY) {
        throw new Error("API Key not found. Please check your env.js file.");
    }

    const cleanedText = articleText.substring(0, 3000);

    const langInstruction = language === 'auto'
        ? 'Respond in the same language as the article.'
        : `Respond in ${language}.`;

    const systemPrompt = `You are 'Nuance', a critical thinking assistant that helps readers escape information bubbles.

Analyze the article and return ONLY a valid JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "arguments": [
    "First counter-argument as a complete sentence.",
    "Second counter-argument as a complete sentence.",
    "Third counter-argument as a complete sentence."
  ],
  "sources": [
    { "name": "Publication Name", "url": "https://homepage-url.com" },
    { "name": "Publication Name 2", "url": "https://homepage-url2.com" }
  ]
}

Rules:
- Arguments must be short (1-2 sentences), logical, factual counter-points to the article's main thesis.
- Sources must be 2-3 credible, well-known publications highly relevant to the article's topic.
- Use only real publication homepages (Reuters, BBC, AP News, The Guardian, Le Monde, Público, El País, Der Spiegel, etc.).
- Do NOT invent URLs. Only use homepage URLs you are certain of.
- ${langInstruction}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Article:\n\n${cleanedText}` }
            ],
            temperature: 0.2,
            max_tokens: 700
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Groq API Error Detail:", errorBody);
        throw new Error(`Groq API Error ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    try {
        return JSON.parse(content);
    } catch {
        // Fallback: treat raw text as plain arguments (no sources)
        console.warn("⚠️ Could not parse JSON response. Using raw text fallback.");
        return { arguments: content, sources: [] };
    }
}