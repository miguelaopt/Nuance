// content.js - Nuance

console.log("☯️ Nuance ativo (English default).");

// --- Fase 2: Lógica de Extração ---
function extractCleanText() {
    let articleText = "";
    const articleElement = document.querySelector('article');
    
    if (articleElement) {
        const paragraphs = articleElement.querySelectorAll('p');
        paragraphs.forEach(p => {
            if (p.innerText.trim().length > 40) {
                articleText += p.innerText.trim() + "\n\n";
            }
        });
    } else {
        const allParagraphs = document.querySelectorAll('p');
        allParagraphs.forEach(p => {
            if (p.innerText.trim().length > 100) {
                articleText += p.innerText.trim() + "\n\n";
            }
        });
    }
    return articleText;
}

// --- Fase 3/4: Preparação da UI (Apple-like + Shadow DOM) ---

// Esta variável vai guardar a referência para o nosso painel isolado
let nuancePanel = null;

function injectNuanceUI() {
    // Se já existir, não criar de novo
    if (document.getElementById('nuance-container')) return;

    // 1. Criar o contentor principal na página
    const container = document.createElement('div');
    container.id = 'nuance-container';
    
    // Posicionamento base do contentor (fixo no canto)
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647; /* Valor máximo possível para garantir que fica por cima de tudo */
    `;
    
    document.body.appendChild(container);

    // 2. Criar o Shadow DOM (a "bolha" isolada)
    const shadow = container.attachShadow({ mode: 'open' });

    // 3. Injetar o CSS minimalista estilo Apple (Squircles, sombras suaves, etc.)
    const styles = document.createElement('style');
    styles.textContent = `
        :host {
            all: initial; /* Reseta todos os estilos herdados da página */
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .nuance-card {
            background-color: rgba(255, 255, 255, 0.85); /* Efeito translúcido Apple */
            backdrop-filter: blur(20px) saturate(180%); /* Blur de fundo */
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            
            /* SQUIRCLE: Usamos border-radius elevado e padding proporcional */
            border-radius: 20px; 
            
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); /* Sombra suave */
            
            width: 320px;
            padding: 20px;
            box-sizing: border-box;
            opacity: 1;
            transition: opacity 0.3s ease;
        }

        .nuance-header {
            font-size: 13px;
            font-weight: 600;
            color: rgba(0, 0, 0, 0.5); /* Texto secundário Apple */
            margin-bottom: 12px;
            letter-spacing: -0.1px;
        }

        .nuance-content {
            font-size: 15px;
            line-height: 1.4;
            color: #1d1d1f; /* Cor de texto padrão Apple */
        }
        
        .loading-dots {
            font-style: italic;
            color: rgba(0, 0, 0, 0.7);
        }
    `;
    shadow.appendChild(styles);

    // 4. Criar a estrutura HTML do card
    const card = document.createElement('div');
    card.className = 'nuance-card';
    
    // Mock-up do conteúdo (Fase 3/4)
    card.innerHTML = `
        <div class="nuance-header">NUANCE</div>
        <div class="nuance-content">
            <span class="loading-dots">Analyzing article...</span>
        </div>
    `;

    shadow.appendChild(card);
    nuancePanel = card;
}

// Vamos testar a injeção do UI mal a página carregue, para vermos o design
// (Mais tarde, isto só ativa quando a IA responder)
window.addEventListener('load', () => {
    const text = extractCleanText();
    if (text.length > 500) { // Só injeta se parecer ser um artigo real
        injectNuanceUI();
        console.log("✅ Artigo detetado. UI do Nuance injetado (Apple-like structure).");
    }
});