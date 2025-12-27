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
let jogadores = [];
let confrontosManuais = [];
let containerLosers = document.getElementById('popupLosersConteudo')
// brackets
let winners = [];
let losers = [];
let losersSeeded = false;
let banidos = JSON.parse(localStorage.getItem("banidos")) || [];
let eliminadosLosers = JSON.parse(localStorage.getItem("eliminadosLosers")) || [];

let losersHistorico = [];
let losersQueue = [];   // aqui entram o
let finalistaW = null;
let finalistaL = null;

let resetMatch = false;
let modo = "";

// ---------- SALVAR ----------
function salvar() {
    localStorage.setItem("losersQueue", JSON.stringify(losersQueue));

    localStorage.setItem("losersHistorico", JSON.stringify(losersHistorico));

    localStorage.setItem("jogadores", JSON.stringify(jogadores));
    localStorage.setItem("confrontosManuais", JSON.stringify(confrontosManuais));
    localStorage.setItem("winnersData", JSON.stringify(winners));
    localStorage.setItem("losersData", JSON.stringify(losers));
    localStorage.setItem("finalistaW", finalistaW);
    localStorage.setItem("finalistaL", finalistaL);
    localStorage.setItem("resetMatch", resetMatch);
    localStorage.setItem("modo", modo);

    // HTML do render
    localStorage.setItem("html_winners", document.getElementById("winners").innerHTML);
    localStorage.setItem("html_losers", document.getElementById("losers").innerHTML);
    localStorage.setItem("html_final", document.getElementById("final").innerHTML);
}

// ---------- CARREGAR AO INICIAR ----------
window.onload = function () {
    if (localStorage.getItem("losersQueue")) {
        losersQueue = JSON.parse(localStorage.getItem("losersQueue"));
    }

    if (localStorage.getItem("losersHistorico")) {
        losersHistorico = JSON.parse(localStorage.getItem("losersHistorico"));
    }

    if (localStorage.getItem("jogadores")) {
        jogadores = JSON.parse(localStorage.getItem("jogadores"));
    }
    if (localStorage.getItem("confrontosManuais")) {
        confrontosManuais = JSON.parse(localStorage.getItem("confrontosManuais"));
    }
    if (localStorage.getItem("winnersData")) {
        winners = JSON.parse(localStorage.getItem("winnersData"));
    }
    if (localStorage.getItem("losersData")) {
        losers = JSON.parse(localStorage.getItem("losersData"));
    }

    finalistaW = localStorage.getItem("finalistaW") || null;
    finalistaL = localStorage.getItem("finalistaL") || null;
    resetMatch = localStorage.getItem("resetMatch") === "true";
    modo = localStorage.getItem("modo") || "";

    renderJogadores();
    atualizarSelects();

    // Restaurar HTML do torneio
    if (localStorage.getItem("html_winners"))
        document.getElementById("winners").innerHTML = localStorage.getItem("html_winners");

    if (localStorage.getItem("html_losers"))
        document.getElementById("losers").innerHTML = localStorage.getItem("html_losers");

    if (localStorage.getItem("html_final"))
        document.getElementById("final").innerHTML = localStorage.getItem("html_final");

    if (modo === "manual") {
        document.getElementById("manualArea").style.display = "block";
    }
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

    if (jogadores.some(j => j.nome === nome))
        return alert("Jogador já existe!");

    jogadores.push({ nome, rating });

    document.getElementById("nomeJogador").value = "";
    document.getElementById("ratingJogador").value = "";
    document.getElementById("nomeJogador").focus();

    renderJogadores();
    atualizarSelects();
    salvar();
}


function renderJogadores() {
    document.getElementById("listaJogadores").innerHTML =
        jogadores
            .map(j => `
                <li>
                    ${j.nome} — Rating: ${j.rating}
                   
                </li>
            `)
            .join("");
}



function removerJogadorSelect() {
    let sel = document.getElementById("selDelete");
    let nome = sel.value;

    if (!nome) return alert("Nenhum jogador selecionado.");
    if (!confirm(`Remover jogador ${nome}?`)) return;

    jogadores = jogadores.filter(j => j.nome !== nome);

    renderJogadores();
    atualizarSelects();
    salvar();
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
    modo = "manual";
    document.getElementById("manualArea").style.display = "block";
    atualizarSelects();
    salvar();
}

function addManual() {
    let A = document.getElementById("selA").value;
    let B = document.getElementById("selB").value;

    if (A === B) return alert("Jogadores iguais!");

    confrontosManuais.push({ p1: A, p2: B });
    renderManuais();
    salvar();
}

