// content.js — Nuance v1.3 (UI Refined & PDF Button)

console.log("☯️ Nuance content script active.");
const SETTINGS_KEY = 'nuanceSettings';
const USAGE_KEY = 'nuanceUsage';
const FREE_DAILY_LIMIT = 5;
const extpay = ExtPay('nuance-6746'); // ADICIONA ISTO AQUI

// Dicionário para traduzir o Dropdown no próprio site
const modeI18n = {
    'auto': { counter: "Counter-Points", fallacy: "Logical Fallacies", factcheck: "Fact-Check" },
    'English': { counter: "Counter-Points", fallacy: "Logical Fallacies", factcheck: "Fact-Check" },
    'Portuguese': { counter: "Contra-Argumentos", fallacy: "Falácias Lógicas", factcheck: "Fact-Check" },
    'Spanish': { counter: "Contraargumentos", fallacy: "Falacias Lógicas", factcheck: "Verificación" },
    'French': { counter: "Contre-Arguments", fallacy: "Sophismes", factcheck: "Vérification" },
    'German': { counter: "Gegenargumente", fallacy: "Logische Fehlschlüsse", factcheck: "Faktencheck" },
    'Italian': { counter: "Controargomenti", fallacy: "Fallacie Logiche", factcheck: "Fact-Check" },
    'Dutch': { counter: "Tegenargumenten", fallacy: "Logische Drogredenen", factcheck: "Factcheck" }
};

