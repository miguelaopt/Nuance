// background.js — Nuance Service Worker v1.5 (Proxy edition)
// No API key in the extension. All Groq calls go through your Vercel proxy.

console.log("🧠 Nuance Service Worker initializing…");

// ⚠️  Replace with your actual Vercel deployment URL after running `vercel deploy`
const PROXY_BASE = 'https://nuance-proxy-7eggf5jtm-miguel-ferreiras-projects-5edf6fa0.vercel.app';

try {
    importScripts('ExtPay.js');
    const extpay = ExtPay('nuance-6746');
    extpay.startBackground();
    console.log("💳 ExtPay ready.");
} catch (e) {
    console.error("❌ ExtPay failed to load:", e);
}

// ─── FEATURE D: Badge restore on tab switch / navigation ─────────────────────

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
            chrome.storage.local.get([`nuanceBias_${hostname}`], result => {
                const cached = result[`nuanceBias_${hostname}`];
                if (cached?.biasScore !== undefined) {
                    applyBadge(tabId, cached.biasScore);
                } else {
                    chrome.action.setBadgeText({ text: '', tabId });
                }
            });
        } catch (_) {}
    };

    if (url) { go(url); }
    else {
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

    if (request.action === 'quickClickbaitCheck') {
        handleQuickCheck(request.titleText, request.language || 'auto', sendResponse);
        return true;
    }

    if (request.action === 'analyzeText') {
        handleFullAnalysis(request, tabId, sendResponse);
        return true;
    }
});

// ─── Quick clickbait check ────────────────────────────────────────────────────

async function handleQuickCheck(titleText, language, sendResponse) {
    if (!titleText || titleText.trim().length < 8) {
        sendResponse({ clickbait: false, reason: '' });
        return;
    }
    try {
        const res  = await proxyPost('/api/quickcheck', { titleText, language });
        const data = await res.json();
        sendResponse(data);
    } catch (e) {
        console.warn('Quick check failed:', e.message);
        sendResponse({ clickbait: false, reason: '' });
    }
}

// ─── Full analysis ────────────────────────────────────────────────────────────

async function handleFullAnalysis(request, tabId, sendResponse) {
    const { text, language = 'auto', mode = 'counter', url: pageUrl } = request;

    try {
        const res = await proxyPost('/api/analyze', { text, language, mode });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            sendResponse({ success: false, error: humanizeError(err.error || `HTTP ${res.status}`) });
            return;
        }

        const result = await res.json();

        // Badge + cache
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
    } catch (e) {
        console.error('Analysis error:', e.message);
        sendResponse({ success: false, error: humanizeError(e.message) });
    }
}

// ─── Proxy helper ─────────────────────────────────────────────────────────────

function proxyPost(path, body) {
    return fetch(`${PROXY_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Nuance-Version': '1.5' },
        body: JSON.stringify(body)
    });
}

// ─── Error humanizer ─────────────────────────────────────────────────────────

function humanizeError(msg) {
    if (!msg) return 'Unknown error. Please try again.';
    if (msg.includes('429'))                         return 'Rate limit reached. Please wait a moment.';
    if (msg.includes('503') || msg.includes('502'))  return 'Service temporarily unavailable. Try again shortly.';
    if (msg.includes('fetch') || msg.includes('Failed to fetch')) return 'Network error. Check your connection.';
    if (msg.includes('configuration'))               return 'Server not configured. Check your Vercel env vars.';
    return msg.length > 140 ? msg.substring(0, 140) + '…' : msg;
}