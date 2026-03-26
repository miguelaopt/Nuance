// popup.js — Nuance v1.4

const SETTINGS_KEY = 'nuanceSettings';
const HISTORY_KEY  = 'nuanceHistory';
const defaults = { theme: 'auto', language: 'auto' };

const extpay = ExtPay('nuance-6746');
let currentUser = null;

// ─── i18n ─────────────────────────────────────────────────────────────────────
const i18n = {
    'auto':       makeDict("Think beyond the headline",   "Appearance", "Language", "Auto", "Light", "Dark", "Deeper thinking for curious minds.", "Upgrade to Pro", ["Unlimited article analyses","Deep fact-check mode","Bias detection score","Multi-source verification","Social share as image"]),
    'English':    makeDict("Think beyond the headline",   "Appearance", "Language", "Auto", "Light", "Dark", "Deeper thinking for curious minds.", "Upgrade to Pro", ["Unlimited article analyses","Deep fact-check mode","Bias detection score","Multi-source verification","Social share as image"]),
    'Portuguese': makeDict("Pensa além do título",        "Aparência",  "Idioma",   "Auto", "Claro","Escuro","Pensamento profundo para mentes curiosas.", "Mudar para Pro", ["Análises ilimitadas","Modo deep fact-check","Pontuação de viés","Verificação multi-fonte","Partilhar como imagem"]),
    'Spanish':    makeDict("Piensa más allá del titular", "Apariencia", "Idioma",   "Auto", "Claro","Oscuro","Pensamiento profundo para mentes curiosas.", "Actualizar a Pro", ["Análisis ilimitados","Modo verificación profunda","Puntuación de sesgo","Verificación multifuente","Compartir como imagen"]),
    'French':     makeDict("Pensez au-delà du titre",     "Apparence",  "Langue",   "Auto", "Clair","Sombre","Réflexion approfondie pour esprits curieux.", "Passer à Pro", ["Analyses illimitées","Mode vérification approfondie","Score de biais","Vérification multi-sources","Partager en image"]),
    'German':     makeDict("Denk über die Schlagzeile hinaus","Erscheinungsbild","Sprache","Auto","Hell","Dunkel","Tiefes Denken für neugierige Köpfe.", "Auf Pro upgraden", ["Unbegrenzte Analysen","Tiefer Faktencheck","Bias-Bewertung","Mehrquellen-Verifikation","Als Bild teilen"]),
    'Italian':    makeDict("Pensa oltre il titolo",       "Aspetto",    "Lingua",   "Auto", "Chiaro","Scuro","Pensiero profondo per menti curiose.", "Passa a Pro", ["Analisi illimitate","Modalità fact-check","Punteggio bias","Verifica multi-fonte","Condividi come immagine"]),
    'Dutch':      makeDict("Denk verder dan de kop",      "Weergave",   "Taal",     "Auto", "Licht","Donker","Diep denken voor nieuwsgierige geesten.", "Upgraden naar Pro", ["Onbeperkte analyses","Diepe factcheck","Bias-score","Multi-bron verificatie","Delen als afbeelding"])
};

function makeDict(tagline, appearance, language, auto, light, dark, proSub, btnUpgrade, feats) {
    return { tagline, appearance, language, auto, light, dark, proSub, btnUpgrade, feats };
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
extpay.getUser()
    .then(user  => { currentUser = user; init(); })
    .catch(() =>  { currentUser = null;  init(); });

function init() {
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const s = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        applyTheme(s.theme);
        applyUI(s);
    });
}

// ─── Apply theme to <html> ────────────────────────────────────────────────────
function applyTheme(themeKey) {
    const htmlEl = document.documentElement;
    htmlEl.className = '';
    if (themeKey === 'dark') {
        htmlEl.classList.add('theme-dark');
    } else if (themeKey === 'light') {
        htmlEl.classList.add('theme-light');
    } else {
        // auto: follow system
        htmlEl.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light');
    }
}

// ─── Apply UI state ───────────────────────────────────────────────────────────
function applyUI(settings) {
    const langKey = settings.language || 'auto';
    const dict    = i18n[langKey] || i18n['English'];

    // Text translations
    document.querySelector('.app-tagline').textContent = dict.tagline;

    const sectionLabels = document.querySelectorAll('.section-label');
    if (sectionLabels[0]) sectionLabels[0].textContent = dict.appearance;
    if (sectionLabels[1]) sectionLabels[1].textContent = dict.language;

    // Theme buttons
    const opts = document.querySelectorAll('.theme-opt');
    opts.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === settings.theme));
    if (opts[0]) opts[0].querySelector('span:last-child').textContent = dict.auto;
    if (opts[1]) opts[1].querySelector('span:last-child').textContent = dict.light;
    if (opts[2]) opts[2].querySelector('span:last-child').textContent = dict.dark;

    // Language dropdown
    const sel = document.getElementById('langSelect');
    if (sel) sel.value = langKey;

    // PRO card: Free vs Pro state
    renderProCard(dict);
}

