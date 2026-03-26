// popup.js

const SETTINGS_KEY = 'nuanceSettings';
const defaults = { theme: 'auto', language: 'auto' };

// Dicionário de Traduções do UI
const i18n = {
    'auto': { appTagline: "Think beyond the headline", appearance: "Appearance", language: "Language", auto: "Auto", light: "Light", dark: "Dark", proSub: "Deeper thinking for curious minds.", btnUpgrade: "Upgrade to Pro", feats: ["Unlimited article analyses", "Deep fact-check mode", "Bias detection score", "Multi-source verification", "Export analysis as PDF"] },
    'English': { appTagline: "Think beyond the headline", appearance: "Appearance", language: "Language", auto: "Auto", light: "Light", dark: "Dark", proSub: "Deeper thinking for curious minds.", btnUpgrade: "Upgrade to Pro", feats: ["Unlimited article analyses", "Deep fact-check mode", "Bias detection score", "Multi-source verification", "Export analysis as PDF"] },
    'Portuguese': { appTagline: "Pensa além do título", appearance: "Aparência", language: "Idioma", auto: "Auto", light: "Claro", dark: "Escuro", proSub: "Pensamento profundo para mentes curiosas.", btnUpgrade: "Mudar para Pro", feats: ["Análises de artigos ilimitadas", "Modo deep fact-check", "Pontuação de viés", "Verificação multi-fonte", "Exportar análise em PDF"] },
    'Spanish': { appTagline: "Piensa más allá del titular", appearance: "Apariencia", language: "Idioma", auto: "Auto", light: "Claro", dark: "Oscuro", proSub: "Pensamiento profundo para mentes curiosas.", btnUpgrade: "Actualizar a Pro", feats: ["Análisis de artículos ilimitados", "Modo de verificación profunda", "Puntuación de sesgo", "Verificación multifuente", "Exportar análisis en PDF"] },
    'French': { appTagline: "Pensez au-delà du titre", appearance: "Apparence", language: "Langue", auto: "Auto", light: "Clair", dark: "Sombre", proSub: "Une réflexion approfondie pour les curieux.", btnUpgrade: "Passer à Pro", feats: ["Analyses d'articles illimitées", "Mode vérification approfondie", "Score de détection de biais", "Vérification multi-sources", "Exporter l'analyse en PDF"] },
    'German': { appTagline: "Denke über die Schlagzeile hinaus", appearance: "Erscheinungsbild", language: "Sprache", auto: "Auto", light: "Hell", dark: "Dunkel", proSub: "Tiefes Denken für neugierige Köpfe.", btnUpgrade: "Auf Pro upgraden", feats: ["Unbegrenzte Artikelanalysen", "Tiefer Faktencheck-Modus", "Voreingenommenheits-Score", "Multi-Quellen-Verifizierung", "Analyse als PDF exportieren"] },
    'Italian': { appTagline: "Pensa oltre il titolo", appearance: "Aspetto", language: "Lingua", auto: "Auto", light: "Chiaro", dark: "Scuro", proSub: "Pensiero profondo per menti curiose.", btnUpgrade: "Passa a Pro", feats: ["Analisi di articoli illimitate", "Modalità fact-check profondo", "Punteggio di rilevamento bias", "Verifica multi-fonte", "Esporta analisi in PDF"] },
    'Dutch': { appTagline: "Denk verder dan de kop", appearance: "Uiterlijk", language: "Taal", auto: "Auto", light: "Licht", dark: "Donker", proSub: "Dieper nadenken voor nieuwsgierige geesten.", btnUpgrade: "Upgrade naar Pro", feats: ["Onbeperkte artikelanalyses", "Diepe factcheck-modus", "Vooringenomenheidsscore", "Multi-bron verificatie", "Analyse exporteren als PDF"] }
};

chrome.storage.local.get([SETTINGS_KEY], result => {
    const s = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
    applyToUI(s);
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

    // TRADUÇÃO
    const langKey = settings.language || 'auto';
    const dict = i18n[langKey] || i18n['English'];
    
    document.querySelector('.app-tagline').textContent = dict.appTagline;
    document.querySelectorAll('.section-label')[0].textContent = dict.appearance;
    document.querySelectorAll('.section-label')[1].textContent = dict.language;
    
    const themeTextElements = document.querySelectorAll('.theme-opt');
    themeTextElements[0].lastChild.textContent = ' ' + dict.auto;
    themeTextElements[1].lastChild.textContent = ' ' + dict.light;
    themeTextElements[2].lastChild.textContent = ' ' + dict.dark;
    
    document.querySelector('.pro-sub').textContent = dict.proSub;
    document.querySelector('#upgradeCta span:first-child').textContent = dict.btnUpgrade;

    const featItems = document.querySelectorAll('.pro-feats li');
    dict.feats.forEach((featText, index) => {
        if (featItems[index]) {
            featItems[index].lastChild.nodeValue = " " + featText;
        }
    });
}

function saveSetting(patch) {
    chrome.storage.local.get([SETTINGS_KEY], result => {
        const current = { ...defaults, ...(result[SETTINGS_KEY] || {}) };
        const newSettings = { ...current, ...patch };
        chrome.storage.local.set({ [SETTINGS_KEY]: newSettings });
        applyToUI(newSettings); 
    });
}

// ─── Lógica das Tabs (Settings vs History) ────────────────────────────────────
document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Muda o visual dos botões
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Esconde tudo e mostra a tab certa
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById(`view-${e.target.dataset.tab}`).style.display = 'block';

        // Se clicou no histórico, carrega os dados
        if (e.target.dataset.tab === 'history') {
            loadHistory();
        }
    });
});

function loadHistory() {
    chrome.storage.local.get(['nuanceHistory'], (res) => {
        const history = res.nuanceHistory || [];
        const list = document.getElementById('historyList');
        
        if (history.length === 0) {
            list.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 12px;">No articles analyzed yet.<br>Go read some news!</div>`;
            return;
        }

        list.innerHTML = history.map(item => {
            let color = '#34c759'; // Verde
            if (item.biasScore > 40) color = '#ffcc00'; // Amarelo
            if (item.biasScore > 75) color = '#ff3b30'; // Vermelho

            return `
                <a href="${item.url}" target="_blank" class="history-item">
                    <div class="history-meta">
                        ${item.date} &nbsp;•&nbsp; Bias: <span style="color: ${color};">${item.biasScore}%</span>
                    </div>
                    <div class="history-title">${item.title}</div>
                </a>
            `;
        }).join('');
    });
}

// Event Listeners
document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => saveSetting({ theme: btn.dataset.theme }));
});

document.getElementById('langSelect').addEventListener('change', e => {
    const newLang = e.target.value;    
    saveSetting({ language: newLang });

    // Envia ordem para a aba ativa traduzir os argumentos na hora
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "forceReanalyze", language: newLang })
                .catch(err => console.log("Nuance: Aguardando por uma página de artigo válida.")); 
        }
    });

    const cta = document.getElementById('upgradeCta');
    const oldHtml = cta.innerHTML;
    cta.innerHTML = `<span style="text-align:center; width:100%;">🔄 Translating...</span>`;
    setTimeout(() => cta.innerHTML = oldHtml, 2000);
});

document.getElementById('upgradeCta').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://nuance.app/pro' });
});