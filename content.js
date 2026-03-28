// content.js — Nuance v1.5

console.log("☯️ Nuance active.");

const SETTINGS_KEY     = 'nuanceSettings';
const USAGE_KEY        = 'nuanceUsage';
const HISTORY_KEY      = 'nuanceHistory';
const FREE_DAILY_LIMIT = 5;
const FREE_HISTORY_MAX = 10;
const extpay = ExtPay('nuance-6746');

// Current user state (resolved on boot)
let _isPro = false;

// ─── i18n ─────────────────────────────────────────────────────────────────────
const modeI18n = {
    'auto':       { counter: "Counter-Points",    fallacy: "Fallacies 🔒",    factcheck: "Fact-Check 🔒" },
    'English':    { counter: "Counter-Points",    fallacy: "Fallacies 🔒",    factcheck: "Fact-Check 🔒" },
    'Portuguese': { counter: "Contra-Argumentos", fallacy: "Falácias 🔒",     factcheck: "Fact-Check 🔒" },
    'Spanish':    { counter: "Contraargumentos",  fallacy: "Falacias 🔒",     factcheck: "Verificación 🔒" },
    'French':     { counter: "Contre-Arguments",  fallacy: "Sophismes 🔒",    factcheck: "Vérification 🔒" },
    'German':     { counter: "Gegenargumente",    fallacy: "Fehlschlüsse 🔒", factcheck: "Faktencheck 🔒" },
    'Italian':    { counter: "Controargomenti",   fallacy: "Fallacie 🔒",     factcheck: "Fact-Check 🔒" },
    'Dutch':      { counter: "Tegenargumenten",   fallacy: "Drogredenen 🔒",  factcheck: "Factcheck 🔒" }
};

const modeI18nPro = {
    'auto':       { counter: "Counter-Points",    fallacy: "Logical Fallacies", factcheck: "Fact-Check" },
    'English':    { counter: "Counter-Points",    fallacy: "Logical Fallacies", factcheck: "Fact-Check" },
    'Portuguese': { counter: "Contra-Argumentos", fallacy: "Falácias Lógicas",  factcheck: "Fact-Check" },
    'Spanish':    { counter: "Contraargumentos",  fallacy: "Falacias Lógicas",  factcheck: "Verificación" },
    'French':     { counter: "Contre-Arguments",  fallacy: "Sophismes",         factcheck: "Vérification" },
    'German':     { counter: "Gegenargumente",    fallacy: "Log. Fehlschlüsse", factcheck: "Faktencheck" },
    'Italian':    { counter: "Controargomenti",   fallacy: "Fallacie Logiche",  factcheck: "Fact-Check" },
    'Dutch':      { counter: "Tegenargumenten",   fallacy: "Log. Drogredenen",  factcheck: "Factcheck" }
};