function renderProCard(dict) {
    const badge    = document.querySelector('.pro-badge');
    const title    = document.querySelector('.pro-title');
    const sub      = document.querySelector('.pro-sub');
    const featsList= document.querySelector('.pro-feats');
    const cta      = document.getElementById('upgradeCta');
    if (!cta) return;

    if (currentUser?.paid) {
        // ── PRO state ──
        badge.textContent = '✦ PRO';
        badge.style.cssText += ';color:#4cd97b;background:rgba(76,217,123,.13);border-color:rgba(76,217,123,.25);';
        title.textContent   = currentUser.email || 'Nuance Pro';
        title.style.fontSize = currentUser.email ? '13px' : '18px';
        title.style.wordBreak = 'break-all';
        sub.textContent   = 'Unlimited access. Thank you for supporting Nuance!';
        featsList.style.display = 'none';
        cta.querySelector('span:first-child').textContent = 'Manage Subscription';
        const priceSpan = cta.querySelector('.pro-price');
        if (priceSpan) priceSpan.style.display = 'none';
        cta.style.background = 'rgba(255,255,255,0.08)';
        cta.style.border = '0.5px solid rgba(255,255,255,0.15)';
    } else {
        // ── Free state ──
        badge.textContent = '✦ FREE';
        badge.style.cssText = '';
        title.textContent  = 'Nuance Pro';
        title.style.fontSize = '18px';
        title.style.wordBreak = '';
        sub.textContent   = dict.proSub;
        featsList.style.display = 'flex';
        featsList.querySelectorAll('li span').forEach((el, i) => {
            if (dict.feats[i]) el.textContent = dict.feats[i];
        });
        cta.querySelector('span:first-child').textContent = dict.btnUpgrade;
        const priceSpan = cta.querySelector('.pro-price');
        if (priceSpan) priceSpan.style.display = '';
        cta.style.background = 'linear-gradient(90deg,#1560d4,#2b86f5)';
        cta.style.border = 'none';
    }
}

// ─── Save setting ─────────────────────────────────────────────────────────────
function saveSetting(patch) {
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const current  = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        const updated  = { ...current, ...patch };
        chrome.storage.local.set({ [SETTINGS_KEY]: updated });
        applyTheme(updated.theme);
        applyUI(updated);
    });
}

// ─── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active');
        });
        const target = document.getElementById(`view-${btn.dataset.tab}`);
        if (target) { target.style.display = 'block'; target.classList.add('active'); }
        if (btn.dataset.tab === 'history') loadHistory();
    });
});

// ─── FEATURE B: History with per-item delete ─────────────────────────────────
function loadHistory() {
    chrome.storage.local.get([HISTORY_KEY], res => {
        const history = res[HISTORY_KEY] || [];
        const list    = document.getElementById('historyList');

        if (history.length === 0) {
            list.innerHTML = `<div class="history-empty">No articles analyzed yet.<br>Browse a news article to get started.</div>`;
            return;
        }

        list.innerHTML = history.map(item => {
            let biasColor = '#34c759';
            if (item.biasScore > 40) biasColor = '#ffcc00';
            if (item.biasScore > 75) biasColor = '#ff3b30';

            const cbDot = item.clickbait ? `<span class="cb-dot" title="Clickbait detected">⚠️</span>` : '';

            return `
                <div class="history-item" data-id="${item.id}" data-url="${escapeAttr(item.url)}">
                    <div class="history-item-info">
                        <div class="history-meta">
                            <span>${item.date}</span>
                            <span style="color:${biasColor}">${item.biasScore}% bias</span>
                            ${cbDot}
                        </div>
                        <div class="history-title">${escapeHTML(item.title)}</div>
                    </div>
                    <button class="del-btn" data-id="${item.id}" title="Delete">✕</button>
                </div>
            `;
        }).join('');

        // Open URL on row click (but not on delete button)
        list.querySelectorAll('.history-item').forEach(row => {
            row.addEventListener('click', e => {
                if (e.target.closest('.del-btn')) return;
                const url = row.dataset.url;
                if (url) chrome.tabs.create({ url });
            });
        });

        // Per-item delete (Feature B)
        list.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id, 10);
                deleteHistoryItem(id);
            });
        });
    });
}

function deleteHistoryItem(id) {
    chrome.storage.local.get([HISTORY_KEY], res => {
        const updated = (res[HISTORY_KEY] || []).filter(h => h.id !== id);
        chrome.storage.local.set({ [HISTORY_KEY]: updated }, loadHistory);
    });
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => saveSetting({ theme: btn.dataset.theme }));
});

document.getElementById('langSelect').addEventListener('change', e => {
    const lang = e.target.value;
    saveSetting({ language: lang });

    // Tell active tab to re-analyze in new language
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "forceReanalyze", language: lang })
                .catch(() => {}); // Silently ignore if no content script active
        }
    });
});

document.getElementById('upgradeCta').addEventListener('click', () => {
    extpay.openPaymentPage();
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('Clear your entire reading history?')) {
        chrome.storage.local.set({ [HISTORY_KEY]: [] }, loadHistory);
    }
});

// ─── Utils ────────────────────────────────────────────────────────────────────
function escapeHTML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escapeAttr(s) {
    return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}