// background.js — Nuance Service Worker v1.4

console.log("🧠 Nuance Service Worker initializing…");

try {
    importScripts('env.js');
} catch (e) {
    console.error("❌ CRITICAL: Could not load env.js!", e);
}

try {
    importScripts('ExtPay.js');
    const extpay = ExtPay('nuance-6746');
    extpay.startBackground();
} catch (e) {
    console.error("❌ ExtPay failed to load:", e);
}

// ─── FEATURE D: Restore badge on tab focus / navigation ─────────────────────

chrome.tabs.onActivated.addListener(({ tabId }) => restoreBadgeForTab(tabId, null));

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        restoreBadgeForTab(tabId, tab.url);
    }
});

function restoreBadgeForTab(tabId, url) {
    const go = (tabUrl) => {
        if (!tabUrl || tabUrl.startsWith('chrome://') || tabUrl.startsWith('about:')) return;
        try {
            const hostname = new URL(tabUrl).hostname;
            const cacheKey = `nuanceBias_${hostname}`;
            chrome.storage.local.get([cacheKey], result => {
                const cached = result[cacheKey];
                if (cached?.biasScore !== undefined) {
                    applyBadge(tabId, cached.biasScore);
                } else {
                    chrome.action.setBadgeText({ text: '', tabId });
                }
            });
        } catch (_) {}
    };

    if (url) {
        go(url);
    } else {
        chrome.tabs.get(tabId, tab => {
            if (chrome.runtime.lastError) return;
            go(tab?.url);
        });
    }
}

function applyBadge(tabId, biasScore) {
    let color = '#34c759';
    if (biasScore > 40) color = '#ffcc00';
    if (biasScore > 75) color = '#ff3b30';
    try {
        chrome.action.setBadgeText({ text: String(biasScore), tabId });
        chrome.action.setBadgeBackgroundColor({ color, tabId });
    } catch (_) {}
}

// ─── Message Router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender?.tab?.id;

    if (request.action === "quickClickbaitCheck") {
        handleQuickCheck(request.titleText, request.language || 'auto', sendResponse);
        return true;
    }

    if (request.action === "analyzeText") {
        handleFullAnalysis(request.text, request.language || 'auto', request.mode || 'counter', tabId, request.url, sendResponse);
        return true;
    }
});

// ─── FEATURE A: Quick clickbait pre-check (fast parallel call) ──────────────

async function handleQuickCheck(titleText, language, sendResponse) {
    if (!titleText || titleText.trim().length < 10) {
        sendResponse({ clickbait: false, reason: '' });
        return;
    }

    try {
        const langRule = (language === 'auto' || language === 'Auto')
            ? 'Respond in the same language as the headline.'
            : `Respond in ${language}.`;

        const data = await groqFetch([
            {
                role: "system",
                content: `You detect clickbait headlines. Reply ONLY with valid JSON: {"clickbait":true,"reason":"Short reason."} or {"clickbait":false,"reason":""}. ${langRule} No markdown. JSON only.`
            },
            { role: "user", content: `Headline: "${titleText.substring(0, 200)}"` }
        ], { model: "llama-3.1-8b-instant", max_tokens: 80, temperature: 0.0, json: false });

        const raw = data.choices[0].message.content.trim()
            .replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        sendResponse(JSON.parse(raw));
    } catch (e) {
        console.warn("Quick check failed:", e.message);
        sendResponse({ clickbait: false, reason: '' });
    }
}

// ─── Full Analysis ────────────────────────────────────────────────────────────

async function handleFullAnalysis(text, language, mode, tabId, pageUrl, sendResponse) {
    try {
        const result = await askGroq(text, language, mode);

        if (result.biasScore !== undefined && tabId) {
            applyBadge(tabId, result.biasScore);

            if (pageUrl) {
                try {
                    const hostname = new URL(pageUrl).hostname;
                    chrome.storage.local.set({ [`nuanceBias_${hostname}`]: { biasScore: result.biasScore, ts: Date.now() } });
                } catch (_) {}
            }
        }

        sendResponse({ success: true, ...result });
    } catch (error) {
        console.error("❌ Analysis error:", error.message);
        sendResponse({ success: false, error: humanizeError(error.message) });
    }
}

