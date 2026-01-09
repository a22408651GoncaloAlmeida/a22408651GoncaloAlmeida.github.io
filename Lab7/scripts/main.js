// ================== CONFIG ==================
const API_BASE = 'https://deisishop.pythonanywhere.com';
const STORAGE_KEY = 'produtos-selecionados';

let produtos = [];

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', async () => {
  await carregarProdutosAPI();
  atualizarLista();
  carregarCategorias();
  ligarEventos();
  renderizarCesto();
});

// ================== API ==================
async function carregarProdutosAPI() {
  try {
    const res = await fetch(`${API_BASE}/products/`);
    produtos = await res.json();
  } catch (error) {
    console.error('Erro ao carregar produtos', error);
    produtos = [];
  }
}

// ================== PRODUTOS ==================
function carregarProdutos(lista) {
  const container = document.querySelector('#lista-produtos');
  container.innerHTML = '';

  lista.forEach(produto => {
    const card = criarProduto(produto);
    container.appendChild(card);
  });
}

function criarProduto(produto) {
  const article = document.createElement('article');

  const imgSrc = produto.image?.startsWith('http')
    ? produto.image
    : API_BASE + produto.image;

  article.innerHTML = `
    <h3>${produto.title}</h3>
    <img src="${imgSrc}" alt="${produto.title}">
    <p>${produto.description}</p>
    <p><strong>${produto.price} €</strong></p>
  `;

  const btn = document.createElement('button');
  btn.textContent = 'Adicionar ao cesto';
  btn.addEventListener('click', () => adicionarAoCesto(produto));

  article.appendChild(btn);
  return article;
}

// ================== CATEGORIAS ==================
function carregarCategorias() {
  const select = document.querySelector('#filtro-categoria');
  const categorias = [...new Set(produtos.map(p => p.category))];

  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// ================== EVENTOS ==================
function ligarEventos() {
  document
    .querySelector('#filtro-categoria')
    .addEventListener('change', filtrarProdutos);

  document
    .querySelector('#filtro-ordenacao')
    .addEventListener('change', ordenarProdutos);

  document
    .querySelector('#pesquisa-produtos')
    .addEventListener('input', atualizarLista);

  document
    .querySelector('#comprar-btn')
    .addEventListener('click', comprar);
}

function filtrarProdutos(e) {
  const categoria = e.target.value;
  const lista = categoria
    ? produtos.filter(p => p.category === categoria)
    : produtos;

  carregarProdutos(lista);
}

function ordenarProdutos(e) {
  const ordem = e.target.value;

  let lista = [...produtos]; // cópia do array original

  if (ordem === 'price-asc') {
    lista.sort((a, b) => a.price - b.price);
  }

  if (ordem === 'price-desc') {
    lista.sort((a, b) => b.price - a.price);
  }

  carregarProdutos(lista);
}

function atualizarLista() {
  const categoria = document.querySelector('#filtro-categoria').value;
  const ordem = document.querySelector('#filtro-ordenacao').value;
  const pesquisa = document
    .querySelector('#pesquisa-produtos')
    .value
    .toLowerCase();

  let lista = [...produtos];

  // filtro por categoria
  if (categoria) {
    lista = lista.filter(p => p.category === categoria);
  }

  // pesquisa por nome
  if (pesquisa) {
    lista = lista.filter(p =>
      p.title.toLowerCase().includes(pesquisa)
    );
  }

  // ordenação por preço
  if (ordem === 'price-asc') {
    lista.sort((a, b) => a.price - b.price);
  }

  if (ordem === 'price-desc') {
    lista.sort((a, b) => b.price - a.price);
  }

  carregarProdutos(lista);
}

// ================== CESTO ==================
function obterCesto() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function guardarCesto(cesto) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cesto));
}

function adicionarAoCesto(produto) {
  const cesto = obterCesto();
  const existente = cesto.find(p => p.id === produto.id);

  if (existente) {
    existente.quantidade++;
  } else {
    cesto.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image,
      quantidade: 1
    });
  }

  guardarCesto(cesto);
  renderizarCesto();
}

function renderizarCesto() {
  const container = document.querySelector('#lista-cesto');
  const totalEl = document.querySelector('#total-cesto');
  const cesto = obterCesto();

  container.innerHTML = '';
  let total = 0;

  cesto.forEach(item => {
    const div = document.createElement('div');

    const subtotal = item.price * item.quantidade;
    total += subtotal;

    div.innerHTML = `
      <p>${item.title} (x${item.quantidade})</p>
      <p>${subtotal.toFixed(2)} €</p>
      <button data-id="${item.id}">Remover</button>
    `;

    div
      .querySelector('button')
      .addEventListener('click', () => removerDoCesto(item.id));

    container.appendChild(div);
  });

  totalEl.textContent = total.toFixed(2) + ' €';
}

function removerDoCesto(id) {
  const cesto = obterCesto();
  const item = cesto.find(p => p.id === id);

  if (!item) return;

  if (item.quantidade > 1) {
    item.quantidade--;
  } else {
    const index = cesto.findIndex(p => p.id === id);
    cesto.splice(index, 1);
  }

  guardarCesto(cesto);
  renderizarCesto();
}

// ================== COMPRA (POST) ==================
async function comprar() {
  const cesto = obterCesto();
  const mensagem = document.querySelector('#checkout-message');

  mensagem.style.display = 'block';

  if (cesto.length === 0) {
    mensagem.textContent = 'O cesto está vazio.';
    return;
  }

  // transformar cesto em array de IDs (quantidade = repetições)
  const products = [];
  cesto.forEach(item => {
    for (let i = 0; i < item.quantidade; i++) {
      products.push(Number(item.id));
    }
  });

  const isStudent = document.querySelector('#is-student')?.checked || false;

  const payload = {
    products: products,
    student: isStudent,
    coupon: '',
    name: 'Cliente'
  };

  console.log('Payload enviado:', payload);

  try {
    const res = await fetch(`${API_BASE}/buy/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Resposta API:', data);

    if (!res.ok) {
      mensagem.textContent = data.error || 'Erro ao processar a compra.';
      return;
    }

    // SUCESSO
    mensagem.innerHTML = `
      <p><strong>${data.message}</strong></p>
      <p>Total a pagar: <strong>${data.totalCost} €</strong></p>
      <p>Referência de pagamento: <strong>${data.reference}</strong></p>
    `;

    localStorage.removeItem(STORAGE_KEY);
    renderizarCesto();

  } catch (error) {
    console.error(error);
    mensagem.textContent =
      'Erro na comunicação com o servidor.';
  }
}
