// variáveis
const passaLabel = document.getElementById('passa-label');
const pintaLabel = document.getElementById('pinta-label');
const pintaButtons = document.querySelectorAll('#pinta button');
const digitInput = document.getElementById('digit-input');
const colorSelect = document.getElementById('color-select');
const contaBtn = document.getElementById('conta-btn');
const counterDisplay = document.getElementById('counter');
const form6 = document.getElementById('form6');
const saudacao = document.getElementById('saudacao');

let prevInput = '';
const digitColors = ['#fff3e0','#e8f5e9','#e3f2fd','#f3e5f5','#fffde7'];
let digitColorIndex = 0;

let contador = Number(localStorage.getItem('lab5_counter')) || 0;

let autoCounter = 0;
const autoCounterEl = document.getElementById('auto-counter');

function count() {
    autoCounter++;
    if (autoCounterEl) autoCounterEl.textContent = autoCounter;
}

setInterval(count, 1000);

const handlePassaOver = () => {
    passaLabel.textContent = '1. Obrigado por passares';
};
function handlePassaOut(){
    passaLabel.textContent = '1. Passa por aqui!';
}

function pintaHandler(e){
    const color = e.currentTarget.dataset.color;
    if (color) pintaLabel.style.color = color;
}

function handleDigitInput(e){
    const val = e.target.value;
    if (val !== prevInput) {
        digitColorIndex = (digitColorIndex + 1) % digitColors.length;
        digitInput.style.background = digitColors[digitColorIndex];
    }
    prevInput = val;
}

function aplicarCorFundo(){
    const v = this.value ? this.value.trim() : '';
    if(!v) return;
    document.body.style.background = v;
}

function atualizarContador(){
    counterDisplay.textContent = contador;
    counterDisplay.style.color = getComputedStyle(document.body).color || '#111';
}

function salvarContador(){
    localStorage.setItem('lab5_counter', String(contador));
}

function incrementarHandler(){
    contador++;
    salvarContador();
    atualizarContador();
}

form6.onsubmit = (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const idade = document.getElementById('idade').value.trim();
    saudacao.textContent = `Olá, o ${nome} tem ${idade}!`;
};

pintaButtons.forEach(btn => btn.addEventListener('click', pintaHandler));
digitInput.addEventListener('input', handleDigitInput);
colorSelect.onchange = function(){ aplicarCorFundo.call(this); };
contaBtn.addEventListener('click', incrementarHandler);

handlePassaOut();
atualizarContador();