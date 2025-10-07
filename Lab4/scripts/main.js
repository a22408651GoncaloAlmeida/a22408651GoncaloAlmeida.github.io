let contador = 0;
let intervalo = null;

function atualizar() {
    document.getElementById('contador').textContent = contador;
}

function incrementar() {
    contador++;
    atualizar();
}

function decrementar() {
    contador--;
    atualizar();
}

// Contador automático ao passar o rato na imagem
function iniciarContagem() {
    if (!intervalo) {
        intervalo = setInterval(() => {
            contador++;
            atualizar();
        }, 100); // soma a cada 100ms
    }
}

function pararContagem() {
    clearInterval(intervalo);
    intervalo = null;
}

// Frase Matue
let frases = [
    '"O matuê é o rei do trap!!"',
    '"30 no comando!!"',
];
let fraseIndex = 0;

function mudarFrase(over) {
    const el = document.getElementById('matueFrase');
    if (over) {
        el.textContent = frases[1];
    } else {
        el.textContent = frases[0];
    }
}

function trocarFrase() {
    const el = document.getElementById('matueFrase');
    fraseIndex = (fraseIndex + 1) % frases.length;
    el.textContent = frases[fraseIndex];
}

// Mudar a cor do texto da frase
function mudarCorTexto() {
    const cor = document.getElementById('inputCorTexto').value;
    document.getElementById('matueFrase').style.color = cor;
}

// Mudar a cor do fundo
function mudarCorFundo() {
    const cor = document.getElementById('inputCorFundo').value;
    document.body.style.background = cor;
}