// ─── Theme ────────────────────────────────────────────────────────────────────
function resolveTheme(s) {
    if (s === 'light') return 'light';
    if (s === 'dark')  return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
function buildStyles() { return `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .card {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        -webkit-font-smoothing: antialiased;
        width: 360px; border-radius: 22px; overflow: hidden;
        animation: slideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .card.light {
        --bg-pill: rgba(0,0,0,0.06); --bg-pill-hov: rgba(0,0,0,0.1);
        --border: rgba(0,0,0,0.1); --text: #1d1d1f; --sub: rgba(0,0,0,0.55);
        --blue: #0071e3; --blue-num: #fff;
        background: rgba(255,255,255,0.92);
        backdrop-filter: blur(28px) saturate(200%); -webkit-backdrop-filter: blur(28px) saturate(200%);
        border: 0.5px solid var(--border);
        box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
        color: var(--text);
    }
    .card.dark {
        --bg-pill: rgba(255,255,255,0.11); --bg-pill-hov: rgba(255,255,255,0.18);
        --border: rgba(255,255,255,0.1); --text: #f5f5f7; --sub: rgba(255,255,255,0.65);
        --blue: #2997ff; --blue-num: #fff;
        background: rgba(28,28,30,0.95);
        backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%);
        border: 0.5px solid var(--border);
        box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.35);
        color: var(--text);
    }
    .card.minimized .body, .card.minimized .divider-line,
    .card.minimized .sources-wrap, .card.minimized .clickbait-banner { display: none !important; }
    .card.minimized { width: 140px; }

    @keyframes slideUp { from{opacity:0;transform:translateY(18px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }

    /* Clickbait banner */
    .clickbait-banner {
        display: flex; align-items: flex-start; gap: 9px;
        padding: 10px 16px 11px;
        background: rgba(255,159,10,0.12); border-bottom: 0.5px solid rgba(255,159,10,0.25);
        animation: fadeRise 0.4s ease both;
    }
    .card.dark .clickbait-banner { background: rgba(255,159,10,0.1); }
    .cb-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .cb-text { font-size: 12px; line-height: 1.4; color: #b36200; }
    .card.dark .cb-text { color: #ffb340; }
    .cb-label { font-weight: 700; display: block; margin-bottom: 2px; }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 11px; cursor: grab; user-select: none; }
    .header:active { cursor: grabbing; }
    .mac-controls { display: flex; gap: 6px; }
    .mac-btn { width: 12px; height: 12px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0; }
    .mac-close { background: #ff5f56; border: 0.5px solid #e0443e; }
    .mac-min   { background: #ffbd2e; border: 0.5px solid #dea123; }
    .wordmark { display: flex; align-items: center; gap: 6px; pointer-events: none; flex: 1; justify-content: center; }
    .wordmark-text { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; }

    .mode-select {
        appearance: none; -webkit-appearance: none;
        background: var(--bg-pill);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat; background-position: right 6px center; background-size: 10px;
        border: 0.5px solid transparent; border-radius: 12px;
        padding: 4px 22px 4px 9px; font-size: 11px; font-weight: 600;
        color: var(--text); cursor: pointer; outline: none;
        margin-left: 6px; transition: background 0.15s; pointer-events: auto;
    }
    .mode-select:hover { background-color: var(--bg-pill-hov); border-color: var(--border); }

    /* Share button */
    .share-btn {
        background: var(--bg-pill); border: 0.5px solid transparent;
        color: var(--text); font-size: 11px; font-weight: 600;
        border-radius: 12px; padding: 4px 9px; cursor: pointer;
        display: flex; align-items: center; gap: 4px;
        transition: all 0.15s; pointer-events: auto; font-family: inherit;
    }
    .share-btn:hover { background: var(--bg-pill-hov); border-color: var(--border); }
    .share-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .divider-line { height: 0.5px; background: var(--border); }
    .body { padding: 12px 16px 14px; }

    /* Loading */
    .loading { display: flex; align-items: center; gap: 10px; padding: 2px 0; }
    .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--blue); flex-shrink: 0; animation: pulse 1.3s ease-in-out infinite; }
    .loading-text { font-size: 13px; font-style: italic; color: var(--sub); }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }

    /* Bias */
    .bias-wrap { margin-bottom: 14px; }
    .bias-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--sub); }
    .bias-score-label { font-weight: 700; }
    .bias-bar-bg { width: 100%; height: 5px; background: var(--bg-pill); border-radius: 4px; overflow: hidden; }
    .bias-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }

    /* Arguments */
    .arg-item { display: flex; gap: 10px; padding: 8px 0; animation: fadeRise 0.4s ease both; }
    .arg-item + .arg-item { border-top: 0.5px solid var(--border); }
    .arg-item:nth-child(1){animation-delay:0.04s} .arg-item:nth-child(2){animation-delay:0.12s} .arg-item:nth-child(3){animation-delay:0.20s}
    .arg-num { width: 18px; height: 18px; border-radius: 50%; background: var(--blue); color: var(--blue-num); font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .arg-text { font-size: 13.5px; line-height: 1.45; flex: 1; }
    @keyframes fadeRise { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

    /* Sources */
    .sources-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px 6px; color: var(--sub); }
    .sources-list { padding: 0 10px 12px; display: flex; flex-direction: column; gap: 2px; }
    .source-link { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; text-decoration: none; font-size: 12.5px; font-weight: 500; color: var(--blue); transition: background 0.13s; }
    .source-link:hover { background: var(--bg-pill-hov); }
    .source-favicon { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
    .source-arrow { margin-left: auto; opacity: 0.45; font-size: 10px; }

    /* Paywall — full limit */
    .paywall-box { text-align: center; padding: 8px 0 4px; }
    .paywall-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; color: #ff3b30; }
    .card.dark .paywall-title { color: #ff453a; }
    .paywall-desc { font-size: 12.5px; color: var(--sub); margin-bottom: 14px; line-height: 1.45; }
    .paywall-btn { background: var(--blue); color: #fff; border: none; border-radius: 12px; padding: 10px 20px; font-weight: 600; cursor: pointer; width: 100%; font-size: 13.5px; font-family: inherit; transition: opacity 0.15s; }
    .paywall-btn:hover { opacity: 0.88; }

    /* Pro gate — inline feature lock */
    .pro-gate {
        display: flex; flex-direction: column; align-items: center;
        padding: 16px 12px 12px; text-align: center; gap: 10px;
        animation: fadeRise 0.3s ease both;
    }
    .pro-gate-icon { font-size: 26px; }
    .pro-gate-title { font-size: 14px; font-weight: 700; }
    .pro-gate-desc { font-size: 12px; color: var(--sub); line-height: 1.4; max-width: 280px; }
    .pro-gate-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: linear-gradient(90deg,#1456cc,#2a84f0);
        color: #fff; border: none; border-radius: 12px;
        padding: 9px 20px; font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: inherit; transition: opacity 0.15s;
        margin-top: 2px;
    }
    .pro-gate-btn:hover { opacity: 0.88; }

    /* Share gate toast */
    .share-toast {
        position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85); color: #fff;
        font-size: 12px; font-weight: 500;
        padding: 8px 14px; border-radius: 20px;
        white-space: nowrap; pointer-events: none;
        animation: toastIn 0.25s ease both, toastOut 0.3s ease 2.2s both;
        z-index: 10;
    }
    @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes toastOut { from{opacity:1} to{opacity:0} }

    /* Error */
    .error-msg { font-size: 13px; padding: 4px 0; line-height: 1.4; }
    .card.light .error-msg { color: #ff3b30; }
    .card.dark  .error-msg { color: #ff453a; }
`; }

// ─── State ────────────────────────────────────────────────────────────────────
let shadowRoot  = null;
let hostElement = null;

// ─── Panel Injection ──────────────────────────────────────────────────────────
function injectPanel(theme, language) {
    if (document.getElementById('nuance-root')) return;

    hostElement = document.createElement('div');
    hostElement.id = 'nuance-root';
    hostElement.style.cssText = 'position:fixed;top:24px;right:24px;z-index:2147483647;';
    document.body.appendChild(hostElement);

    const shadow = hostElement.attachShadow({ mode: 'open' });
    shadowRoot = shadow;

    const styleEl = document.createElement('style');
    styleEl.textContent = buildStyles();
    shadow.appendChild(styleEl);

    const card = document.createElement('div');
    card.className = `card ${theme}`;
    card.innerHTML = buildCardHTML(language || 'auto');
    shadow.appendChild(card);

    // Mac controls
    shadow.querySelector('.mac-close').addEventListener('click', () => { hostElement.remove(); shadowRoot = null; });
    shadow.querySelector('.mac-min').addEventListener('click', () => card.classList.toggle('minimized'));

    // Mode dropdown — PRO gate on fallacy/factcheck
    shadow.querySelector('#lensMode').addEventListener('change', e => {
        const mode = e.target.value;

        if ((mode === 'fallacy' || mode === 'factcheck') && !_isPro) {
            // Reset dropdown to counter
            e.target.value = 'counter';
            renderProGate(mode);
            return;
        }

        const body = shadow.querySelector('.body');
        const sw   = shadow.querySelector('.sources-wrap');
        body.innerHTML = `<div class="loading"><div class="pulse-dot"></div><span class="loading-text">Changing lens…</span></div>`;
        sw.style.display = 'none';

        chrome.storage.local.get([SETTINGS_KEY], r => {
            const lang = (r[SETTINGS_KEY] || {}).language || 'auto';
            chrome.runtime.sendMessage(
                { action: "analyzeText", text: extractCleanText(), language: lang, mode, url: location.href },
                resp => renderResults(resp)
            );
        });
    });

    // Share button — PRO gate
    shadow.querySelector('.share-btn').addEventListener('click', () => {
        if (!_isPro) {
            showShareToast();
            return;
        }
        const resp = window._nuanceLastResponse;
        if (!resp) return;
        generateSharePNG(resp);
    });

    // Drag
    initDrag(shadow, card);
}

function buildCardHTML(langKey) {
    const t = _isPro
        ? (modeI18nPro[langKey] || modeI18nPro['English'])
        : (modeI18n[langKey]    || modeI18n['English']);

    return `
        <div class="header">
            <div class="mac-controls">
                <button class="mac-btn mac-close" title="Close"></button>
                <button class="mac-btn mac-min" title="Minimize"></button>
            </div>
            <div class="wordmark">
                <span class="wordmark-text">Nuance</span>
                <select class="mode-select" id="lensMode">
                    <option value="counter">${t.counter}</option>
                    <option value="fallacy">${t.fallacy}</option>
                    <option value="factcheck">${t.factcheck}</option>
                </select>
            </div>
            <div style="position:relative;">
                <button class="share-btn" title="${_isPro ? 'Share as image' : 'PRO feature'}" ${_isPro ? '' : ''}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    ${_isPro ? 'Share' : '🔒'}
                </button>
            </div>
        </div>
        <div class="divider-line"></div>
        <div class="body">
            <div class="loading"><div class="pulse-dot"></div><span class="loading-text">Analyzing article…</span></div>
        </div>
        <div class="sources-wrap" style="display:none"></div>
    `;
}

// ─── PRO gate renders ─────────────────────────────────────────────────────────
function renderProGate(mode) {
    if (!shadowRoot) return;
    const body = shadowRoot.querySelector('.body');
    const sw   = shadowRoot.querySelector('.sources-wrap');
    sw.style.display = 'none';

    const labels = {
        fallacy:   { icon: '🧩', title: 'Logical Fallacy Detection', desc: 'Identify manipulation tactics in the article\'s arguments.' },
        factcheck: { icon: '🔍', title: 'Deep Fact-Check Mode',      desc: 'Verify specific claims as Confirmed, Disputed, or Unverified.' }
    };
    const { icon, title, desc } = labels[mode] || labels.fallacy;

    body.innerHTML = `
        <div class="pro-gate">
            <div class="pro-gate-icon">${icon}</div>
            <div class="pro-gate-title">${title} is a Pro feature</div>
            <div class="pro-gate-desc">${desc} Upgrade to Nuance Pro for unlimited access.</div>
            <button class="pro-gate-btn" id="proGateUpgradeBtn">✦ Upgrade to Pro — €3.99/mo</button>
        </div>
    `;
    shadowRoot.querySelector('#proGateUpgradeBtn').addEventListener('click', () => {
        extpay.openPaymentPage();
    });
}

function showShareToast() {
    if (!shadowRoot) return;
    const existing = shadowRoot.querySelector('.share-toast');
    if (existing) existing.remove();

    const card = shadowRoot.querySelector('.card');
    card.style.position = 'relative';
    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = '🔒 Social share is a Pro feature';
    card.appendChild(toast);
    setTimeout(() => toast.remove(), 2700);
}

// ─── Drag ─────────────────────────────────────────────────────────────────────
function initDrag(shadow, card) {
    const header = shadow.querySelector('.header');
    let isDragging = false, sx, sy, ix, iy;

    header.addEventListener('mousedown', e => {
        if (e.target.closest('.mac-controls, .mode-select, .share-btn')) return;
        isDragging = true;
        sx = e.clientX; sy = e.clientY;
        const r = hostElement.getBoundingClientRect();
        ix = r.left; iy = r.top;
        hostElement.style.right = 'auto';
        hostElement.style.left = ix + 'px';
        hostElement.style.top  = iy + 'px';
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        hostElement.style.left = (ix + e.clientX - sx) + 'px';
        hostElement.style.top  = (iy + e.clientY - sy) + 'px';
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
}

// ─── Clickbait banner ─────────────────────────────────────────────────────────
function showClickbaitBanner(reason) {
    if (!shadowRoot) return;
    const card = shadowRoot.querySelector('.card');
    if (!card) return;
    const existing = shadowRoot.querySelector('.clickbait-banner');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.className = 'clickbait-banner';
    banner.innerHTML = `
        <span class="cb-icon">⚠️</span>
        <div class="cb-text">
            <span class="cb-label">Potentially Misleading Title</span>
            ${reason ? escapeHTML(reason) : ''}
        </div>
    `;
    const divider = shadowRoot.querySelector('.divider-line');
    card.insertBefore(banner, divider);
}

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(response) {
    window._nuanceLastResponse = response;
    if (!shadowRoot) return;

    const body        = shadowRoot.querySelector('.body');
    const sourcesWrap = shadowRoot.querySelector('.sources-wrap');
    const shareBtn    = shadowRoot.querySelector('.share-btn');
    sourcesWrap.style.display = 'none';

    if (!response || !response.success) {
        body.innerHTML = `<span class="error-msg">⚠️ ${escapeHTML(response?.error || 'Analysis failed. Please try again.')}</span>`;
        return;
    }

    const { arguments: args, sources, biasScore, clickbait, clickbaitReason } = response;

    if (clickbait) showClickbaitBanner(clickbaitReason);

    let html = '';

    // Bias bar
    if (biasScore !== undefined) {
        let color = '#34c759', level = 'Low';
        if (biasScore > 40) { color = '#ffcc00'; level = 'Moderate'; }
        if (biasScore > 75) { color = '#ff3b30'; level = 'High'; }
        html += `
            <div class="bias-wrap">
                <div class="bias-header">
                    <span>Bias</span>
                    <span class="bias-score-label" style="color:${color}">${level} · ${biasScore}%</span>
                </div>
                <div class="bias-bar-bg">
                    <div class="bias-bar-fill" style="width:${biasScore}%;background:${color};"></div>
                </div>
            </div>
            <div style="height:0.5px;background:var(--border);margin:0 0 12px;"></div>
        `;
    }

    if (Array.isArray(args) && args.length) {
        html += args.map((a, i) => `
            <div class="arg-item">
                <div class="arg-num">${i + 1}</div>
                <div class="arg-text">${escapeHTML(a)}</div>
            </div>
        `).join('');
    } else if (typeof args === 'string') {
        html += `<div class="arg-text">${escapeHTML(args)}</div>`;
    }

    body.innerHTML = html;

    if (sources && sources.length > 0) {
        sourcesWrap.style.display = 'block';
        sourcesWrap.innerHTML = `
            <div style="height:0.5px;background:var(--border);"></div>
            <div class="sources-label">Sources</div>
            <div class="sources-list">
                ${sources.map(s => `
                    <a class="source-link" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">
                        <img class="source-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}&sz=32" onerror="this.style.display='none'" alt="">
                        ${escapeHTML(s.name)}
                        <span class="source-arrow">↗</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    // Only enable share if PRO
    if (shareBtn && _isPro) shareBtn.disabled = false;

    saveToHistory(response);
}

// ─── Paywall (daily limit) ────────────────────────────────────────────────────
function renderPaywall() {
    if (!shadowRoot) return;
    const body = shadowRoot.querySelector('.body');
    const sw   = shadowRoot.querySelector('.sources-wrap');
    sw.style.display = 'none';
    body.innerHTML = `
        <div class="paywall-box">
            <div class="paywall-title">Daily Limit Reached</div>
            <div class="paywall-desc">You've used your ${FREE_DAILY_LIMIT} free analyses for today.<br>Upgrade for unlimited fact-checking.</div>
            <button class="paywall-btn" id="paywall-upgrade-btn">✦ Upgrade to Pro — €3.99/mo</button>
        </div>
    `;
    shadowRoot.querySelector('#paywall-upgrade-btn').addEventListener('click', () => extpay.openPaymentPage());
}

// ─── FEATURE C: PNG Social Share ─────────────────────────────────────────────
function generateSharePNG(data) {
    const W = 1080, H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#06060f'); bg.addColorStop(0.5, '#0d0d1c'); bg.addColorStop(1, '#150e35');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Glows
    const g1 = ctx.createRadialGradient(W*0.85, H*0.1, 0, W*0.85, H*0.1, 340);
    g1.addColorStop(0, 'rgba(100,60,255,0.22)'); g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W*0.1, H*0.85, 0, W*0.1, H*0.85, 280);
    g2.addColorStop(0, 'rgba(0,80,255,0.18)'); g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // Top gradient line
    const topLine = ctx.createLinearGradient(0, 0, W, 0);
    topLine.addColorStop(0, 'transparent'); topLine.addColorStop(0.3, 'rgba(100,80,255,0.7)');
    topLine.addColorStop(0.7, 'rgba(41,151,255,0.7)'); topLine.addColorStop(1, 'transparent');
    ctx.fillStyle = topLine; ctx.fillRect(0, 0, W, 2);

    const PAD = 72;
    const font = (size, weight) => `${weight} ${size}px -apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif`;

    // Wordmark
    ctx.font = font(22, 700); ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('NUANCE', PAD, 78);

    // Bias pill
    if (data.biasScore !== undefined) {
        let bc = data.biasScore > 75 ? '#ff3b30' : data.biasScore > 40 ? '#ffcc00' : '#34c759';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(W-PAD-110, 50, 110, 36, 18); else ctx.rect(W-PAD-110, 50, 110, 36);
        ctx.fillStyle = `${bc}22`; ctx.fill();
        ctx.strokeStyle = `${bc}88`; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = font(15, 700); ctx.fillStyle = bc; ctx.textAlign = 'center';
        ctx.fillText(`Bias ${data.biasScore}%`, W-PAD-55, 74);
        ctx.textAlign = 'left';
    }

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(PAD, 110, W-PAD*2, 1);

    // Title
    const pageTitle = document.querySelector('h1')?.innerText?.trim()?.substring(0, 120) || document.title || location.hostname;
    const titleLines = wrapText(ctx, pageTitle, W-PAD*2, font(44, 700));
    ctx.font = font(44, 700); ctx.fillStyle = '#ffffff';
    titleLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, PAD, 170 + i*56));

    let argY = 290 + Math.min(titleLines.length, 3) * 56;

    // Clickbait warning
    if (data.clickbait) {
        ctx.fillStyle = 'rgba(255,159,10,0.1)';
        if (ctx.roundRect) ctx.roundRect(PAD, argY-4, W-PAD*2, 44, 10); else ctx.rect(PAD, argY-4, W-PAD*2, 44);
        ctx.fill();
        ctx.font = font(15, 600); ctx.fillStyle = '#ffb340';
        ctx.fillText('⚠️  Potentially misleading title', PAD+14, argY+24);
        argY += 64;
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = font(13, 600);
    ctx.fillText('KEY INSIGHTS', PAD, argY+2);
    argY += 26;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(PAD, argY, W-PAD*2, 1);
    argY += 20;

    // Arguments
    const args = Array.isArray(data.arguments) ? data.arguments : [data.arguments];
    args.slice(0, 3).forEach((arg, i) => {
        ctx.fillStyle = '#2997ff'; ctx.beginPath(); ctx.arc(PAD+13, argY+13, 13, 0, Math.PI*2); ctx.fill();
        ctx.font = font(14, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(String(i+1), PAD+13, argY+18); ctx.textAlign = 'left';
        ctx.font = font(17, 400); ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const lines = wrapText(ctx, arg, W-PAD*2-38, font(17, 400));
        lines.slice(0, 3).forEach((line, j) => ctx.fillText(line, PAD+36, argY+18+j*24));
        argY += Math.max(44, lines.slice(0,3).length*24 + 18);
        if (i < 2) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(PAD+36, argY-6, W-PAD*2-36, 1); }
    });

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(PAD, H-90, W-PAD*2, 1);
    ctx.font = font(13, 500); ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText('nuance.app', PAD, H-58);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText(location.hostname, W-PAD, H-58); ctx.textAlign = 'left';

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nuance-${location.hostname}-${Date.now()}.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
}

function wrapText(ctx, text, maxW, fontStr) {
    ctx.font = fontStr;
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width <= maxW) { cur = test; }
        else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
}

// ─── History ──────────────────────────────────────────────────────────────────
function saveToHistory(response) {
    const title = document.querySelector('h1')?.innerText?.trim() || document.title || location.hostname;
    const { biasScore = 0, clickbait = false } = response;
    const entry = {
        id: Date.now(), url: location.href,
        title: title.substring(0, 120), biasScore, clickbait,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    chrome.storage.local.get([HISTORY_KEY], res => {
        const history  = res[HISTORY_KEY] || [];
        const filtered = history.filter(h => h.url !== entry.url);
        const limit    = _isPro ? 50 : FREE_HISTORY_MAX;
        const updated  = [entry, ...filtered].slice(0, limit);
        chrome.storage.local.set({ [HISTORY_KEY]: updated });
    });
}

// ─── Text extraction ──────────────────────────────────────────────────────────
function isArticlePage() {
    if (window.location.pathname.length < 10) return false;
    return !!document.querySelector('article, [itemtype*="NewsArticle"], .article-body, .texto_noticia, .post-content');
}

function extractCleanText() {
    const container = document.querySelector('article, .texto_noticia, .article-body, .post-content, main') || document.body;
    let text = '';
    container.querySelectorAll('h1, h2, p').forEach(el => {
        if (el.innerText.trim().length > 60) text += el.innerText.trim() + '\n\n';
    });
    return text;
}

function extractTitle() {
    return document.querySelector('h1')?.innerText?.trim()
        || document.querySelector('meta[property="og:title"]')?.content
        || document.title || '';
}

// ─── Limits & analyze ────────────────────────────────────────────────────────
function checkLimitsAndAnalyze(text, language) {
    extpay.getUser().then(user => {
        _isPro = user.paid;
        if (_isPro) {
            runAnalysis(text, language, 'counter');
        } else {
            chrome.storage.local.get([USAGE_KEY], res => {
                const today = new Date().toDateString();
                let usage = res[USAGE_KEY] || { date: today, count: 0 };
                if (usage.date !== today) usage = { date: today, count: 0 };
                if (usage.count >= FREE_DAILY_LIMIT) { renderPaywall(); }
                else {
                    usage.count++;
                    chrome.storage.local.set({ [USAGE_KEY]: usage });
                    runAnalysis(text, language, 'counter');
                }
            });
        }
    }).catch(() => {
        // ExtPay unreachable: allow free tier
        _isPro = false;
        chrome.storage.local.get([USAGE_KEY], res => {
            const today = new Date().toDateString();
            let usage = res[USAGE_KEY] || { date: today, count: 0 };
            if (usage.date !== today) usage = { date: today, count: 0 };
            if (usage.count >= FREE_DAILY_LIMIT) { renderPaywall(); }
            else {
                usage.count++;
                chrome.storage.local.set({ [USAGE_KEY]: usage });
                runAnalysis(text, language, 'counter');
            }
        });
    });
}

function runAnalysis(text, language, mode) {
    chrome.runtime.sendMessage(
        { action: "analyzeText", text, language, mode, url: location.href },
        response => renderResults(response)
    );
}

// ─── Message listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(request => {
    if ((request.action === "forceReanalyze" || request.action === "analyzeSelection") && shadowRoot) {
        const text = request.action === "forceReanalyze" ? extractCleanText() : request.text;
        const lang = request.language || 'auto';

        // Update dropdown labels
        const t = _isPro
            ? (modeI18nPro[lang] || modeI18nPro['English'])
            : (modeI18n[lang]    || modeI18n['English']);
        try {
            shadowRoot.querySelector('#lensMode option[value="counter"]').textContent  = t.counter;
            shadowRoot.querySelector('#lensMode option[value="fallacy"]').textContent  = t.fallacy;
            shadowRoot.querySelector('#lensMode option[value="factcheck"]').textContent = t.factcheck;
        } catch (_) {}

        const body = shadowRoot.querySelector('.body');
        const sw   = shadowRoot.querySelector('.sources-wrap');
        body.innerHTML = `<div class="loading"><div class="pulse-dot"></div><span class="loading-text">Processing…</span></div>`;
        sw.style.display = 'none';

        const mode = shadowRoot.querySelector('#lensMode')?.value || 'counter';
        chrome.runtime.sendMessage(
            { action: "analyzeText", text, language: lang, mode, url: location.href },
            resp => renderResults(resp)
        );
    }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    if (!isArticlePage()) return;
    const text = extractCleanText();
    if (text.length <= 500) return;

    chrome.storage.local.get([SETTINGS_KEY], res => {
        const settings = res[SETTINGS_KEY] || {};
        const theme    = resolveTheme(settings.theme);
        const language = settings.language || 'auto';

        injectPanel(theme, language);

        // Parallel clickbait check
        const title = extractTitle();
        if (title) {
            chrome.runtime.sendMessage(
                { action: "quickClickbaitCheck", titleText: title, language },
                result => { if (result?.clickbait) showClickbaitBanner(result.reason); }
            );
        }

        checkLimitsAndAnalyze(text, language);
    });
});

// ─── Utils ────────────────────────────────────────────────────────────────────
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}