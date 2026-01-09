function emparelharJogadores(jogadores) {
    // Ordena do maior para o menor
    let lista = [...jogadores].sort((a, b) => b.rating - a.rating);

    let pares = [];
    let usados = new Set();

    for (let i = 0; i < lista.length; i++) {
        if (usados.has(i)) continue;

        let melhorIdx = -1;
        let melhorDiff = Infinity;

        // Procura adversário com menor diferença de rating
        for (let j = i + 1; j < lista.length; j++) {
            if (usados.has(j)) continue;

            let diff = Math.abs(lista[i].rating - lista[j].rating);

            if (diff <= 400 && diff < melhorDiff) {
                melhorDiff = diff;
                melhorIdx = j;
            }
        }

        if (melhorIdx !== -1) {
            usados.add(i);
            usados.add(melhorIdx);
            pares.push([lista[i], lista[melhorIdx]]);
        }
    }

    return pares;
}
// ---------- DADOS ----------
const ESTADO_VERSAO = 1;

let estado = {
    versao: ESTADO_VERSAO,

    jogadores: [],
    confrontosManuais: [],

    winners: [],
    losers: [],

    losersQueue: [],
    losersHistorico: [],

    finalistaW: null,
    finalistaL: null,

    modo: "",
    resetMatch: false,

    banidos: [],
    eliminadosLosers: []
};


// ---------- SALVAR ----------
function salvarEstado() {
    localStorage.setItem("torneio", JSON.stringify(estado));
}




function carregarEstado() {
    const raw = localStorage.getItem("torneio");
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        if (data.versao === ESTADO_VERSAO) {
            estado = { ...estado, ...data };
        }
    } catch {
        console.warn("Estado inválido");
    }
}
// ---------- CARREGAR AO INICIAR ----------
window.onload = () => {
    carregarEstado();
    normalizarEstado();
    renderTudo();
};

// ---------- CADASTRO ----------
function tecla(e) {
    if (e.key === "Enter") {
        addJogador(); // dispara o botão
    }
}

function addJogador() {
    let nome = document.getElementById("nomeJogador").value.trim();
    let rating = parseInt(document.getElementById("ratingJogador").value);

    if (!nome) return alert("Digite o nome!");
    if (isNaN(rating)) rating = 0;

    if (estado.jogadores.some(j => j.nome === nome))
        return alert("Jogador já existe!");

    document.getElementById("nomeJogador").value = "";
    document.getElementById("ratingJogador").value = "";
    document.getElementById("nomeJogador").focus();

    estado.jogadores.push({ nome, rating });
    salvarEstado();
    renderTudo();





}


function renderJogadores() {
    document.getElementById("listaJogadores").innerHTML =
        estado.jogadores
            .map(j => `
                <li>
                    ${j.nome} — Rating: ${j.rating}
                   
                </li>
            `)
            .join("");
}



// ---------- RATING / SEEDING ----------
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function seedPorRating(jogs, randomizaEmpates = true) {
    let copia = jogs.map(j => ({ ...j }));

    if (randomizaEmpates) {
        let grupos = {};
        copia.forEach(j => {
            if (!grupos[j.rating]) grupos[j.rating] = [];
            grupos[j.rating].push(j);
        });

        let notas = Object.keys(grupos).map(r => parseInt(r)).sort((a, b) => b - a);
        let resultado = [];
        notas.forEach(r => {
            resultado = resultado.concat(shuffle(grupos[r]));
        });
        return resultado;
    }

    return copia.sort((a, b) => b.rating - a.rating);
}

function criarParesOrdenados(lista) {
    let vetor = [];
    let n = lista.length;

    for (let i = 0; i < Math.floor(n / 2); i++) {
        vetor.push({
            p1: lista[i].nome,
            p2: lista[n - 1 - i].nome
        });
    }

    if (n % 2 === 1) {
        vetor.push({
            p1: lista[Math.floor(n / 2)].nome,
            p2: "BYE"
        });
    }

    return vetor;
}
// ---------- MODO MANUAL ----------
function modoManual() {
    estado.modo = "manual";
    document.getElementById("manualArea").style.display = "block";
    atualizarSelects();
    salvarEstado();
}

function addManual() {
    let A = document.getElementById("selA").value;
    let B = document.getElementById("selB").value;

    if (A === B) return alert("Jogadores iguais!");

    estado.confrontosManuais.push({ p1: A, p2: B });
    renderManuais();
    salvarEstado();
}

