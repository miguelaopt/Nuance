// background.js — Nuance Service Worker

console.log("🧠 Nuance Service Worker initializing…");

// Cria o botão direito quando a extensão é instalada
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "nuance-analyze-selection",
        title: "Nuance: Verify this fact",
        contexts: ["selection"] // Só aparece se tiveres texto selecionado
    });
});

// Ouve quando clicas no botão direito
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "nuance-analyze-selection") {
        // Envia o texto sublinhado para o content.js da página atual
        chrome.tabs.sendMessage(tab.id, {
            action: "analyzeSelection",
            text: info.selectionText
        });
    }
});

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

    // REGRA DE IDIOMA BLINDADA (Acaba aqui a confusão)
    let langRule = "";
    if (language === 'auto' || language === 'Auto') {
        langRule = "Detect the primary language of the 'Article' provided below. You MUST write the 'arguments' and 'biasReason' in THAT exact detected language.";
    } else {
        langRule = `You MUST write the 'arguments' and 'biasReason' ENTIRELY in ${language}. DO NOT output any other language.`;
    }

    const systemPrompt = `You are 'Nuance', a professional fact-checker.
Analyze the article and return ONLY a valid JSON object. No markdown.

{
  "biasScore": 85,
  "biasReason": "Short explanation of the bias score.",
  "arguments": ["Arg 1", "Arg 2", "Arg 3"],
  "sources": [{ "name": "Source Name", "url": "https://url.com" }]
}

CRITICAL RULES:
1. BIAS METER: Evaluate the article's objectivity. 0 = Completely neutral/factual. 100 = Extremely biased/propaganda. Provide the integer score and a 1-sentence reason.
2. TRANSLATION: ${langRule}
3. SOURCE ORIGIN: The "sources" must match the culture/country of the ORIGINAL article.
4. JSON ONLY.`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Article:\n\n${cleanedText}` }
            ],
            temperature: 0.1 // Mantemos baixo para não haver alucinações
        })
    });

    if (!response.ok) throw new Error(`Groq API Error ${response.status}`);
    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    try { return JSON.parse(content); } 
    catch (e) { return { arguments: content, sources: [], biasScore: 50, biasReason: "Analysis failed." }; }
}