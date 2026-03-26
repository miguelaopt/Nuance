// popup.js

const SETTINGS_KEY = 'nuanceSettings';
const defaults = { theme: 'auto', language: 'auto' };

// Inicia o ExtensionPay
const extpay = ExtPay('nuance-6746');
let currentUser = null; // Vamos guardar o utilizador aqui

// Dicionário de Traduções do UI
const i18n = {
    'auto': { appTagline: "Think beyond the headline", appearance: "Appearance", language: "Language", auto: "Auto", light: "Light", dark: "Dark", proSub: "Deeper thinking for curious minds.", btnUpgrade: "Upgrade to Pro", feats: ["Unlimited article analyses", "Deep fact-check mode", "Bias detection score", "Multi-source verification", "Export analysis as PDF"] },
    'English': { appTagline: "Think beyond the headline", appearance: "Appearance", language: "Language", auto: "Auto", light: "Light", dark: "Dark", proSub: "Deeper thinking for curious minds.", btnUpgrade: "Upgrade to Pro", feats: ["Unlimited article analyses", "Deep fact-check mode", "Bias detection score", "Multi-source verification", "Export analysis as PDF"] },
    'Portuguese': { appTagline: "Pensa além do título", appearance: "Aparência", language: "Idioma", auto: "Auto", light: "Claro", dark: "Escuro", proSub: "Pensamento profundo para mentes curiosas.", btnUpgrade: "Mudar para Pro", feats: ["Análises de artigos ilimitadas", "Modo deep fact-check", "Pontuação de viés", "Verificação multi-fonte", "Exportar análise em PDF"] },
    // (Podes manter as outras línguas aqui se quiseres, encurtei para o exemplo focar no Pro)
    'Spanish': { appTagline: "Piensa más allá del titular", appearance: "Apariencia", language: "Idioma", auto: "Auto", light: "Claro", dark: "Oscuro", proSub: "Pensamiento profundo para mentes curiosas.", btnUpgrade: "Actualizar a Pro", feats: ["Análisis de artículos ilimitados", "Modo de verificación profunda", "Puntuación de sesgo", "Verificación multifuente", "Exportar análisis en PDF"] }
};

// 1. CARREGA O UTILIZADOR DO SERVIDOR PRIMEIRO
extpay.getUser().then(user => {
    currentUser = user; // Guarda se pagou e o email
    
    // Agora que sabemos quem é, renderizamos a interface
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const s = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        applyToUI(s);
    });
}).catch(err => {
    // Se não houver net, desenha a interface base
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const s = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        applyToUI(s);
    });
});

