// ---------- DADOS ----------
let jogadores = [];
let confrontosManuais = [];

// brackets
let winners = [];
let losers = [];

let finalistaW = null;
let finalistaL = null;

let resetMatch = false;
let modo = "";

// ---------- SALVAR ----------
function salvar() {
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
function tecla(e){
  if(e.key === "Enter"){
    addJogador(); // dispara o botão
  }
}

function addJogador(){
    let nome = document.getElementById("nomeJogador").value.trim();
    let rating = parseInt(document.getElementById("ratingJogador").value);

    if(!nome) return alert("Digite o nome!");
    if(isNaN(rating)) rating = 0;

    if(jogadores.some(j => j.nome === nome))
        return alert("Jogador já existe!");

    jogadores.push({ nome, rating });

    document.getElementById("nomeJogador").value = "";
    document.getElementById("ratingJogador").value = "";
    document.getElementById("nomeJogador").focus();

    renderJogadores();
    atualizarSelects();
    salvar();
}

function renderJogadores(){
    document.getElementById("listaJogadores").innerHTML =
        jogadores
            .map(j => `<li>${j.nome} — Rating: ${j.rating}</li>`)
            .join("");
}

function atualizarSelects(){
    let sA = document.getElementById("selA");
    let sB = document.getElementById("selB");
    if(!sA || !sB) return;

    sA.innerHTML = jogadores.map(j => `<option>${j.nome}</option>`).join("");
    sB.innerHTML = jogadores.map(j => `<option>${j.nome}</option>`).join("");
}
// ---------- RATING / SEEDING ----------
function shuffle(arr) {
    for(let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function seedPorRating(jogs, randomizaEmpates = true) {
    let copia = jogs.map(j => ({ ...j }));

    if(randomizaEmpates){
        let grupos = {};
        copia.forEach(j => {
            if(!grupos[j.rating]) grupos[j.rating] = [];
            grupos[j.rating].push(j);
        });

        let notas = Object.keys(grupos).map(r => parseInt(r)).sort((a,b)=>b-a);
        let resultado = [];
        notas.forEach(r => {
            resultado = resultado.concat(shuffle(grupos[r]));
        });
        return resultado;
    }

    return copia.sort((a,b)=>b.rating - a.rating);
}

function criarParesOrdenados(lista){
    let vetor = [];
    let n = lista.length;

    for(let i=0; i<Math.floor(n/2); i++){
        vetor.push({
            p1: lista[i].nome,
            p2: lista[n - 1 - i].nome
        });
    }

    if(n % 2 === 1){
        vetor.push({
            p1: lista[Math.floor(n/2)].nome,
            p2: "BYE"
        });
    }

    return vetor;
}
// ---------- MODO MANUAL ----------
function modoManual(){
    modo = "manual";
    document.getElementById("manualArea").style.display = "block";
    atualizarSelects();
    salvar();
}

function addManual(){
    let A = document.getElementById("selA").value;
    let B = document.getElementById("selB").value;

    if(A === B) return alert("Jogadores iguais!");

    confrontosManuais.push({p1:A,p2:B});
    renderManuais();
    salvar();
}

function renderManuais(){
    document.getElementById("listaManuais").innerHTML =
        confrontosManuais.map(c => `<li>${c.p1} vs ${c.p2}</li>`).join("");
}

function iniciarManual(){
    if(confrontosManuais.length === 0) return alert("Sem confrontos!");
    winners = confrontosManuais.map(c => ({...c}));
    iniciarTorneio();
}

// ---------- SORTEIO ----------
function gerarAutomatico(){
    modo = "sorteio";

    if(jogadores.length < 2) return alert("Poucos jogadores!");

    let emb = [...jogadores].sort(()=>Math.random()-0.5);

    winners = [];
    for(let i=0;i<emb.length;i+=2){
        winners.push({
           p1: emb[i].nome,
p2: emb[i+1] ? emb[i+1].nome : "BYE"

        });
    }
    iniciarTorneio();
}
function iniciarPorRating(){
    if(jogadores.length < 2) return alert("Poucos jogadores!");

    modo = "rating";

    // Ordena do maior pro menor rating
    let lista = [...jogadores].sort((a,b)=>b.rating - a.rating);

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
function iniciarTorneio(){
    losers = [];
    finalistaL = null;
    finalistaW = null;
    resetMatch = false;
    confrontosManuais = [];

    renderWinners();
    renderLosers();
    document.getElementById("final").innerHTML = "";

    salvar();
}

// ---------- WINNERS ----------
function renderWinners(){
    let div = document.getElementById("winners");
    if(winners.length === 0){
        div.innerHTML = "<p>Nenhuma partida.</p>";
        salvar();
        return;
    }

    div.innerHTML = "";

    winners.forEach((m,i)=>{
        let b1 = `<button onclick="vencedorW(${i}, '${m.p1}')">${m.p1}</button>`;
        let b2 = `<button onclick="vencedorW(${i}, '${m.p2}')">${m.p2}</button>`;

        if(m.p2 === "BYE") b2 = "<i>BYE</i>";

        div.innerHTML += `
            <div class="partida">
                ${m.p1} vs ${m.p2}<br>
                ${b1} ${b2}
            </div>
        `;
    });

    salvar();
}

function vencedorW(i, nome){
    let partida = winners[i];
    let perdedor = partida.p1 === nome ? partida.p2 : partida.p1;

    if(perdedor !== "BYE") losers.push(perdedor);

    winners[i].winner = nome;

    if(winners.every(m => m.winner)){
        avancarWinners();
    }

    renderWinners();
    salvar();
}

function avancarWinners(){
    let vencedores = winners.map(m => m.winner);

    if(vencedores.length === 1){
        finalistaW = vencedores[0];
        iniciarLosers();
        return;
    }

    winners = [];

    for(let i=0;i<vencedores.length;i+=2){
        winners.push({
            p1: vencedores[i],
            p2: vencedores[i+1] ?? "BYE"
        });
    }
}

// ---------- LOSERS ----------
function iniciarLosers(){
    if(losers.length === 0){
        finalistaL = null;
        montarFinal();
        salvar();
        return;
    }

    let pares = [];
    for(let i=0;i<losers.length;i+=2){
        pares.push({
            p1: losers[i],
            p2: losers[i+1] ?? "BYE"
        });
    }

    losers = pares;
    renderLosers();
    salvar();
}

function renderLosers(){
    let div = document.getElementById("losers");

    if(losers.length === 0){
        div.innerHTML = "<p>Aguardando finalista.</p>";
        salvar();
        return;
    }

    div.innerHTML = "";
    losers.forEach((m,i)=>{
        let b1 = `<button onclick="vencedorL(${i}, '${m.p1}')">${m.p1}</button>`;
        let b2 = `<button onclick="vencedorL(${i}, '${m.p2}')">${m.p2}</button>`;

        if(m.p2 === "BYE") b2 = "<i>BYE</i>";

        div.innerHTML += `
        <div class="partida">
            ${m.p1} vs ${m.p2}<br>
            ${b1} ${b2}
        </div>`;
    });

    salvar();
}

function vencedorL(i, nome){
    losers[i].winner = nome;

    if(losers.every(m => m.winner)){
        avancarLosers();
    }

    renderLosers();
    salvar();
}

function avancarLosers(){
    let vencedores = losers.map(m => m.winner);

    if(vencedores.length === 1){
        finalistaL = vencedores[0];
        montarFinal();
        salvar();
        return;
    }

    losers = [];
    for(let i=0;i<vencedores.length;i+=2){
        losers.push({
            p1: vencedores[i],
            p2: vencedores[i+1] ?? "BYE"
        });
    }
}

// ---------- GRANDE FINAL ----------
function montarFinal(){
    let div = document.getElementById("final");

    if(!finalistaW) return;
    if(finalistaL === null){
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

function finalVencedor(g, p){
    let div = document.getElementById("final");

    if(g === finalistaL && !resetMatch){
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

// ---------- RESET TOTAL ----------
function resetarTudo(){
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