function renderManuais() {
    document.getElementById("listaManuais").innerHTML =
        estado.confrontosManuais.map(c => `<li>${c.p1} vs ${c.p2}</li>`).join("");
}

function iniciarManual() {
    if (estado.confrontosManuais.length === 0) return alert("Sem confrontos!");
    estado.winners = estado.confrontosManuais.map(c => ({ ...c }));
    iniciarTorneio();
}

// ---------- SORTEIO ----------
function gerarAutomatico() {
    estado.modo = "sorteio";

    if (estado.jogadores.length < 2) return alert("Poucos jogadores!");

    let emb = [...estado.jogadores].sort(() => Math.random() - 0.5);

    estado.winners = [];
    for (let i = 0; i < emb.length; i += 2) {
        estado.winners.push({
            p1: emb[i].nome,
            p2: emb[i + 1] ? emb[i + 1].nome : "BYE"

        });
    }
    let poupLoser = document.getElementById('popupLosersConteudo')
    poupLoser.innerHTML = ''
    iniciarTorneio();
}
function iniciarPorRating() {
    if (estado.jogadores.length < 2) return alert("Poucos jogadores!");

    estado.modo = "rating";

    // Ordena do maior pro menor rating
    let lista = [...estado.jogadores].sort((a, b) => b.rating - a.rating);

    // ---------- EMPARELHAMENTO (400 + fallback) ----------
    let usados = new Set();
    let pares = [];

    for (let i = 0; i < lista.length; i++) {
        if (usados.has(i)) continue;

        let melhor = null;
        let melhorDif = Infinity;

        // 1° tentar encontrar alguém com diferença <= 400
        for (let j = i + 1; j < lista.length; j++) {
            if (usados.has(j)) continue;

            let dif = Math.abs(lista[i].rating - lista[j].rating);

            if (dif <= 400 && dif < melhorDif) {
                melhorDif = dif;
                melhor = j;
            }
        }

        // 2° fallback: pegar o mais próximo possível
        if (melhor === null) {
            for (let j = i + 1; j < lista.length; j++) {
                if (usados.has(j)) continue;

                let dif = Math.abs(lista[i].rating - lista[j].rating);

                if (dif < melhorDif) {
                    melhorDif = dif;
                    melhor = j;
                }
            }
        }

        // Criar par
        if (melhor !== null) {
            usados.add(i);
            usados.add(melhor);

            pares.push({
                p1: lista[i].nome,
                p2: lista[melhor].nome
            });
        }
    }

    // BYE somente se número for ímpar
    if (lista.length % 2 === 1) {
        for (let i = 0; i < lista.length; i++) {
            if (!usados.has(i)) {
                pares.push({
                    p1: lista[i].nome,
                    p2: "BYE"
                });
                break;
            }
        }
    }

    estado.winners = pares;
    iniciarTorneio();
}






// ---------- INICIAR TORNEIO ----------
function iniciarTorneio() {
    estado.losers = [];
    estado.finalistaL = null;
    estado.finalistaW = null;
    estado.losersSeeded = false;

    estado.resetMatch = false;
    estado.confrontosManuais = [];

    renderWinners();
    renderLosers();
    document.getElementById("final").innerHTML = "";

    salvarEstado();
}

// ---------- WINNERS ----------
const WO = "__WO__";

function avancarWinners() {

    const vencedores = estado.winners
        .filter(m => m.winner && m.winner !== WO)
        .map(m => m.winner);

    if (vencedores.length === 0) {
        // todos WO → ninguém avança
        estado.finalistaW = null;
        iniciarLosers();
        return;
    }

    if (vencedores.length === 1) {
        estado.finalistaW = vencedores[0];
        iniciarLosers();
        return;
    }

    const novaRodada = [];

    for (let i = 0; i < vencedores.length; i += 2) {
        novaRodada.push({
            p1: vencedores[i],
            p2: vencedores[i + 1] ?? "BYE",
            winner: null
        });
    }

    estado.winners = novaRodada;
}