function resolveTheme(savedTheme) {
    if (savedTheme === 'light') return 'light';
    if (savedTheme === 'dark') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function buildStyles() {
    return `
        :host { all: initial; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            -webkit-font-smoothing: antialiased;
            width: 360px;
            border-radius: 22px;
            padding: 0;
            overflow: hidden;
            animation: slideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: height 0.3s ease;
        }
        
        /* Variáveis de Tema Mágico */
        .card.light {
            --bg-pill: rgba(0,0,0,0.06); --bg-pill-hover: rgba(0,0,0,0.1);
            --border: rgba(0, 0, 0, 0.1); --text-main: #1d1d1f; --text-sub: rgba(0,0,0,0.6);
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(28px) saturate(200%);
            border: 0.5px solid var(--border); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.13);
            color: var(--text-main);
        }
        .card.dark {
            --bg-pill: rgba(255,255,255,0.12); --bg-pill-hover: rgba(255,255,255,0.2);
            --border: rgba(255, 255, 255, 0.1); --text-main: #f5f5f7; --text-sub: rgba(255,255,255,0.7);
            background: rgba(28, 28, 30, 0.94); backdrop-filter: blur(28px) saturate(180%);
            border: 0.5px solid var(--border); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
            color: var(--text-main);
        }

        .card.minimized .body, .card.minimized .divider, .card.minimized .sources-wrap { display: none !important; }
        .card.minimized { width: 140px; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(18px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* ── Header & Controles ── */
        .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; cursor: grab; }
        .header:active { cursor: grabbing; }
        
        .mac-controls { display: flex; gap: 6px; align-items: center; }
        .mac-btn { width: 12px; height: 12px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.9; }
        .mac-btn:hover { opacity: 1; }
        .mac-close { background: #ff5f56; border: 0.5px solid #e0443e; }
        .mac-min { background: #ffbd2e; border: 0.5px solid #dea123; }

        .wordmark { display: flex; align-items: center; gap: 6px; pointer-events: none; }
        .wordmark-text { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; }

        /* NOVO: Dropdown e PDF */
        .mode-select {
            appearance: none;
            background: var(--bg-pill);
            border: 0.5px solid transparent;
            border-radius: 12px;
            padding: 4px 22px 4px 10px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-main);
            cursor: pointer;
            outline: none;
            margin-left: 8px;
            margin-right: 16px;
            transition: all 0.2s;
            pointer-events: auto;
            /* Ícone de seta desenhado via CSS */
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 6px top 50%;
            background-size: 12px auto;
        }
        .mode-select:hover { background: var(--bg-pill-hover); border-color: var(--border); }

        .pdf-btn {
            background: var(--bg-pill);
            border: 0.5px solid transparent;
            color: var(--text-main);
            font-size: 11px;
            font-weight: 600;
            border-radius: 12px;
            padding: 4px 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
            pointer-events: auto;
        }
        .pdf-btn:hover { background: var(--bg-pill-hover); border-color: var(--border); }

        .divider { height: 0.5px; margin: 0 16px; background: var(--border); }

        /* ── Resto do UI ── */
        .body { padding: 12px 16px 14px; }
        .loading { display: flex; align-items: center; gap: 10px; padding: 2px 0; }
        .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: #0071e3; animation: pulse 1.3s ease-in-out infinite; }
        .card.dark .pulse-dot { background: #2997ff; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
        .loading-text { font-size: 13px; font-style: italic; opacity: 0.6; }

        .arg-item { display: flex; gap: 10px; padding: 8px 0; animation: fadeRise 0.4s ease both; }
        .arg-num { width: 18px; height: 18px; border-radius: 50%; background: #0071e3; color: #fff; font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .card.dark .arg-num { background: #2997ff; }
        .arg-text { font-size: 13.5px; line-height: 1.45; flex: 1; }
        @keyframes fadeRise { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .sources-wrap { margin-top: 0; }
        .sources-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; padding: 10px 16px 6px; opacity: 0.4; }
        .sources-list { padding: 0 10px 12px; display: flex; flex-direction: column; gap: 2px; }
        .source-link { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; text-decoration: none; font-size: 12.5px; font-weight: 500; color: #0071e3; transition: background 0.13s ease; }
        .card.dark .source-link { color: #2997ff; }
        .source-link:hover { background: var(--bg-pill-hover); }
        .source-favicon { width: 14px; height: 14px; border-radius: 4px; }
        
        .paywall-box { text-align: center; padding: 10px 0; }
        .paywall-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; color: #ff3b30; }
        .paywall-desc { font-size: 12px; opacity: 0.8; margin-bottom: 14px; line-height: 1.4; }
        .paywall-btn { background: #0071e3; color: white; border: none; border-radius: 12px; padding: 10px 20px; font-weight: 600; cursor: pointer; width: 100%; font-size: 13px; }
    `;
}

// ─── Panel Injection & Drag Logic ──────────────────────────────────────────────
let shadowRoot = null;
let hostElement = null;

function injectPanel(theme, language) {
    if (document.getElementById('nuance-root')) return;

    hostElement = document.createElement('div');
    hostElement.id = 'nuance-root';
    hostElement.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 2147483647;`;
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

    // Botões Mac (Vermelho = Fechar, Amarelo = Minimizar)
    shadow.querySelector('.mac-close').addEventListener('click', () => { hostElement.remove(); shadowRoot = null; });
    shadow.querySelector('.mac-min').addEventListener('click', () => { card.classList.toggle('minimized'); });

    // PDF Generator
    shadow.querySelector('.pdf-btn').addEventListener('click', () => {
        if (!window.lastNuanceResponse) return alert("Please wait for the analysis to finish.");
        const { arguments: args, sources, biasScore, biasReason } = window.lastNuanceResponse;
        
        let html = `
            <html><head><meta charset="UTF-8"><title>Nuance Report</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1d1d1f; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { font-size: 26px; margin-bottom: 5px; color: #000; }
                .url { color: #86868b; font-size: 13px; margin-bottom: 30px; word-break: break-all; }
                .bias { padding: 18px; background: #f5f5f7; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid ${biasScore > 75 ? '#ff3b30' : biasScore > 40 ? '#ffcc00' : '#34c759'}; }
                .arg { margin-bottom: 15px; }
                .sources { margin-top: 40px; border-top: 1px solid #d2d2d7; padding-top: 20px; font-size: 14px; }
                ul { padding-left: 20px; }
            </style>
            </head><body>
            <h1>Nuance Analysis Report</h1>
            <div class="url">Source: <a href="${window.location.href}">${window.location.href}</a></div>
            <div class="bias"><strong>Bias Score: ${biasScore}%</strong><br><i>${biasReason}</i></div>
            <h2>Key Insights</h2>
            ${args.map((a, i) => `<div class="arg"><b>${i+1}.</b> ${a}</div>`).join('')}
            <div class="sources"><h3>Verified Sources</h3>
            <ul>${sources.map(s => `<li><a href="${s.url}">${s.name}</a></li>`).join('')}</ul>
            </div><script>window.print();</script></body></html>
        `;
        const blob = new Blob([html], {type: 'text/html'});
        window.open(URL.createObjectURL(blob), '_blank');
    });

    // Lógica do Menu Dropdown
    shadow.querySelector('#lensMode').addEventListener('change', (e) => {
        const selectedMode = e.target.value;
        const body = shadow.querySelector('.body');
        const sourcesWrap = shadow.querySelector('.sources-wrap');
        
        body.innerHTML = `<div class="loading"><div class="pulse-dot"></div><span class="loading-text">Changing lens...</span></div>`;
        sourcesWrap.style.display = 'none';

        chrome.storage.local.get([SETTINGS_KEY], (result) => {
            const settings = result[SETTINGS_KEY] || {};
            chrome.runtime.sendMessage(
                { action: "analyzeText", text: extractCleanText(), language: settings.language || 'auto', mode: selectedMode },
                (response) => renderResults(response)
            );
        });
    });

    // DRAG AND DROP
    const header = shadow.querySelector('.header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', e => {
        // Ignorar se clicou nos botões ou no dropdown
        if(e.target.closest('.mac-controls') || e.target.closest('.mode-select') || e.target.closest('.pdf-btn')) return; 
        
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = hostElement.getBoundingClientRect();
        initialX = rect.left; initialY = rect.top;
        hostElement.style.right = 'auto'; 
        hostElement.style.left = initialX + 'px';
        hostElement.style.top = initialY + 'px';
    });

    window.addEventListener('mousemove', e => {
        if(!isDragging) return;
        hostElement.style.left = (initialX + (e.clientX - startX)) + 'px';
        hostElement.style.top = (initialY + (e.clientY - startY)) + 'px';
    });

    window.addEventListener('mouseup', () => isDragging = false);
}

function buildCardHTML(langKey) {
    const t = modeI18n[langKey] || modeI18n['English'];
    return `
        <div class="header">
            <div class="mac-controls" style="flex: 1; display: flex; justify-content: flex-start;">
                <button class="mac-btn mac-close" title="Close"></button>
                <button class="mac-btn mac-min" title="Minimize"></button>
            </div>
            
            <div class="wordmark" style="flex: 2; display: flex; justify-content: center;">
                <span class="wordmark-text">Nuance</span>
                <select class="mode-select" id="lensMode" title="Focus Mode">
                    <option value="counter">${t.counter}</option>
                    <option value="fallacy">${t.fallacy}</option>
                    <option value="factcheck">${t.factcheck}</option>
                </select>
            </div>
            
            <div style="flex: 1; display: flex; justify-content: flex-end;">
                <button class="pdf-btn" title="Export as PDF">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    PDF
                </button>
            </div>
        </div>
        <div class="divider"></div>
        <div class="body">
            <div class="loading"><div class="pulse-dot"></div><span class="loading-text">Analyzing article…</span></div>
        </div>
        <div class="sources-wrap" style="display:none"></div>
    `;
}

// ─── Render Results & Paywall ────────────────────────────────────────────────
function renderPaywall() {
    if (!shadowRoot) return;
    const body = shadowRoot.querySelector('.body');
    const sourcesWrap = shadowRoot.querySelector('.sources-wrap');
    sourcesWrap.style.display = 'none';
    body.innerHTML = `
        <div class="paywall-box">
            <div class="paywall-title">Daily Limit Reached</div>
            <div class="paywall-desc">You've used your 5 free analyses for today. Upgrade to Nuance Pro for unlimited fact-checking.</div>
            <button class="paywall-btn" id="pay-btn">Upgrade to Pro</button>
        </div>
    `;
    
    // Liga o botão à janela de pagamento
    shadowRoot.querySelector('#pay-btn').addEventListener('click', () => {
        extpay.openPaymentPage();
    });
}

function checkLimitsAndAnalyze(text, language) {
    // 1. Vai ao servidor verificar se é utilizador PRO
    extpay.getUser().then(user => {
        if (user.paid) {
            console.log("💎 Nuance PRO ativo! Acesso ilimitado.");
            // Utilizador Pro: Não há contagem, manda logo analisar
            chrome.runtime.sendMessage(
                { action: "analyzeText", text, language }, 
                (response) => renderResults(response)
            );
        } else {
            console.log("🆓 Nuance Grátis: A verificar limites...");
            // Utilizador Grátis: Verifica a contagem diária (o que já fazias)
            chrome.storage.local.get([USAGE_KEY], (res) => {
                const today = new Date().toDateString();
                let usage = res[USAGE_KEY] || { date: today, count: 0 };
                if (usage.date !== today) usage = { date: today, count: 0 };

                if (usage.count >= FREE_DAILY_LIMIT) {
                    renderPaywall();
                } else {
                    usage.count++; 
                    chrome.storage.local.set({ [USAGE_KEY]: usage });
                    chrome.runtime.sendMessage(
                        { action: "analyzeText", text, language }, 
                        (response) => renderResults(response)
                    );
                }
            });
        }
    }).catch(err => {
        console.error("Erro a contactar o ExtensionPay:", err);
        // Se a internet falhar ou algo der errado, assumimos como grátis por segurança
        renderPaywall(); 
    });
}

function renderResults(response) {
    window.lastNuanceResponse = response;
    if (!shadowRoot) return;
    const body = shadowRoot.querySelector('.body');
    const sourcesWrap = shadowRoot.querySelector('.sources-wrap');

    if (!response || !response.success) {
        body.innerHTML = `<span style="color:#ff3b30; font-size:13px;">Error: ${response?.error || 'Analysis failed.'}</span>`;
        return;
    }

    const { arguments: args, sources, biasScore, biasReason } = response;
    let html = '';

    if (biasScore !== undefined) {
        let color = '#34c759'; let biasLevel = 'Low';
        if (biasScore > 40) { color = '#ffcc00'; biasLevel = 'Moderate'; } 
        if (biasScore > 75) { color = '#ff3b30'; biasLevel = 'High'; }     

        html += `
            <div style="margin-bottom: 14px;">
                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between; opacity: 0.6;">
                    <span>Bias Score: ${biasLevel}</span>
                    <span style="color: ${color}; opacity: 1;">${biasScore}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(128,128,128,0.2); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${biasScore}%; background: ${color}; transition: width 1s;"></div>
                </div>
            </div>
            <div class="divider" style="margin-bottom: 12px; margin-left: -16px; margin-right: -16px;"></div>
        `;
    }

    if (Array.isArray(args)) {
        html += args.map((arg, i) => `<div class="arg-item"><div class="arg-num">${i + 1}</div><div class="arg-text">${escapeHTML(arg)}</div></div>`).join('');
    }
    body.innerHTML = html;

    if (sources && sources.length > 0) {
        sourcesWrap.style.display = 'block';
        sourcesWrap.innerHTML = `
            <div class="divider"></div>
            <div class="sources-label">Sources</div>
            <div class="sources-list">
                ${sources.map(s => `
                    <a class="source-link" href="${escapeHTML(s.url)}" target="_blank">
                        <img class="source-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}&sz=32">
                        ${escapeHTML(s.name)}
                    </a>
                `).join('')}
            </div>
        `;
    }
}

function escapeHTML(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ─── Text Extraction & Limits Logic ─────────────────────────────────────────────
function isArticlePage() {
    if (window.location.pathname.length < 15) return false;
    return !!document.querySelector('article, [itemtype*="NewsArticle"], .article-body, .texto_noticia, .post-content');
}

function extractCleanText() {
    let articleText = "";
    const container = document.querySelector('article, .texto_noticia, .article-body, .post-content, main') || document.body;
    container.querySelectorAll('h1, h2, p').forEach(el => {
        if (el.innerText.trim().length > 60) articleText += el.innerText.trim() + "\n\n";
    });
    return articleText;
}



// ─── Listeners ───────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request) => {
    if ((request.action === "forceReanalyze" || request.action === "analyzeSelection") && shadowRoot) {
        const text = request.action === "forceReanalyze" ? extractCleanText() : request.text;
        
        // Traduz as opções do dropdown na hora
        const t = modeI18n[request.language] || modeI18n['English'];
        shadowRoot.querySelector('#lensMode option[value="counter"]').textContent = t.counter;
        shadowRoot.querySelector('#lensMode option[value="fallacy"]').textContent = t.fallacy;
        shadowRoot.querySelector('#lensMode option[value="factcheck"]').textContent = t.factcheck;

        const body = shadowRoot.querySelector('.body');
        const sourcesWrap = shadowRoot.querySelector('.sources-wrap');
        body.innerHTML = `<div class="loading"><div class="pulse-dot"></div><span class="loading-text">Processing...</span></div>`;
        sourcesWrap.style.display = 'none';

        const currentMode = shadowRoot.querySelector('#lensMode').value;

        chrome.runtime.sendMessage(
            { action: "analyzeText", text: text, language: request.language || 'auto', mode: currentMode },
            (response) => renderResults(response)
        );
    }
});

window.addEventListener('load', () => {
    if (!isArticlePage()) return;
    const text = extractCleanText();
    if (text.length <= 500) return;

    chrome.storage.local.get([SETTINGS_KEY], (result) => {
        const settings = result[SETTINGS_KEY] || {};
        injectPanel(resolveTheme(settings.theme), settings.language);
        checkLimitsAndAnalyze(text, settings.language || 'auto');
    });
});