function renderManuais() {
    document.getElementById("listaManuais").innerHTML =
        confrontosManuais.map(c => `<li>${c.p1} vs ${c.p2}</li>`).join("");
}

function iniciarManual() {
    if (confrontosManuais.length === 0) return alert("Sem confrontos!");
    winners = confrontosManuais.map(c => ({ ...c }));
    iniciarTorneio();
}

// ---------- SORTEIO ----------
function gerarAutomatico() {
    modo = "sorteio";

    if (jogadores.length < 2) return alert("Poucos jogadores!");

    let emb = [...jogadores].sort(() => Math.random() - 0.5);

    winners = [];
    for (let i = 0; i < emb.length; i += 2) {
        winners.push({
            p1: emb[i].nome,
            p2: emb[i + 1] ? emb[i + 1].nome : "BYE"

        });
    }
    let poupLoser = document.getElementById('popupLosersConteudo')
    poupLoser.innerHTML = ''
    iniciarTorneio();
}
function iniciarPorRating() {
    if (jogadores.length < 2) return alert("Poucos jogadores!");

    modo = "rating";

    // Ordena do maior pro menor rating
    let lista = [...jogadores].sort((a, b) => b.rating - a.rating);

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

    winners = pares;
    iniciarTorneio();
}






// ---------- INICIAR TORNEIO ----------
function iniciarTorneio() {
    losers = [];
    finalistaL = null;
    finalistaW = null;
    losersSeeded = false;

    resetMatch = false;
    confrontosManuais = [];

    renderWinners();
    renderLosers();
    document.getElementById("final").innerHTML = "";

    salvar();
}

// ---------- WINNERS ----------
const WO = "__WO__";