//WO
function woW(i) {
    const partida = estado.winners[i];

    if (!partida || partida.winner !== null) return;

    // envia os dois jogadores para o losers
    [partida.p1, partida.p2].forEach(j => {
        if (j && j !== "BYE") {
            if (!estado.losersQueue.includes(j)) estado.losersQueue.push(j);
            if (!estado.losersHistorico.includes(j)) estado.losersHistorico.push(j);
        }
    });

    // marca corretamente como WO
    partida.winner = WO;

    if (estado.winners.every(m => m.winner !== null)) {
        avancarWinners();
    }

    renderWinners();
    salvarEstado();
}
function woL(i) {
    const partida = estado.losers[i];
    if (!partida || partida.winner !== null) return;

    partida.winner = WO;

    [partida.p1, partida.p2].forEach(j => {
        if (
            j &&
            j !== "BYE" &&
            !estado.eliminadosLosers.includes(j)
        ) {
            estado.eliminadosLosers.push(j);
        }
    });

    localStorage.setItem(
        "eliminadosLosers",
        JSON.stringify(estado.eliminadosLosers)
    );

    if (estado.losers.every(m => m.winner !== null)) {
        avancarLosers();
    }

    renderLosers();
    salvarEstado();
}

function enviarParaLosers(nome) {
    if (!estado.losersQueue.includes(nome)) {
        estado.losersQueue.push(nome);
    }
    if (!estado.losersHistorico.includes(nome)) {
        estado.losersHistorico.push(nome);
    }
}
enviarParaLosers(perdedor);
renderTudo


function normalizarEstado() {

    estado.jogadores ??= [];
    estado.winners ??= [];
    estado.losers ??= [];

    estado.losersQueue ??= [];
    estado.losersHistorico ??= [];

    estado.banidos ??= [];
    estado.eliminadosLosers ??= [];

    estado.winners.forEach(m => {
        if (!("winner" in m)) m.winner = null;
    });

    estado.losers.forEach(m => {
        if (!("winner" in m)) m.winner = null;
    });
}


// ---------- LOSERS (CORRIGIDO) ----------
function getRating(nome) {
    const j = estado.jogadores.find(j => j.nome === nome);
    return j ? j.rating : 0;
}

// Entra perdedor na fila sem duplicar
function vencedorW(i, nome) {
   const partida = estado.winners[i];
   const perdedor = partida.p1 === nome ? partida.p2 : partida.p1;
    if (!estado.winners[i] || estado.winners[i].winner) return;
   
if (perdedor !== "BYE") {
    if (!estado.losersQueue.includes(perdedor)) {
        estado.losersQueue.push(perdedor);
    }
    if (!estado.losersHistorico.includes(perdedor)) {
        estado.losersHistorico.push(perdedor);
    }
}



    partida.winner = nome;

    let caixa = document.getElementById("w_partida_" + i);
    if (caixa) {
        caixa.querySelector(".resultadoW").innerHTML =
            `<strong>Vencedor: ${nome}</strong>`;
    }

    if (estado.winners.every(m => m.winner)) {
        avancarWinners();
    }


salvarEstado();
renderTudo();
}
function renderWinners() {
    const container = document.getElementById("winners");
    container.innerHTML = "";

    estado.winners.forEach((partida, index) => {
estado.winners.forEach(m => {
    if (m.winner !== null && m.winner !== "__WO__" && typeof m.winner !== "string") {
        m.winner = null;
    }
});

        // GARANTIA DE ESTADO (crítico)
        if (partida.winner === undefined) {
            partida.winner = null;
        }

        const div = document.createElement("div");
        div.className = "match";

        const p1 = document.createElement("button");
        p1.textContent = partida.p1;
        p1.disabled = partida.winner !== null || partida.p1 === "BYE";
        p1.onclick = () => vencedorW(index, partida.p1);

        const p2 = document.createElement("button");
        p2.textContent = partida.p2;
        p2.disabled = partida.winner !== null || partida.p2 === "BYE";
        p2.onclick = () => vencedorW(index, partida.p2);

        const wo = document.createElement("button");
        wo.textContent = "WO";
        wo.disabled = partida.winner !== null;
        wo.onclick = () => woW(index);

        const status = document.createElement("span");
        status.className = "status";

        if (partida.winner === WO) {
            status.innerHTML = "WO";
        } else if (partida.winner) {
            status.innerHTML = `<div class='match'>Vencedor: ${partida.winner}</div>`;
        } else {
            status.innerHTML = "Aguardando";
        }

        div.append(p1, p2, wo, status);
        container.appendChild(div);
    });
}
function renderTudo() {
    renderJogadores();
    renderWinners();
    renderLosers();
    montarFinal();
    atualizarSelects(); 
   
}