// ─── Groq API ─────────────────────────────────────────────────────────────────

async function groqFetch(messages, opts = {}) {
    if (typeof ENV === 'undefined' || !ENV.GROQ_API_KEY) {
        throw new Error("API Key not configured. Please check your env.js file.");
    }

    const body = {
        model: opts.model || "llama-3.3-70b-versatile",
        messages,
        temperature: opts.temperature ?? 0.1,
        max_tokens: opts.max_tokens || 800
    };
    if (opts.json !== false) body.response_format = { type: "json_object" };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${ENV.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        let msg = `Groq Error ${res.status}`;
        try { const e = await res.json(); msg = e?.error?.message || msg; } catch (_) {}
        throw new Error(msg);
    }
    return res.json();
}

async function askGroq(articleText, language = 'auto', mode = 'counter') {
    const cleaned = articleText.substring(0, 3000);

    const langRule = (language === 'auto' || language === 'Auto')
        ? "Detect the article language and respond in it."
        : `Write ALL text fields ENTIRELY in ${language}.`;

    const modeMap = {
        counter:   "3 short, logical counter-points to the article's main thesis",
        fallacy:   "3 logical fallacies present in the article's argumentation",
        factcheck: "3 specific verifiable claims and label each: Verified, Disputed, or Unverified"
    };
    const modeInstruction = modeMap[mode] || modeMap.counter;

    const systemPrompt = `You are 'Nuance', a professional fact-checker.
Return ONLY a valid JSON object. No markdown, no backticks, no extra text.

{
  "clickbait": false,
  "clickbaitReason": "One sentence. Blank string if not clickbait.",
  "biasScore": 0,
  "biasReason": "One sentence. 0=neutral, 100=extreme bias.",
  "arguments": ["Arg 1.", "Arg 2.", "Arg 3."],
  "sources": [{ "name": "Pub Name", "url": "https://homepage.com" }]
}

BIAS CALIBRATION (apply strictly — do NOT default to low scores):
0-15  = Dry factual / scientific / official data. No framing.
16-35 = Mostly factual. Wire-service style.
36-55 = Noticeable editorial slant. Emotional language.
56-75 = Clear ideological framing. Selective facts. Charged language.
76-90 = Strong propaganda markers. "Us vs them." Socially divisive topics (gender identity, immigration, race, abortion, religion, nationalism) presented with heavily one-sided framing. Headlines using verbs like "block", "ban", "prevent", "forbid" toward a minority group score minimum 72.
91-100 = Pure propaganda or hate speech.
Most opinion articles and politically-charged headlines score 55+. A headline framing contested social policy as settled fact scores 65-85.

RULES:
1. FOCUS: Provide ${modeInstruction}.
2. BIAS: Apply calibration above. Be strict and honest.
3. CLICKBAIT: Compare headline to body. false if headline is accurate.
4. SOURCES: 2-3 real well-known publications relevant to topic. Real homepage URLs only. Omit if unsure.
5. ${langRule}`;

    const data = await groqFetch([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Article:\n\n${cleaned}` }
    ]);

    let raw = data.choices[0].message.content.trim()
        .replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
        return JSON.parse(raw);
    } catch (_) {
        return { arguments: [raw], sources: [], biasScore: 50, clickbait: false, clickbaitReason: '' };
    }
}

function humanizeError(msg) {
    if (!msg) return "Unknown error. Please try again.";
    if (msg.includes("API Key"))     return "API key not configured. Please check env.js.";
    if (msg.includes("429"))         return "Rate limit reached. Please wait a moment and try again.";
    if (msg.includes("503"))         return "Groq is temporarily unavailable. Try again shortly.";
    if (msg.includes("fetch") || msg.includes("network")) return "Network error. Please check your connection.";
    return msg.length > 150 ? msg.substring(0, 150) + "…" : msg;
}