function avancarWinners() {

    const vencedores = winners
        .filter(m => m.winner && m.winner !== WO)
        .map(m => m.winner);

    if (vencedores.length === 0) {
        // todos WO → ninguém avança
        finalistaW = null;
        iniciarLosers();
        return;
    }

    if (vencedores.length === 1) {
        finalistaW = vencedores[0];
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

    winners = novaRodada;
}



//WO
function woW(i) {
    const partida = winners[i];

    if (!partida || partida.winner !== null) return;

    // envia os dois jogadores para o losers
    [partida.p1, partida.p2].forEach(j => {
        if (j && j !== "BYE") {
            if (!losersQueue.includes(j)) losersQueue.push(j);
            if (!losersHistorico.includes(j)) losersHistorico.push(j);
        }
    });

    // marca corretamente como WO
    partida.winner = WO;

    if (winners.every(m => m.winner !== null)) {
        avancarWinners();
    }

    renderWinners();
    salvar();
}
function woL(i) {
    const partida = losers[i];
    if (!partida || partida.winner !== null) return;

    partida.winner = WO;

    [partida.p1, partida.p2].forEach(j => {
        if (
            j &&
            j !== "BYE" &&
            !eliminadosLosers.includes(j)
        ) {
            eliminadosLosers.push(j);
        }
    });

    localStorage.setItem(
        "eliminadosLosers",
        JSON.stringify(eliminadosLosers)
    );

    if (losers.every(m => m.winner !== null)) {
        avancarLosers();
    }

    renderLosers();
    salvar();
}





// ---------- LOSERS (CORRIGIDO) ----------
function getRating(nome) {
    const j = jogadores.find(j => j.nome === nome);
    return j ? j.rating : 0;
}

// Entra perdedor na fila sem duplicar
function vencedorW(i, nome) {
    let partida = winners[i];
    let perdedor = partida.p1 === nome ? partida.p2 : partida.p1;
    if (!winners[i] || winners[i].winner) return;
    if (perdedor !== "BYE") {

        // fila do losers
        if (!losersQueue.includes(perdedor)) {
            losersQueue.push(perdedor);
        }

        // histórico permanente (apenas winners)
        if (!losersHistorico.includes(perdedor)) {
            losersHistorico.push(perdedor);
        }
    }



    winners[i].winner = nome;

    let caixa = document.getElementById("w_partida_" + i);
    if (caixa) {
        caixa.querySelector(".resultadoW").innerHTML =
            `<strong>Vencedor: ${nome}</strong>`;
    }

    if (winners.every(m => m.winner)) {
        avancarWinners();
    }

    renderWinners();
    salvar();
}
function renderWinners() {
    const container = document.getElementById("winners");
    container.innerHTML = "";

    winners.forEach((partida, index) => {

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


// Monta primeira rodada ou próximas rodadas
// ---------- INICIAR LOSERS ----------
function banirJogador(nome) {
    if (!nome) return alert("Nenhum jogador selecionado.");
    if (!confirm(`Tem certeza que deseja banir ${nome}? Isso removerá o jogador de tudo!`)) return;
banidos.push(nome);
localStorage.setItem("banidos", JSON.stringify(banidos));

    // 1. Remove da lista principal
    jogadores = jogadores.filter(j => j.nome !== nome);

    // 2. Remove de winners
    winners = winners.filter(m => m.p1 !== nome && m.p2 !== nome)
                     .map(m => {
                         if (m.p1 === nome) m.p1 = "BYE";
                         if (m.p2 === nome) m.p2 = "BYE";
                         return m;
                     });

    // 3. Remove de losers
    losers = losers.filter(m => m.p1 !== nome && m.p2 !== nome)
                   .map(m => {
                       if (m.p1 === nome) m.p1 = "BYE";
                       if (m.p2 === nome) m.p2 = "BYE";
                       return m;
                   });

    // 4. Remove da fila e histórico de losers
    losersQueue = losersQueue.filter(n => n !== nome);
    losersHistorico = losersHistorico.filter(n => n !== nome);

    // 5. Remove de confrontos manuais
    confrontosManuais = confrontosManuais.filter(c => c.p1 !== nome && c.p2 !== nome);

    // 6. Atualiza finalistas se necessário
    if (finalistaW === nome) finalistaW = null;
    if (finalistaL === nome) finalistaL = null;

    // 7. Atualiza interface
    renderJogadores();
    renderWinners();
    renderLosers();
    montarFinal();
    atualizarSelects();
    salvar();

    alert(`Jogador ${nome} foi banido com sucesso!`);
}

function iniciarLosers() {
    if (losersQueue.length === 0) {
        losers = [];
        finalistaL = null;
        montarFinal();
        salvar();
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
    let lista = [...losersQueue];
    losersQueue = [];  // limpa fila para não duplicar
    losersSeeded = true;

    if (modo === "aleatorio") {
        lista = shuffle(lista);
    } else if (modo === "rating") {
        lista.sort((a, b) => getRating(b) - getRating(a));
    }

    // Gera os pares
    losers = [];
    for (let i = 0; i < lista.length; i += 2) {
        losers.push({
            p1: lista[i],
            p2: lista[i + 1] ?? "BYE",
            winner: null
        });
    }

    renderLosers();
    document.getElementById("opcoesLosers").innerHTML = ""; // remove seleção
    salvar();
}



// Render dos losers corrigido para evitar objetos inválidos
function renderLosers() {
    let div = document.getElementById("losers");

    if (!losers || losers.length === 0) {
        div.innerHTML = "<p>Aguardando finalista.</p>";
        salvar();
        return;
    }

    div.innerHTML = "";

    losers.forEach((m, i) => {
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

    salvar();
}



// Processa vencedor dos losers e avança rodada

   
function vencedorL(i, nome) {
    if (!losers[i] || losers[i].winner !== null) return;

    losers[i].winner = nome;

    const perdedor = losers[i].p1 === nome ? losers[i].p2 : losers[i].p1;

    if (
        perdedor &&
        perdedor !== "BYE" &&
        !eliminadosLosers.includes(perdedor)
    ) {
        eliminadosLosers.push(perdedor);
        localStorage.setItem(
            "eliminadosLosers",
            JSON.stringify(eliminadosLosers)
        );
    }

    if (losers.every(m => m.winner !== null)) {
        avancarLosers();
    }

    renderLosers();
    salvar();
}





// Avança rodada do losers
function avancarLosers() {

    const vencedores = [];

    losers.forEach(m => {
        // ignora WO
        if (m.winner && m.winner !== WO) {
            vencedores.push(m.winner);
        }
    });

    // ninguém sobrou
    if (vencedores.length === 0) {
        finalistaL = null;
        montarFinal();
        salvar();
        return;
    }

    // só um → finalista dos losers
    if (vencedores.length === 1) {
        finalistaL = vencedores[0];
        montarFinal();
        salvar();
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

    losers = pares;
    renderLosers();
    salvar();
}

// ---------- LOSERS ------

// ---------- GRANDE FINAL ----------
function montarFinal() {
    let div = document.getElementById("final");

    if (!finalistaW) return;
    if (finalistaL === null) {
        div.innerHTML = `<h3>Campeão: ${finalistaW}</h3>`;
        salvar();
        return;
    }

    div.innerHTML = `
        <h3>${finalistaW} (WINNERS) vs ${finalistaL} (LOSERS)</h3>
        <button onclick="finalVencedor('${finalistaW}', '${finalistaL}')">${finalistaW}</button>
        <button onclick="finalVencedor('${finalistaL}', '${finalistaW}')">${finalistaL}</button>
    `;

    salvar();
}

function finalVencedor(g, p) {
    let div = document.getElementById("final");

    if (g === finalistaL && !resetMatch) {
        resetMatch = true;
        div.innerHTML = `
            <h3>Partida de RESET!</h3>
            <button onclick="finalVencedor('${finalistaW}', '${finalistaL}')">${finalistaW}</button>
            <button onclick="finalVencedor('${finalistaL}', '${finalistaW}')">${finalistaL}</button>
        `;
        salvar();
        return;
    }

    div.innerHTML = `<h2>🏆 CAMPEÃO: ${g}</h2><h3>Vice: ${p}</h3>`;
    salvar();
}
function limparStatus() {
    if (!confirm("Deseja realmente limpar todos os eliminados e banidos?")) return;

    eliminadosLosers = [];
    banidos = [];

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
    ulLosers.innerHTML = eliminadosLosers
    .map((nome, i) => `<li>${i + 1}. ${nome}</li>`)
    .join("");


    // Lista de banidos
    const ulBanidos = document.getElementById("listaBanidos");
    ulBanidos.innerHTML = banidos.map((nome, i) => `<li>${i + 1}. ${nome}</li>`).join("");
}


function fecharPopupStatus() {
    document.getElementById("popupStatus").style.display = "none";
}

function mostrarLosers() {

    // proteção extra
    if (!containerLosers) return;

    // LIMPA SEMPRE
    containerLosers.replaceChildren();

    // só mostra a partir de 2 perdedores
    if (losersHistorico.length < 2) {
        containerLosers.textContent = "Aguardando pelo menos 2 perdedores...";
        return;
    }

    losersHistorico.forEach((nome, i) => {
        const p = document.createElement('p');
        p.textContent = `${i + 1}. ${nome}`;
        containerLosers.appendChild(p);
    });
}
function resetarLosers() {
    losersHistorico = [];
    containerLosers.replaceChildren();
    salvar();
}


// ---------- RESET TOTAL ----------
function resetarTudo() {
    jogadores = [];
    winners = [];
    losers = [];
    confrontosManuais = [];
    finalistaL = null;
    finalistaW = null;
    resetMatch = false;
    modo = "";

    localStorage.clear();

    document.getElementById("listaJogadores").innerHTML = "";
    document.getElementById("listaManuais").innerHTML = "";
    document.getElementById("manualArea").style.display = "none";
    document.getElementById("winners").innerHTML = "";
    document.getElementById("losers").innerHTML = "";
    document.getElementById("final").innerHTML = "";
}
// -------------------------------------
// EXPORTAR PLANILHA (XLSX)
// -------------------------------------
function exportarPlanilha() {

    if (jogadores.length === 0) {
        alert("Nenhum jogador cadastrado!");
        return;
    }

    // Cria matriz: cabeçalho + jogadores
    let dados = [["Nome", "Rating"]];
    jogadores.forEach(j => dados.push([j.nome, j.rating]));

    // Converte para planilha
    let ws = XLSX.utils.aoa_to_sheet(dados);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jogadores");

    // Baixa arquivo
    XLSX.writeFile(wb, "jogadores.xlsx");
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
        jogadores = novaLista;

        // Atualiza interface
        renderJogadores();
        atualizarSelects();
        salvar();

        console.log("Jogadores importados:", jogadores);

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

    if (sA) sA.innerHTML = jogadores.map(j => `<option>${j.nome}</option>`).join("");
    if (sB) sB.innerHTML = jogadores.map(j => `<option>${j.nome}</option>`).join("");
    if (sD) sD.innerHTML = jogadores.map(j => `<option>${j.nome}</option>`).join("");
}



// -------------------------------------
// REMOVER JOGADOR PELO SELECT
// -------------------------------------
function removerJogadorSelect() {
    let nome = document.getElementById("selDelete").value;

    if (!nome) return;

    jogadores = jogadores.filter(j => j.nome !== nome);

    renderJogadores();
    atualizarSelects();
    salvar();

    alert("Jogador removido: " + nome);
}



