import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// ==========================================
// OFUSCAÇÃO DE CHAVES
// ==========================================
const API_KEY_IA = atob('Z3NrX0pJM24waTlp' + 'ZE9tMW1ScHJTSDN3' + 'V0dkeWIzRlk4QmdV' + 'OHVzVXVmY2JRajlU' + 'bTZmdk5WbXY='); 
const FIREBASE_CONFIG = {
    apiKey: atob('QUl6YVN5QURkTE4w' + 'Zl8wSFRzRTVOSTNI' + 'UHRoSnFfZEY3WUlP' + 'THpF'),
    authDomain: "peipeipei-36a49.firebaseapp.com",
    projectId: "peipeipei-36a49",
    storageBucket: "peipeipei-36a49.firebasestorage.app",
    messagingSenderId: "931401419828",
    appId: "1:931401419828:web:608406806e52d82e01ce61"
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
let alunosCache = [];

// Modelos Groq em ordem de preferência. A Groq descontinuou os modelos Llama
// (llama3-70b-8192, llama-3.3-70b-versatile, llama-3.1-8b-instant) para contas gratuitas/developer.
// Se um modelo falhar com "não existe", o código tenta automaticamente o próximo.
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

// Extrai o JSON mesmo que a IA envolva a resposta em ```json ... ``` ou texto extra
function extrairJSON(txt) {
    try { return JSON.parse(txt); } catch (_) {}
    const limpo = txt.replace(/```json|```/gi, '').trim();
    const ini = limpo.indexOf('{'), fim = limpo.lastIndexOf('}');
    if (ini === -1 || fim === -1) throw new Error("A IA não devolveu um JSON válido.");
    return JSON.parse(limpo.slice(ini, fim + 1));
}

async function chamarGroq(messages) {
    let ultimoErro;
    for (const model of GROQ_MODELS) {
        const conteudoIA = await chamarGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Gere o PEI em formato JSON para o estudante ${aluno.nome} (${aluno.serie}), na disciplina de ${disciplina}.` }
        ]);
        const bruto = extrairJSON(conteudoIA);
        const peiGerado = {};
        ["historico", "habilidades", "barreiras", "objetivos", "metodologias", "avaliacao", "parecer"]
            .forEach(k => peiGerado[k] = paraTexto(bruto[k]));

        // Injeção de Dados no Layout de Impressão (PDF)
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        document.getElementById('print-nome').innerText = aluno.nome;
        document.getElementById('print-serie').innerText = aluno.serie;
        document.getElementById('print-diags').innerText = diagsString;
        document.getElementById('print-disciplina').innerText = disciplina;
        document.getElementById('print-data').innerText = dataAtual;

        document.getElementById('print-historico').innerText = peiGerado.historico || conteudos;
        document.getElementById('print-habilidades').innerText = peiGerado.habilidades;
        document.getElementById('print-barreiras').innerText = peiGerado.barreiras;
        document.getElementById('print-conteudos-out').innerText = conteudos;
        document.getElementById('print-objetivos').innerText = peiGerado.objetivos;
        document.getElementById('print-metodologias').innerText = peiGerado.metodologias;
        document.getElementById('print-avaliacao').innerText = peiGerado.avaliacao;
        document.getElementById('print-parecer').innerText = peiGerado.parecer;

        document.getElementById('resultado-pei').style.display = 'block';
        showToast("Documento estruturado para impressão!", "success");

    } catch (e) { 
        console.error(e);
        showToast("Erro na IA: " + e.message, "error"); 
    }
    finally { btnGerar.disabled = false; btnGerar.innerHTML = '<i class="fas fa-magic"></i> Gerar PEI da Disciplina com IA'; }
});

document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

function showToast(msg, type = 'info') {
    const t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}

// Inicializações
inicializarTranstornos();
carregarAlunos();