// Monta primeira rodada ou próximas rodadas
// ---------- INICIAR LOSERS ----------
function banirJogador(nome) {
    if (!nome) return alert("Nenhum jogador selecionado.");
    if (!confirm(`Tem certeza que deseja Eliminar ${nome}?`)) return;

    if (!estado.banidos.includes(nome)) {
        estado.banidos.push(nome);
    }

    // Remove da lista principal
    estado.jogadores = estado.jogadores.filter(j => j.nome !== nome);

    // -------- WINNERS --------
    estado.winners.forEach((m, i) => {
        if (m.winner !== null) return;

        if (m.p1 === nome || m.p2 === nome) {
            const adversario = m.p1 === nome ? m.p2 : m.p1;

            // vitória automática do adversário
            if (adversario && adversario !== "BYE") {
                vencedorW(i, adversario);
            } else {
                m.winner = WO;
            }
        }
    });

    // -------- LOSERS --------
    estado.losers.forEach((m, i) => {
        if (m.winner !== null) return;

        if (m.p1 === nome || m.p2 === nome) {
            const adversario = m.p1 === nome ? m.p2 : m.p1;

            if (adversario && adversario !== "BYE") {
                vencedorL(i, adversario);
            } else {
                m.winner = WO;
            }
        }
    });

    // Remove da fila e histórico
    estado.losersQueue = estado.losersQueue.filter(n => n !== nome);
    estado.losersHistorico = estado.losersHistorico.filter(n => n !== nome);

    // Finalistas
    if (estado.finalistaW === nome) estado.finalistaW = null;
    if (estado.finalistaL === nome) estado.finalistaL = null;

    salvarEstado();
    renderTudo();

    alert(`Jogador ${nome} foi Eliminado. O adversário avançou automaticamente.`);
}


function iniciarLosers() {
    if (estado.losersQueue.length === 0) {
        estado.losers = [];
        estado.finalistaL = null;
        montarFinal();
        salvarEstado();
        return;
    }

    // Mostra opções para o usuário escolher como gerar os pares
    const container = document.getElementById("opcoesLosers");
    container.innerHTML = `
        <label for="modoLosers">Escolha o pareamento dos losers:</label>
        <select id="modoLosers">
            <option value="aleatorio">Aleatório</option>
            <option value="rating">Por Rating</option>
        </select>
        <button onclick="gerarLosers()">Gerar pares</button>
    `;
}

// ---------- GERAR PARES DE LOSERS ----------

function gerarLosers() {
    const modo = document.getElementById("modoLosers").value;
    let lista = [...estado.losersQueue];
    estado.losersQueue = [];  // limpa fila para não duplicar
    estado.losersSeeded = true;

    if (modo === "aleatorio") {
        lista = shuffle(lista);
    } else if (modo === "rating") {
        lista.sort((a, b) => getRating(b) - getRating(a));
    }

    // Gera os pares
    estado.losers = [];
    for (let i = 0; i < lista.length; i += 2) {
        estado.losers.push({
            p1: lista[i],
            p2: lista[i + 1] ?? "BYE",
            winner: null
        });
    }

    renderLosers();
    document.getElementById("opcoesLosers").innerHTML = ""; // remove seleção
    salvarEstado();
    renderTudo()
}



// Render dos losers corrigido para evitar objetos inválidos
function renderLosers() {
    let div = document.getElementById("losers");

    if (!estado.losers || estado.losers.length === 0) {
        div.innerHTML = "<p>Aguardando finalista.</p>";
        salvarEstado();
        return;
    }

    div.innerHTML = "";

    estado.losers.forEach((m, i) => {
        // Se algum objeto voltar quebrado do localStorage, normaliza:
        if (!m || typeof m !== "object") {
            return;
        }

        let p1 = m.p1;
        let p2 = m.p2;

        let b1 = `<button ${m.winner ? "disabled" : ""} onclick="vencedorL(${i}, '${p1}')">${p1}</button>`;
        let b2 = p2 === "BYE"
            ? "<i>BYE</i>"
            : `<button ${m.winner ? "disabled" : ""} onclick="vencedorL(${i}, '${p2}')">${p2}</button>`;

        let wo = `<button ${m.winner ? "disabled" : ""} onclick="woL(${i})">WO</button>`;


        if (p2 === "BYE") b2 = "<i>BYE</i>";

        div.innerHTML += `
        <div class="partida" id="l_partida_${i}">
           
            ${b1} ${b2} ${wo}
            <br>
            <div class="resultadoL">
            <br>
    ${m.winner === WO
                ? "<strong>WO — ambos eliminados</strong>"
                : m.winner
                    ? "<strong>Vencedor: " + m.winner + "</strong>"
                    : ""
            }
             </div>

        </div>`;
    });

    salvarEstado();
}



