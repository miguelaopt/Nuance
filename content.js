// content.js — Nuance v1.1

console.log("☯️ Nuance content script active.");

const SETTINGS_KEY = 'nuanceSettings';

// ─── Text Extraction ───────────────────────────────────────────────────────────

function extractCleanText() {
    let articleText = "";
    const article = document.querySelector('article');

    if (article) {
        article.querySelectorAll('p').forEach(p => {
            if (p.innerText.trim().length > 40) articleText += p.innerText.trim() + "\n\n";
        });
    } else {
        document.querySelectorAll('p').forEach(p => {
            if (p.innerText.trim().length > 100) articleText += p.innerText.trim() + "\n\n";
        });
    }
    return articleText;
}

// ─── Theme Resolution ──────────────────────────────────────────────────────────

function resolveTheme(savedTheme) {
    if (savedTheme === 'light') return 'light';
    if (savedTheme === 'dark') return 'dark';
    // auto: follow system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ─── Styles ────────────────────────────────────────────────────────────────────

function buildStyles() {
    return `
        :host { all: initial; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
            -webkit-font-smoothing: antialiased;
            width: 320px;
            border-radius: 22px;
            padding: 0;
            overflow: hidden;
            animation: slideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .card.light {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(28px) saturate(200%);
            -webkit-backdrop-filter: blur(28px) saturate(200%);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.13), 0 2px 8px rgba(0, 0, 0, 0.06);
            color: #1d1d1f;
        }

        .card.dark {
            background: rgba(28, 28, 30, 0.94);
            backdrop-filter: blur(28px) saturate(180%);
            -webkit-backdrop-filter: blur(28px) saturate(180%);
            border: 0.5px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.3);
            color: #f5f5f7;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(18px) scale(0.94); }
            to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }

        /* ── Header ── */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px 13px;
        }

        .wordmark {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .wordmark-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #0071e3;
            flex-shrink: 0;
        }

        .card.dark .wordmark-dot { background: #2997ff; }

        .wordmark-text {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: -0.2px;
        }

        .card.light .wordmark-text { color: #1d1d1f; }
        .card.dark  .wordmark-text { color: #f5f5f7; }

        .controls { display: flex; gap: 2px; align-items: center; }

        .ctrl-btn {
            background: none;
            border: none;
            cursor: pointer;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            line-height: 1;
            transition: background 0.15s ease;
            color: inherit;
        }

        .card.light .ctrl-btn { color: rgba(0,0,0,0.35); }
        .card.dark  .ctrl-btn { color: rgba(255,255,255,0.35); }

        .card.light .ctrl-btn:hover { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.6); }
        .card.dark  .ctrl-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }

        /* ── Divider ── */
        .divider {
            height: 0.5px;
            margin: 0 16px;
        }

        .card.light .divider { background: rgba(0,0,0,0.07); }
        .card.dark  .divider { background: rgba(255,255,255,0.08); }

        /* ── Body ── */
        .body { padding: 12px 16px 14px; }

        /* ── Loading ── */
        .loading {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 2px 0;
        }

        .pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #0071e3;
            flex-shrink: 0;
            animation: pulse 1.3s ease-in-out infinite;
        }

        .card.dark .pulse-dot { background: #2997ff; }

        @keyframes pulse {
            0%, 100% { opacity: 1;   transform: scale(1);   }
            50%       { opacity: 0.3; transform: scale(0.6); }
        }

        .loading-text {
            font-size: 13px;
            font-style: italic;
        }

        .card.light .loading-text { color: rgba(0,0,0,0.38); }
        .card.dark  .loading-text { color: rgba(255,255,255,0.3); }

        /* ── Arguments ── */
        .arg-item {
            display: flex;
            gap: 10px;
            padding: 8px 0;
            animation: fadeRise 0.4s ease both;
        }

        .arg-item + .arg-item {
            border-top: 0.5px solid transparent;
        }

        .card.light .arg-item + .arg-item { border-top-color: rgba(0,0,0,0.055); }
        .card.dark  .arg-item + .arg-item { border-top-color: rgba(255,255,255,0.06); }

        .arg-item:nth-child(1) { animation-delay: 0.04s; }
        .arg-item:nth-child(2) { animation-delay: 0.12s; }
        .arg-item:nth-child(3) { animation-delay: 0.20s; }

        @keyframes fadeRise {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: translateY(0);   }
        }

        .arg-num {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #0071e3;
            color: #fff;
            font-size: 9.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .card.dark .arg-num { background: #2997ff; }

        .arg-text {
            font-size: 13.5px;
            line-height: 1.45;
            flex: 1;
        }

        .card.light .arg-text { color: #1d1d1f; }
        .card.dark  .arg-text { color: #e0e0e6; }

        /* ── Sources ── */
        .sources-wrap { margin-top: 0; }

        .sources-label {
            font-size: 10.5px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 10px 16px 6px;
        }

        .card.light .sources-label { color: rgba(0,0,0,0.3); }
        .card.dark  .sources-label { color: rgba(255,255,255,0.28); }

        .sources-list {
            padding: 0 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .source-link {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 8px;
            border-radius: 10px;
            text-decoration: none;
            font-size: 12.5px;
            font-weight: 500;
            letter-spacing: -0.1px;
            transition: background 0.13s ease;
            animation: fadeRise 0.4s ease both;
        }

        .source-link:nth-child(1) { animation-delay: 0.3s; }
        .source-link:nth-child(2) { animation-delay: 0.38s; }
        .source-link:nth-child(3) { animation-delay: 0.46s; }

        .card.light .source-link { color: #0071e3; }
        .card.dark  .source-link { color: #2997ff; }

        .card.light .source-link:hover { background: rgba(0,113,227,0.07); }
        .card.dark  .source-link:hover { background: rgba(41,151,255,0.12); }

        .source-favicon {
            width: 14px;
            height: 14px;
            border-radius: 4px;
            flex-shrink: 0;
            object-fit: cover;
            background: rgba(0,113,227,0.12);
        }

        .source-arrow {
            margin-left: auto;
            font-size: 10px;
            opacity: 0.4;
        }

        /* ── Error ── */
        .error-text {
            font-size: 13px;
            padding: 2px 0;
        }

        .card.light .error-text { color: #ff3b30; }
        .card.dark  .error-text { color: #ff453a; }
    `;
}

// ─── Panel Injection ───────────────────────────────────────────────────────────

let shadowRoot = null;
let currentTheme = 'light';

function injectPanel(theme) {
    if (document.getElementById('nuance-root')) return;

    currentTheme = theme;

    const host = document.createElement('div');
    host.id = 'nuance-root';
    host.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
    `;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadowRoot = shadow;

    const styleEl = document.createElement('style');
    styleEl.textContent = buildStyles();
    shadow.appendChild(styleEl);

    const card = document.createElement('div');
    card.className = `card ${theme}`;
    card.innerHTML = buildCardHTML(theme);
    shadow.appendChild(card);

    // Wire up close button
    shadow.querySelector('.close-btn').addEventListener('click', () => {
        host.remove();
        shadowRoot = null;
    });

    // Wire up theme toggle
    shadow.querySelector('.theme-btn').addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        currentTheme = newTheme;
        card.className = `card ${newTheme}`;
        shadow.querySelector('.theme-btn').textContent = newTheme === 'dark' ? '☀️' : '🌙';

        // Persist override to storage
        chrome.storage.local.get([SETTINGS_KEY], result => {
            const s = result[SETTINGS_KEY] || {};
            chrome.storage.local.set({ [SETTINGS_KEY]: { ...s, theme: newTheme } });
        });
    });
}

function buildCardHTML(theme) {
    const themeIcon = theme === 'dark' ? '☀️' : '🌙';
    return `
        <div class="header">
            <div class="wordmark">
                <div class="wordmark-dot"></div>
                <span class="wordmark-text">Nuance</span>
            </div>
            <div class="controls">
                <button class="ctrl-btn theme-btn" title="Toggle theme">${themeIcon}</button>
                <button class="ctrl-btn close-btn" title="Close">✕</button>
            </div>
        </div>
        <div class="divider"></div>
        <div class="body">
            <div class="loading">
                <div class="pulse-dot"></div>
                <span class="loading-text">Analyzing article…</span>
            </div>
        </div>
        <div class="sources-wrap" style="display:none"></div>
    `;
}

// ─── Render Results ────────────────────────────────────────────────────────────

function renderResults(response) {
    if (!shadowRoot) return;

    const body = shadowRoot.querySelector('.body');
    const sourcesWrap = shadowRoot.querySelector('.sources-wrap');

    if (!response || !response.success) {
        body.innerHTML = `<span class="error-text">Error: ${response?.error || 'No response received.'}</span>`;
        return;
    }

    const { arguments: args, sources } = response;

    // Render arguments
    if (Array.isArray(args) && args.length > 0) {
        body.innerHTML = args.map((arg, i) => `
            <div class="arg-item">
                <div class="arg-num">${i + 1}</div>
                <div class="arg-text">${escapeHTML(arg)}</div>
            </div>
        `).join('');
    } else if (typeof args === 'string') {
        // Fallback plain text
        body.innerHTML = `<div class="arg-text">${args.replace(/\n/g, '<br>')}</div>`;
    }

    // Render sources
    if (sources && sources.length > 0) {
        sourcesWrap.style.display = 'block';
        sourcesWrap.innerHTML = `
            <div class="divider"></div>
            <div class="sources-label">Sources</div>
            <div class="sources-list">
                ${sources.map(s => `
                    <a class="source-link" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">
                        <img class="source-favicon"
                             src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}&sz=32"
                             alt=""
                             onerror="this.style.display='none'">
                        ${escapeHTML(s.name)}
                        <span class="source-arrow">↗</span>
                    </a>
                `).join('')}
            </div>
        `;
    }
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Boot ──────────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
    const text = extractCleanText();

    if (text.length <= 500) {
        console.log("📄 Nuance: not enough content on this page. Sleeping.");
        return;
    }

    console.log("📰 Nuance: article detected. Loading settings…");

    // Read user preferences before doing anything
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
        const settings = result[SETTINGS_KEY] || {};
        const theme = resolveTheme(settings.theme);
        const language = settings.language || 'auto';

        console.log(`⚙️ Nuance: theme=${theme}, language=${language}`);

        injectPanel(theme);

        chrome.runtime.sendMessage(
            { action: "analyzeText", text, language },
            (response) => {
                console.log("📥 Nuance: analysis received.", response);
                renderResults(response);
            }
        );
    });
});