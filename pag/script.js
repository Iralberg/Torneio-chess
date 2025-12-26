let partidas = JSON.parse(localStorage.getItem("partidas")) || [];

function agendarPartida() {
    const j1 = document.getElementById("jogadorBranco").value;
    const j2 = document.getElementById("jogadorPreto").value;
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;

    if (!j1 || !j2 || !data || !hora) {
        alert("Preencha todos os campos");
        return;
    }
    if (j1 === j2) {
        alert("Jogadores devem ser diferentes");
        return;
    }

    // Sorteio de cor
    let branco, preto;
    if (Math.random() < 0.5) {
        branco = j1;
        preto  = j2;
    } else {
        branco = j2;
        preto  = j1;
    }

    partidas.push({
        branco,
        preto,
        data,
        hora,
        vencedor: null
    });

    salvarPartidas();
    renderPartidas();
    limparAgenda();
}


function renderPartidas() {
    const div = document.getElementById("listaPartidas");
    div.innerHTML = "";

    partidas.forEach((p, i) => {
        const card = document.createElement("div");
        card.className = "match";

        card.innerHTML = `
            <strong>${p.branco}</strong> (Branco) x
            <strong>${p.preto}</strong> (Preto)<br>
            ${p.data} ${p.hora}<br>
            Vencedor: ${p.vencedor || "—"}<br>
            <button onclick="definirVencedor(${i}, 'branco')">Branco</button>
            <button onclick="definirVencedor(${i}, 'preto')">Preto</button>
            <button onclick="apagarPartida(${i})">❌</button>
        `;

        div.appendChild(card);
    });
}




function definirVencedor(index, lado) {
    partidas[index].vencedor =
        lado === "branco"
            ? partidas[index].branco
            : partidas[index].preto;

    salvarPartidas();
    renderPartidas();
}



function apagarPartida(index) {
    if (!confirm("Deseja apagar esta partida?")) return;
    partidas.splice(index, 1);
    salvarPartidas();
    renderPartidas();
}

function resetarJogadores() {
    if (!confirm("Deseja realmente resetar a lista de jogadores?")) return;

    jogadores = [];
    // Limpa a lista visual
    document.getElementById("lista").innerHTML = "";
    document.getElementById("listaJogadores").innerHTML = "";

    // Limpa os selects
    atualizarSelectJogadores();

    // Salva no localStorage
    localStorage.setItem("jogadores", JSON.stringify(jogadores));

    alert("Lista de jogadores resetada!");
}
function removerJogador(index) {
    if (!confirm("Remover jogador?")) return;
    jogadores.splice(index, 1);
    salvarJogadores();
    render();
}

function atualizarSelectJogadores() {
    preencherSelectJogadores();
}


let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];


function cadastrarManual() {
    const nome = document.getElementById("nome").value.trim();
    const rating = parseInt(document.getElementById("rating").value) || 0;
    
    if (!nome) {
        alert("Informe o nome");
        return;
    }
    
    if (jogadores.some(j => j.nome === nome)) {
        alert("Jogador já cadastrado");
        return;
    }
    
    jogadores.push({ nome, rating });
salvarJogadores();
render();
preencherSelectJogadores(); // 👈 ESSENCIAL
limparCadastro();

}
function preencherSelectJogadores() {
    const selBranco = document.getElementById("jogadorBranco");
    const selPreto  = document.getElementById("jogadorPreto");

    if (!selBranco || !selPreto) return;

    // limpa
    selBranco.innerHTML = `<option value="">Selecione</option>`;
    selPreto.innerHTML  = `<option value="">Selecione</option>`;

    jogadores.forEach(j => {
        const opt1 = document.createElement("option");
        opt1.value = j.nome;
        opt1.textContent = j.nome;

        const opt2 = document.createElement("option");
        opt2.value = j.nome;
        opt2.textContent = j.nome;

        selBranco.appendChild(opt1);
        selPreto.appendChild(opt2);
    });
}

function salvarJogadores() {
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
}

function salvarPartidas() {
    localStorage.setItem("partidas", JSON.stringify(partidas));
}



function limparCadastro() {
    document.getElementById("nome").value = "";
    document.getElementById("rating").value = "";
}

function limparAgenda() {
    document.getElementById("jogadorBranco").value = "";
    document.getElementById("jogadorPreto").value = "";
    document.getElementById("data").value = "";
    document.getElementById("hora").value = "";
}


function importarPlanilha(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        for (let i = 1; i < linhas.length; i++) {
            const [nome, rating] = linhas[i];

            if (!nome) continue;

            if (!jogadores.some(j => j.nome === nome)) {
                jogadores.push({
                    nome: nome.toString().trim(),
                    rating: parseInt(rating) || 0
                });
            }
        }

       salvarJogadores();
render();
preencherSelectJogadores(); // 👈 ESSENCIAL
alert("Importação concluída");

    };

    reader.readAsArrayBuffer(file);
}





function render() {
    const ul = document.getElementById("lista");
    ul.innerHTML = "";

    jogadores.forEach((j, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${j.nome}</strong>
            Rating:
            <input type="number" value="${j.rating}"
                   onchange="editarRating(${index}, this.value)">
            <button onclick="removerJogador(${index})">❌</button>
        `;

        ul.appendChild(li);
    });
} 
render()

function editarRating(index, novo) {
    jogadores[index].rating = parseInt(novo) || 0;
    salvarJogadores();
   
}
render()
renderPartidas()


window.onload = () => {
    render();                 // jogadores
    preencherSelectJogadores();
    renderPartidas();
};