// Processa vencedor dos losers e avança rodada
function alterarAlgo() {
    let nomeJogador=document.getElementById('nomeJogador')
  let   ratingJogador=document.getElementById('ratingJogador')
    estado.jogadores.push({nome:nomeJogador.value,rating:Number(ratingJogador.value)})
    salvarEstado()
    renderTudo()
}


function vencedorL(i, nome) {
    if (!estado.losers[i] || estado.losers[i].winner !== null) return;

    estado.losers[i].winner = nome;

    const perdedor = estado.losers[i].p1 === nome ? estado.losers[i].p2 : estado.losers[i].p1;

    if (
        perdedor &&
        perdedor !== "BYE" &&
        !estado.eliminadosLosers.includes(perdedor)
    ) {
        estado.eliminadosLosers.push(perdedor);
        localStorage.setItem(
            "eliminadosLosers",
            JSON.stringify(estado.eliminadosLosers)
        );
    }

    if (estado.losers.every(m => m.winner !== null)) {
        avancarLosers();
    }

    renderLosers();
    salvarEstado();
    renderTudo()
}





// Avança rodada do losers
function avancarLosers() {

    const vencedores = [];

    estado.losers.forEach(m => {
        // ignora WO
        if (m.winner && m.winner !== WO) {
            vencedores.push(m.winner);
        }
    });

    // ninguém sobrou
    if (vencedores.length === 0) {
        estado.finalistaL = null;
        montarFinal();
        salvar();
        return;
    }

    // só um → finalista dos losers
    if (vencedores.length === 1) {
        estado.finalistaL = vencedores[0];
        montarFinal();
        salvarEstado();
        return;
    }

    // monta nova rodada
    const pares = [];
    for (let i = 0; i < vencedores.length; i += 2) {
        pares.push({
            p1: vencedores[i],
            p2: vencedores[i + 1] ?? "BYE",
            winner: null
        });
    }

    estado.losers = pares;
    renderLosers();
    renderTudo();
    salvarEstado();
}

// ---------- LOSERS ------

// ---------- GRANDE FINAL ----------
function montarFinal() {
    const div = document.getElementById("final");
    if (!div) return;

    // Limpa sempre
    div.innerHTML = "";

    // Só mostra a final quando AMBOS existem
    if (!estado.finalistaW || !estado.finalistaL) {
        return;
    }

    // Grande Final
    div.innerHTML = `
        <h3>${estado.finalistaW} (WINNERS) vs ${estado.finalistaL} (LOSERS)</h3>
        <button onclick="finalVencedor('${estado.finalistaW}', '${estado.finalistaL}')">
            ${estado.finalistaW}
        </button>
        <button onclick="finalVencedor('${estado.finalistaL}', '${estado.finalistaW}')">
            ${estado.finalistaL}
        </button>
    `;
}


function finalVencedor(g, p) {
    let div = document.getElementById("final");

    if (g === estado.finalistaL && !estado.resetMatch) {
        estado.resetMatch = true;
        div.innerHTML = `
            <h3>Partida de RESET!</h3>
            <button onclick="finalVencedor('${estado.finalistaW}', '${estado.finalistaL}')">${estado.finalistaW}</button>
            <button onclick="finalVencedor('${estado.finalistaL}', '${estado.finalistaW}')">${estado.finalistaL}</button>
        `;
        salvarEstado();
        return;
    }

    div.innerHTML = `<h2>🏆 CAMPEÃO: ${g}</h2><h3>Vice: ${p}</h3>`;
    salvarEstado();
}
function limparStatus() {
    if (!confirm("Deseja realmente limpar todos os eliminados e banidos?")) return;

    estado.eliminadosLosers = [];
    estado.banidos = [];

    localStorage.setItem("eliminadosLosers", JSON.stringify([]));
    localStorage.setItem("banidos", JSON.stringify([]));

    document.getElementById("listaLosers").innerHTML = "";
    document.getElementById("listaBanidos").innerHTML = "";

    alert("Eliminados do Losers e banidos foram limpos.");
}


function abrirPopupLosers() {
    const popLoser = document.getElementById('popupLosers')
    popLoser.classList.toggle('popup')
    mostrarLosers()
}
function abrirPopupStatus() {
    const popup = document.getElementById("popupStatus");
    popup.style.display = "block";

    // Lista apenas perdedores do losers
    const ulLosers = document.getElementById("listaLosers");
    ulLosers.innerHTML = estado.eliminadosLosers
        .map((nome, i) => `<li>${i + 1}. ${nome}</li>`)
        .join("");


    // Lista de banidos
    const ulBanidos = document.getElementById("listaBanidos");
    ulBanidos.innerHTML = estado.banidos.map((nome, i) => `<li>${i + 1}. ${nome}</li>`).join("");
    mostrarLosers()
}