function applyToUI(settings) {
    const htmlEl = document.documentElement;
    htmlEl.className = ''; 
    
    if (settings.theme === 'dark') htmlEl.classList.add('theme-dark');
    else if (settings.theme === 'light') htmlEl.classList.add('theme-light');
    else {
        const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlEl.classList.add(isSysDark ? 'theme-dark' : 'theme-light');
    }

    document.querySelectorAll('.theme-opt').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });

    const sel = document.getElementById('langSelect');
    if (sel) sel.value = settings.language || 'auto';

    // TRADUÇÃO BASE
    const langKey = settings.language || 'auto';
    const dict = i18n[langKey] || i18n['English'];
    
    document.querySelector('.app-tagline').textContent = dict.appTagline;
    document.querySelectorAll('.section-label')[0].textContent = dict.appearance;
    document.querySelectorAll('.section-label')[1].textContent = dict.language;
    
    const themeTextElements = document.querySelectorAll('.theme-opt');
    themeTextElements[0].lastChild.textContent = ' ' + dict.auto;
    themeTextElements[1].lastChild.textContent = ' ' + dict.light;
    themeTextElements[2].lastChild.textContent = ' ' + dict.dark;
    
    const badge = document.querySelector('.pro-badge');
    const title = document.querySelector('.pro-title');
    const sub = document.querySelector('.pro-sub');
    const feats = document.querySelector('.pro-feats');
    const cta = document.getElementById('upgradeCta');
    const priceSpan = cta.querySelector('.pro-price');

    // ─── LÓGICA DE CONTA: FREE vs PRO ───
    if (currentUser && currentUser.paid) {
        // ESTADO PRO: O utilizador pagou!
        badge.textContent = "PRO";
        badge.style.color = "#4cd97b"; // Fica verde
        badge.style.background = "rgba(76, 217, 123, 0.13)";
        badge.style.borderColor = "rgba(76, 217, 123, 0.22)";
        
        // Mostra o email. Se não existir, mostra "Pro Member"
        title.textContent = currentUser.email || "Nuance Pro Member";
        title.style.fontSize = currentUser.email ? "13px" : "18px"; 
        title.style.wordBreak = "break-all";
        
        sub.textContent = "Unlimited access unlocked. Thank you for supporting Nuance!";
        feats.style.display = "none"; // Esconde a lista de vendas
        
        // Transforma o botão de "Comprar" num botão de "Gerir Conta"
        cta.querySelector('span:first-child').textContent = "Manage Subscription";
        if(priceSpan) priceSpan.style.display = "none";
        cta.style.background = "rgba(255,255,255,0.1)"; // Botão cinzento discreto
    } else {
        // ESTADO FREE: O utilizador ainda não pagou
        badge.textContent = "FREE";
        title.textContent = "Nuance Pro";
        title.style.fontSize = "18px";
        sub.textContent = dict.proSub;
        feats.style.display = "flex"; // Mostra os motivos para comprar
        
        cta.querySelector('span:first-child').textContent = dict.btnUpgrade;
        if(priceSpan) priceSpan.style.display = "block";
        cta.style.background = "linear-gradient(90deg, #1560d4, #2b86f5)"; // Botão azul chamativo
        
        // Traduz a lista de benefícios
        const featItems = document.querySelectorAll('.pro-feats li');
        dict.feats.forEach((featText, index) => {
            if (featItems[index]) featItems[index].lastChild.nodeValue = " " + featText;
        });
    }
}

function saveSetting(patch) {
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const current = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        const newSettings = { ...current, ...patch };
        chrome.storage.local.set({ [SETTINGS_KEY]: newSettings });
        applyToUI(newSettings); 
    });
}

// ─── Lógica das Tabs (Settings vs History) ───
document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById(`view-${e.target.dataset.tab}`).style.display = 'block';
        if (e.target.dataset.tab === 'history') loadHistory();
    });
});

function loadHistory() {
    chrome.storage.local.get(['nuanceHistory'], (res) => {
        const history = res.nuanceHistory || [];
        const list = document.getElementById('historyList');
        if (history.length === 0) {
            list.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 12px;">No articles analyzed yet.</div>`;
            return;
        }
        list.innerHTML = history.map(item => {
            let color = '#34c759'; if (item.biasScore > 40) color = '#ffcc00'; if (item.biasScore > 75) color = '#ff3b30';
            return `<a href="${item.url}" target="_blank" class="history-item"><div class="history-meta">${item.date} &nbsp;•&nbsp; Bias: <span style="color: ${color};">${item.biasScore}%</span></div><div class="history-title">${item.title}</div></a>`;
        }).join('');
    });
}

// ─── Event Listeners ───
document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => saveSetting({ theme: btn.dataset.theme }));
});

document.getElementById('langSelect').addEventListener('change', e => {
    const newLang = e.target.value;    
    saveSetting({ language: newLang });

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "forceReanalyze", language: newLang }).catch(err => {}); 
    });
});

// O Botão agora abre SEMPRE a janela do ExtensionPay (eles gerem o Login e o Pagamento)
document.getElementById('upgradeCta').addEventListener('click', () => {
    extpay.openPaymentPage();
});