// background.js - O Cérebro do Nuance

console.log("🧠 Background Service Worker a iniciar...");

// Tenta carregar as chaves do cofre
try {
    importScripts('env.js');
    console.log("🔐 Coordenadas do cofre (env.js) carregadas.");
} catch (e) {
    console.error("❌ ERRO CRÍTICO: Não consegui encontrar o ficheiro env.js!", e);
}

// Ouvir mensagens vindas do content.js
// background.js

// Ouve a mensagem e decide o que fazer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Mensagem recebida:", request.action);

    if (request.action === "analyzeText") {
        // Executamos a função mas retornamos TRUE imediatamente para manter o canal
        handleAsyncRequest(request.text, sendResponse);
        return true; 
    }
});

async function handleAsyncRequest(text, sendResponse) {
    try {
        console.log("🤖 A pedir argumentos ao Groq...");
        const result = await askGroq(text);
        console.log("✅ Sucesso!");
        sendResponse({ success: true, arguments: result });
    } catch (error) {
        console.error("❌ Erro:", error.message);
        sendResponse({ success: false, error: error.message });
    }
}

// A função askGroq mantém-se como estava (aquela que cortámos o texto para 3000 chars)
async function askGroq(articleText) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const cleanedText = articleText.substring(0, 3000);
    const systemPrompt = "Provide 3 short, diverse counter-arguments. Use bullet points. Same language as the article.";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze:\n\n${cleanedText}` }
            ],
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ? errorData.error.message : "Groq Error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function handleAnalysis(text, sendResponse) {
    try {
        console.log("🤖 A chamar a API do Groq...");
        const result = await askGroq(text);
        console.log("✅ Resposta da IA recebida com sucesso.");
        sendResponse({ success: true, arguments: result });
    } catch (error) {
        console.error("❌ Erro na análise:", error.message);
        sendResponse({ success: false, error: error.message });
    }
}

async function askGroq(articleText) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    if (typeof ENV === 'undefined' || !ENV.GROQ_API_KEY) {
        throw new Error("API Key não encontrada no env.js");
    }

    // LIMPEZA: Cortar o texto para os primeiros 3000 caracteres 
    // para evitar o erro 400 de "Too Many Tokens" no plano grátis
    const cleanedText = articleText.substring(0, 3000);

    const systemPrompt = "You are 'Nuance'. Provide 3 short, logical counter-arguments to the text. Use bullet points. Respond in the same language as the article.";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ENV.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            // MODELO: Vamos usar o Versatile que é mais estável
            model: "llama-3.3-70b-versatile", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze:\n\n${cleanedText}` }
            ],
            temperature: 0.2
        })
    });

    if (!response.ok) {
        // Vamos ver o erro real no log antes de disparar a exceção
        const errorBody = await response.json();
        console.error("DETALHE DO ERRO 400:", errorBody);
        throw new Error(`Groq API Error: ${response.status} - ${errorBody.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}