function fecharPopupStatus() {
    document.getElementById("popupStatus").style.display = "none";
}

function mostrarLosers() {
    const container = document.getElementById("popupLosersConteudo");
    if (!container) return;

    // limpa sempre
    container.innerHTML = "";

    if (!estado.losersHistorico || estado.losersHistorico.length === 0) {
        container.innerHTML = "<p>Nenhum jogador caiu do Winners ainda.</p>";
        return;
    }

    estado.losersHistorico.forEach((nome, i) => {
        const p = document.createElement("p");
        p.textContent = `${i + 1}. ${nome}`;
        container.appendChild(p);
    });
}

function resetarLosers() {
    if (!confirm("Deseja realmente resetar o histórico de losers?")) return;

    estado.losersHistorico = [];
    salvarEstado();
    mostrarLosers();
}



// ---------- RESET TOTAL ----------
function resetarTudo() {
    
    estado = {
        versao: ESTADO_VERSAO,
        jogadores: [],
        confrontosManuais: [],
        winners: [],
        losers: [],
        losersQueue: [],
        losersHistorico: [],
        finalistaW: null,
        finalistaL: null,
        modo: "",
        resetMatch: false,
        banidos: [],
        eliminadosLosers: []
    };

    salvarEstado();
    renderTudo();
}
// -------------------------------------
// EXPORTAR PLANILHA (XLSX)
// -------------------------------------
function exportarPlanilha() {

    if (estado.jogadores.length === 0) {
        alert("Nenhum jogador cadastrado!");
        return;
    }

    // Cria matriz: cabeçalho + jogadores
    let dados = [["Nome", "Rating"]];
    estado.jogadores.forEach(j => dados.push([j.nome, j.rating]));

    // Converte para planilha
    let ws = XLSX.utils.aoa_to_sheet(dados);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "estado.Jogadores");

    // Baixa arquivo
    XLSX.writeFile(wb, "estado.jogadores.xlsx");
}



// -------------------------------------
// IMPORTAR PLANILHA (XLSX)
// -------------------------------------
function importarPlanilha(event) {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const primeira = workbook.Sheets[workbook.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(primeira, {
            header: 1,
            blankrows: false
        });

        // Verifica se há pelo menos 2 linhas (cabeçalho + 1 jogador)
        if (linhas.length < 2) {
            alert("Planilha vazia!");
            return;
        }

        let novaLista = [];

        for (let i = 1; i < linhas.length; i++) {
            let l = linhas[i];

            if (!l || l.length === 0) continue;

            // Células podem vir undefined
            let nome = (l[0] || "").toString().trim();
            let rating = parseInt(l[1]);

            if (!nome) continue;
            if (isNaN(rating)) rating = 0;

            novaLista.push({ nome, rating });
        }

        // Substitui completamente a lista atual
        estado.jogadores = novaLista;

        // Atualiza interface
        renderJogadores();
        atualizarSelects();
        salvarEstado();

        console.log("Jogadores importados:", estado.jogadores);

        alert("Jogadores importados com sucesso!");
    };

    reader.readAsArrayBuffer(file);
}




// -------------------------------------
// ATUALIZAR SELECTS (INCLUINDO DELETAR)
// -------------------------------------
function atualizarSelects() {
    let sA = document.getElementById("selA");
    let sB = document.getElementById("selB");
    let sD = document.getElementById("selDelete");

    if (sA) sA.innerHTML = estado.jogadores.map(j => `<option>${j.nome}</option>`).join("");
    if (sB) sB.innerHTML = estado.jogadores.map(j => `<option>${j.nome}</option>`).join("");
    if (sD) sD.innerHTML = estado.jogadores.map(j => `<option>${j.nome}</option>`).join("");
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        carregarEstado();
        normalizarEstado();
        renderTudo();
    }
});


// -------------------------------------
// REMOVER JOGADOR PELO SELECT
// -------------------------------------
function removerJogadorSelect() {
    let nome = document.getElementById("selDelete").value;

    if (!nome) return;

    estado.jogadores = estado.jogadores.filter(j => j.nome !== nome);

    renderJogadores();
    atualizarSelects();
    salvarEstado();
    renderTudo()

    alert("Jogador removido: " + nome);
}



