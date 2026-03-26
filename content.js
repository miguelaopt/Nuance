// content.js — Nuance v1.4

console.log("☯️ Nuance active.");

const SETTINGS_KEY = 'nuanceSettings';
const USAGE_KEY    = 'nuanceUsage';
const HISTORY_KEY  = 'nuanceHistory';
const FREE_DAILY_LIMIT = 5;
const extpay = ExtPay('nuance-6746');

// ─── i18n for mode dropdown ───────────────────────────────────────────────────
const modeI18n = {
    'auto':       { counter: "Counter-Points",   fallacy: "Logical Fallacies",  factcheck: "Fact-Check" },
    'English':    { counter: "Counter-Points",   fallacy: "Logical Fallacies",  factcheck: "Fact-Check" },
    'Portuguese': { counter: "Contra-Argumentos",fallacy: "Falácias Lógicas",   factcheck: "Fact-Check" },
    'Spanish':    { counter: "Contraargumentos", fallacy: "Falacias Lógicas",   factcheck: "Verificación" },
    'French':     { counter: "Contre-Arguments", fallacy: "Sophismes",          factcheck: "Vérification" },
    'German':     { counter: "Gegenargumente",   fallacy: "Log. Fehlschlüsse",  factcheck: "Faktencheck" },
    'Italian':    { counter: "Controargomenti",  fallacy: "Fallacie Logiche",   factcheck: "Fact-Check" },
    'Dutch':      { counter: "Tegenargumenten",  fallacy: "Log. Drogredenen",   factcheck: "Factcheck" }
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

    /* ── Card ── */
    .card {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
        -webkit-font-smoothing: antialiased;
        width: 360px;
        border-radius: 22px;
        overflow: hidden;
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
    .card.minimized .body,
    .card.minimized .divider-line,
    .card.minimized .sources-wrap,
    .card.minimized .clickbait-banner { display: none !important; }
    .card.minimized { width: 140px; }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(18px) scale(0.94); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── FEATURE A: Clickbait Banner ── */
    .clickbait-banner {
        display: flex; align-items: flex-start; gap: 9px;
        margin: 0; padding: 10px 16px 11px;
        background: rgba(255, 159, 10, 0.12);
        border-bottom: 0.5px solid rgba(255, 159, 10, 0.25);
        animation: fadeRise 0.4s ease both;
    }
    .card.dark .clickbait-banner { background: rgba(255,159,10,0.1); }
    .cb-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .cb-text { font-size: 12px; line-height: 1.4; color: #b36200; }
    .card.dark .cb-text { color: #ffb340; }
    .cb-label { font-weight: 700; display: block; margin-bottom: 2px; }

    /* ── Header ── */
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
        margin-left: 6px; transition: background 0.15s;
        pointer-events: auto;
    }
    .mode-select:hover { background-color: var(--bg-pill-hov); border-color: var(--border); }

    /* ── FEATURE C: Share btn ── */
    .share-btn {
        background: var(--bg-pill); border: 0.5px solid transparent;
        color: var(--text); font-size: 11px; font-weight: 600;
        border-radius: 12px; padding: 4px 9px; cursor: pointer;
        display: flex; align-items: center; gap: 4px;
        transition: all 0.15s; pointer-events: auto;
        font-family: inherit;
    }
    .share-btn:hover { background: var(--bg-pill-hov); border-color: var(--border); }
    .share-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Divider ── */
    .divider-line { height: 0.5px; background: var(--border); }

    /* ── Body ── */
    .body { padding: 12px 16px 14px; }

    /* ── Loading ── */
    .loading { display: flex; align-items: center; gap: 10px; padding: 2px 0; }
    .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--blue); flex-shrink: 0; animation: pulse 1.3s ease-in-out infinite; }
    .loading-text { font-size: 13px; font-style: italic; color: var(--sub); }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }

    /* ── Bias Bar ── */
    .bias-wrap { margin-bottom: 14px; }
    .bias-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--sub); }
    .bias-score-label { font-weight: 700; }
    .bias-bar-bg { width: 100%; height: 5px; background: var(--bg-pill); border-radius: 4px; overflow: hidden; }
    .bias-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }

    /* ── Arguments ── */
    .arg-item { display: flex; gap: 10px; padding: 8px 0; animation: fadeRise 0.4s ease both; }
    .arg-item + .arg-item { border-top: 0.5px solid var(--border); }
    .arg-item:nth-child(1) { animation-delay: 0.04s; }
    .arg-item:nth-child(2) { animation-delay: 0.12s; }
    .arg-item:nth-child(3) { animation-delay: 0.20s; }
    .arg-num { width: 18px; height: 18px; border-radius: 50%; background: var(--blue); color: var(--blue-num); font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .arg-text { font-size: 13.5px; line-height: 1.45; flex: 1; }
    @keyframes fadeRise { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

    /* ── Sources ── */
    .sources-wrap { }
    .sources-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px 6px; color: var(--sub); }
    .sources-list { padding: 0 10px 12px; display: flex; flex-direction: column; gap: 2px; }
    .source-link { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; text-decoration: none; font-size: 12.5px; font-weight: 500; color: var(--blue); transition: background 0.13s; }
    .source-link:hover { background: var(--bg-pill-hov); }
    .source-favicon { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
    .source-arrow { margin-left: auto; opacity: 0.45; font-size: 10px; }

    /* ── Paywall ── */
    .paywall-box { text-align: center; padding: 8px 0 4px; }
    .paywall-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; color: #ff3b30; }
    .card.dark .paywall-title { color: #ff453a; }
    .paywall-desc { font-size: 12.5px; color: var(--sub); margin-bottom: 14px; line-height: 1.45; }
    .paywall-btn { background: var(--blue); color: #fff; border: none; border-radius: 12px; padding: 10px 20px; font-weight: 600; cursor: pointer; width: 100%; font-size: 13.5px; font-family: inherit; transition: opacity 0.15s; }
    .paywall-btn:hover { opacity: 0.88; }

    /* ── Error ── */
    .error-msg { font-size: 13px; padding: 4px 0; line-height: 1.4; }
    .card.light .error-msg { color: #ff3b30; }
    .card.dark  .error-msg { color: #ff453a; }
`; }

// ─── State ────────────────────────────────────────────────────────────────────
let shadowRoot = null;
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

    // Lens mode dropdown
    shadow.querySelector('#lensMode').addEventListener('change', e => {
        const mode = e.target.value;
        const body = shadow.querySelector('.body');
        const sw = shadow.querySelector('.sources-wrap');
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

    // FEATURE C: Share button → PNG generator
    shadow.querySelector('.share-btn').addEventListener('click', () => {
        const resp = window._nuanceLastResponse;
        if (!resp) return;
        generateSharePNG(resp);
    });

    // Drag
    initDrag(shadow, card);
}

function buildCardHTML(langKey) {
    const t = modeI18n[langKey] || modeI18n['English'];
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
            <div>
                <button class="share-btn" title="Share as image" disabled>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share
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

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
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

// ─── FEATURE A: Clickbait Banner ─────────────────────────────────────────────
function showClickbaitBanner(reason) {
    if (!shadowRoot) return;
    const card = shadowRoot.querySelector('.card');
    if (!card) return;

    // Remove previous if any
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

    // Insert after header
    const header = shadowRoot.querySelector('.header');
    const divider = shadowRoot.querySelector('.divider-line');
    card.insertBefore(banner, divider);
}

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(response) {
    window._nuanceLastResponse = response;

    if (!shadowRoot) return;
    const body       = shadowRoot.querySelector('.body');
    const sourcesWrap= shadowRoot.querySelector('.sources-wrap');
    const shareBtn   = shadowRoot.querySelector('.share-btn');

    sourcesWrap.style.display = 'none';

    if (!response || !response.success) {
        body.innerHTML = `<span class="error-msg">⚠️ ${escapeHTML(response?.error || 'Analysis failed. Please try again.')}</span>`;
        return;
    }

    const { arguments: args, sources, biasScore, biasReason, clickbait, clickbaitReason } = response;

    // FEATURE A: Show clickbait banner if detected
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

    // Arguments
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

    // Sources
    if (sources && sources.length > 0) {
        sourcesWrap.style.display = 'block';
        sourcesWrap.innerHTML = `
            <div style="height:0.5px;background:var(--border);"></div>
            <div class="sources-label">Sources</div>
            <div class="sources-list">
                ${sources.map(s => `
                    <a class="source-link" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">
                        <img class="source-favicon"
                            src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}&sz=32"
                            onerror="this.style.display='none'"
                            alt="">
                        ${escapeHTML(s.name)}
                        <span class="source-arrow">↗</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    // Enable share button
    if (shareBtn) shareBtn.disabled = false;

    // Save to history
    saveToHistory(response);
}

// ─── Paywall ──────────────────────────────────────────────────────────────────
function renderPaywall() {
    if (!shadowRoot) return;
    const body = shadowRoot.querySelector('.body');
    const sw   = shadowRoot.querySelector('.sources-wrap');
    sw.style.display = 'none';
    body.innerHTML = `
        <div class="paywall-box">
            <div class="paywall-title">Daily Limit Reached</div>
            <div class="paywall-desc">You've used your ${FREE_DAILY_LIMIT} free analyses for today.<br>Upgrade for unlimited fact-checking.</div>
            <button class="paywall-btn" id="pay-btn">Upgrade to Nuance Pro →</button>
        </div>
    `;
    shadowRoot.querySelector('#pay-btn').addEventListener('click', () => extpay.openPaymentPage());
}

// ─── FEATURE C: PNG Social Share ─────────────────────────────────────────────
function generateSharePNG(data) {
    const W = 1080, H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#09090f');
    bg.addColorStop(0.5, '#10101a');
    bg.addColorStop(1,   '#160e38');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ambient glows
    const g1 = ctx.createRadialGradient(W*0.85, H*0.1, 0, W*0.85, H*0.1, 340);
    g1.addColorStop(0, 'rgba(110,60,255,0.22)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W*0.1, H*0.85, 0, W*0.1, H*0.85, 280);
    g2.addColorStop(0, 'rgba(0,90,255,0.18)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // Decorative top edge line
    const line = ctx.createLinearGradient(0, 0, W, 0);
    line.addColorStop(0,   'transparent');
    line.addColorStop(0.3, 'rgba(120,80,255,0.6)');
    line.addColorStop(0.7, 'rgba(41,151,255,0.6)');
    line.addColorStop(1,   'transparent');
    ctx.fillStyle = line;
    ctx.fillRect(0, 0, W, 1.5);

    const PAD = 72;

    // ── Wordmark ──
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    ctx.fillText('NUANCE', PAD, 78);

    // ── Bias pill ──
    if (data.biasScore !== undefined) {
        let biasColor = '#34c759';
        if (data.biasScore > 40) biasColor = '#ffcc00';
        if (data.biasScore > 75) biasColor = '#ff3b30';

        const pillX = W - PAD - 100, pillY = 56;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, 100, 32, 16);
        ctx.fillStyle = hexToRgba(biasColor, 0.15);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(biasColor, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = biasColor;
        ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Bias ${data.biasScore}%`, pillX + 50, pillY + 21);
        ctx.textAlign = 'left';
    }

    // ── Horizontal rule ──
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(PAD, 110, W - PAD*2, 1);

    // ── Article title ──
    const pageTitle = document.querySelector('h1')?.innerText?.trim() || document.title || location.hostname;
    const titleLines = wrapText(ctx, pageTitle.substring(0, 150), W - PAD*2, '700 44px', '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif');

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    titleLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, PAD, 170 + i * 56));

    // ── Clickbait warning ──
    let argY = 280 + Math.min(titleLines.length, 3) * 56;
    if (data.clickbait) {
        ctx.fillStyle = 'rgba(255,159,10,0.12)';
        ctx.beginPath();
        ctx.roundRect(PAD, argY - 2, W - PAD*2, 42, 10);
        ctx.fill();
        ctx.fillStyle = '#ffb340';
        ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
        ctx.fillText('⚠️  Potentially misleading title', PAD + 14, argY + 26);
        argY += 64;
    }

    // ── Section label ──
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    ctx.fillText('KEY INSIGHTS', PAD, argY + 4);
    argY += 28;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(PAD, argY, W - PAD*2, 0.8);
    argY += 20;

    // ── Arguments ──
    const args = Array.isArray(data.arguments) ? data.arguments : [data.arguments];
    args.slice(0, 3).forEach((arg, i) => {
        // Number badge
        ctx.fillStyle = '#2997ff';
        ctx.beginPath();
        ctx.arc(PAD + 13, argY + 13, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), PAD + 13, argY + 18);
        ctx.textAlign = 'left';

        // Text
        ctx.font = '400 17px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        const lines = wrapText(ctx, arg, W - PAD*2 - 38, '400 17px', '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif');
        lines.slice(0, 3).forEach((line, j) => ctx.fillText(line, PAD + 36, argY + 18 + j * 22));
        argY += Math.max(40, lines.slice(0, 3).length * 22 + 16);

        if (i < args.slice(0, 3).length - 1) {
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.fillRect(PAD + 36, argY - 8, W - PAD*2 - 36, 0.8);
        }
    });

    // ── Footer ──
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(PAD, H - 90, W - PAD*2, 0.8);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    ctx.fillText('nuance.app', PAD, H - 58);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    ctx.fillText(location.hostname, W - PAD, H - 58);
    ctx.textAlign = 'left';

    // ── Download ──
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nuance-${location.hostname}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
}

function wrapText(ctx, text, maxWidth, fontSpec, fontFamily) {
    ctx.font = `${fontSpec} ${fontFamily}`;
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width <= maxWidth) {
            current = test;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ─── History ──────────────────────────────────────────────────────────────────
function saveToHistory(response) {
    const title = document.querySelector('h1')?.innerText?.trim()
        || document.title
        || location.hostname;

    const { biasScore = 0, clickbait = false } = response;

    const entry = {
        id:        Date.now(),
        url:       location.href,
        title:     title.substring(0, 120),
        biasScore,
        clickbait,
        date:      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    chrome.storage.local.get([HISTORY_KEY], res => {
        const history = res[HISTORY_KEY] || [];
        // Avoid duplicate for same URL
        const filtered = history.filter(h => h.url !== entry.url);
        const updated = [entry, ...filtered].slice(0, 50);
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
        if (user.paid) {
            runAnalysis(text, language);
        } else {
            chrome.storage.local.get([USAGE_KEY], res => {
                const today = new Date().toDateString();
                let usage = res[USAGE_KEY] || { date: today, count: 0 };
                if (usage.date !== today) usage = { date: today, count: 0 };

                if (usage.count >= FREE_DAILY_LIMIT) {
                    renderPaywall();
                } else {
                    usage.count++;
                    chrome.storage.local.set({ [USAGE_KEY]: usage });
                    runAnalysis(text, language);
                }
            });
        }
    }).catch(() => {
        // If ExtPay is unreachable, allow free usage (degrade gracefully)
        console.warn("⚠️ ExtPay unreachable. Degrading to free tier.");
        chrome.storage.local.get([USAGE_KEY], res => {
            const today = new Date().toDateString();
            let usage = res[USAGE_KEY] || { date: today, count: 0 };
            if (usage.date !== today) usage = { date: today, count: 0 };
            if (usage.count >= FREE_DAILY_LIMIT) {
                renderPaywall();
            } else {
                usage.count++;
                chrome.storage.local.set({ [USAGE_KEY]: usage });
                runAnalysis(text, language);
            }
        });
    });
}

function runAnalysis(text, language) {
    chrome.runtime.sendMessage(
        { action: "analyzeText", text, language, mode: 'counter', url: location.href },
        response => renderResults(response)
    );
}

// ─── Message listener (forceReanalyze from popup) ────────────────────────────
chrome.runtime.onMessage.addListener(request => {
    if ((request.action === "forceReanalyze" || request.action === "analyzeSelection") && shadowRoot) {
        const text = request.action === "forceReanalyze" ? extractCleanText() : request.text;
        const lang = request.language || 'auto';

        // Update dropdown labels
        const t = modeI18n[lang] || modeI18n['English'];
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

        // FEATURE A: Quick clickbait pre-check runs in parallel
        const title = extractTitle();
        if (title) {
            chrome.runtime.sendMessage(
                { action: "quickClickbaitCheck", titleText: title, language },
                result => {
                    if (result?.clickbait) showClickbaitBanner(result.reason);
                }
            );
        }

        checkLimitsAndAnalyze(text, language);
    });
});

// ─── Utils ────────────────────────────────────────────────────────────────────
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}