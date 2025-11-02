// filepath: /workspaces/a22408651GoncaloAlmeida.github.io/Lab7/scripts/main.js

const API_BASE = 'https://deisishop.pythonanywhere.com';

// fetch helpers
async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products/`);
    if (!res.ok) throw new Error(`products HTTP ${res.status}`);
    const data = await res.json();
    // adaptar conforme formato retornado
    if (Array.isArray(data)) window.produtos = data;
    else if (Array.isArray(data.products)) window.produtos = data.products;
    else window.produtos = [];
    console.log('produtos carregados:', window.produtos.length);
  } catch (err) {
    console.error('Erro a carregar products:', err);
    window.produtos = window.produtos || [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories/`);
    if (!res.ok) throw new Error(`categories HTTP ${res.status}`);
    const data = await res.json();
    // adaptar conforme formato retornado
    if (Array.isArray(data)) window.categorias = data;
    else if (Array.isArray(data.categories)) window.categorias = data.categories;
    else window.categorias = [];
    console.log('categorias carregadas:', window.categorias.length);
  } catch (err) {
    console.warn('Erro a carregar categories (fallback a partir dos produtos):', err);
    // fallback: extrair das products se houver
    const produtos = Array.isArray(window.produtos) ? window.produtos : [];
    window.categorias = Array.from(new Set(produtos.map(p => String(p.category || p.category_name || '').trim()).filter(Boolean)));
    console.log('categorias (fallback):', window.categorias.length);
  }
}

// inicialização assincrona: garante dados antes de renderizar
async function initApp() {
  await Promise.all([fetchProducts(), fetchCategories()]);
  // após carregar dados, popular UI
  carregarCategorias(); // preenche select de categorias
  // render inicial aplicando filtros (se implementado) ou apenas todos
  if (typeof atualizarListaVisivel === 'function') {
    atualizarListaVisivel();
  } else {
    carregarProdutos(Array.isArray(window.produtos) ? window.produtos : []);
  }
  // renderizar cesto se função existir
  if (typeof renderizarCesto === 'function') renderizarCesto();

  // ligar listeners que dependem de elementos / dados
  const filtro = document.getElementById('filtro-categoria');
  if (filtro && !filtro.dataset.bound) {
    filtro.addEventListener('change', () => {
      if (typeof atualizarListaVisivel === 'function') atualizarListaVisivel();
      else {
        const cat = filtro.value;
        const lista = cat ? (window.produtos || []).filter(p => String(p.category) === cat) : (window.produtos || []);
        carregarProdutos(lista);
      }
    });
    filtro.dataset.bound = '1';
  }
  const orden = document.getElementById('filtro-ordenacao');
  if (orden && !orden.dataset.bound) {
    orden.addEventListener('change', () => { if (typeof atualizarListaVisivel === 'function') atualizarListaVisivel(); });
    orden.dataset.bound = '1';
  }
  const pesquisa = document.getElementById('pesquisa-produtos');
  if (pesquisa && !pesquisa.dataset.bound) {
    pesquisa.addEventListener('input', () => { if (typeof atualizarListaVisivel === 'function') atualizarListaVisivel(); });
    pesquisa.dataset.bound = '1';
  }

  // ligar o listener do botão comprar para garantir que está activo
  if (typeof ligarListenerComprar === 'function') ligarListenerComprar();
}

// arrancar após DOM pronto
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(err => console.error('initApp erro:', err));
});

// fetch inicial do root da API (sem endpoints) e funções de acesso
async function fetchApiRoot() {
  try {
    const res = await fetch('https://deisishop.pythonanywhere.com/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    window.apiData = data;

    // Extrair produtos
    if (Array.isArray(data)) {
      window.produtos = data;
    } else if (Array.isArray(data.products)) {
      window.produtos = data.products;
    } else if (Array.isArray(data.data)) {
      window.produtos = data.data;
    } else {
      // tenta encontrar a primeira propriedade que seja array de objetos
      const arr = Object.values(data).find(v => Array.isArray(v) && v.length && typeof v[0] === 'object');
      window.produtos = Array.isArray(arr) ? arr : [];
    }

    // Extrair categorias
    if (Array.isArray(data.categories)) {
      window.categorias = data.categories;
    } else if (Array.isArray(data.tags)) {
      window.categorias = data.tags;
    } else {
      // fallback a partir dos produtos
      window.categorias = Array.from(new Set((window.produtos || []).map(p => (p.category || p.category_name || '').toString()).filter(Boolean)));
    }

    console.log('API root carregada:', {
      produtos: (window.produtos || []).length,
      categorias: (window.categorias || []).length
    });
  } catch (err) {
    console.error('Erro ao carregar API root:', err);
    window.apiData = {};
    window.produtos = window.produtos || [];
    window.categorias = window.categorias || [];
  }
}
fetchApiRoot();

// funções utilitárias para obter produtos e categorias a partir dos dados carregados
function getProdutos() {
  return Array.isArray(window.produtos) ? window.produtos : [];
}

function getCategorias() {
  return Array.isArray(window.categorias) ? window.categorias : [];
}

// ========= 1) localStorage: chave produtos-selecionados =========
const STORAGE_KEY = 'produtos-selecionados';
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, '[]'); // lista vazia
}
function obterSelecionados() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function guardarSelecionados(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// ========= 2) Arranque =========
document.addEventListener('DOMContentLoaded', () => {
  const listaProdutos =
    (Array.isArray(window.produtos) && window.produtos) ||
    (typeof produtos !== 'undefined' && Array.isArray(produtos) && produtos) ||
    null;

  if (!listaProdutos) return;

  carregarProdutos(listaProdutos);
  renderizarCesto();

  // popular select de categorias (tenta API, senão obtem das products carregadas)
  carregarCategorias();

  // ligar filtro (se existir)
  const filtro = document.getElementById('filtro-categoria');
  if (filtro) {
    filtro.addEventListener('change', function () {
      const cat = this.value;
      const lista = cat ? (window.produtos || []).filter(p => String(p.category) === cat) : (window.produtos || []);
      carregarProdutos(lista);
    });
  }

  const btnClear = document.getElementById('limpar-cesto');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      localStorage.setItem('produtos-selecionados', '[]');
      renderizarCesto();
    });
  }
});

// ========= 3) Renderizar produtos =========
function carregarProdutos(produtos) {
  const pai = document.querySelector('#lista-produtos') || document.querySelector('#produtos');
  if (!pai) {
    console.warn('não encontrado (#lista-produtos ou #produtos).');
    return;
  }

  // limpa pai antes de renderizar (permite re-render por filtro)
  pai.innerHTML = '';

  const frag = document.createDocumentFragment();

  produtos.forEach((produto) => {
    console.log(produto);
    console.log('id:', produto.id, 'title:', produto.title);

    const artigo = criarProduto(produto);

    if (pai.tagName.toLowerCase() === 'ul') {
      const li = document.createElement('li');
      li.appendChild(artigo);
      frag.appendChild(li);
    } else {
      frag.appendChild(artigo);
    }
  });

  pai.appendChild(frag);
}

// ========= 4) Criar card + botão adicionar =========
function criarProduto(produto) {
  const article = document.createElement('article');

  const h3 = document.createElement('h3');
  h3.textContent = produto.title || 'Sem título';
  article.appendChild(h3);

  if (produto.image) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = produto.image;
    img.alt = produto.title || 'Imagem do produto';
    img.loading = 'lazy';
    img.decoding = 'async';
    figure.appendChild(img);

    const cap = document.createElement('figcaption');
    cap.textContent = produto.category || '';
    figure.appendChild(cap);

    article.appendChild(figure);
  }

  if (produto.description) {
    const p = document.createElement('p');
    p.textContent = produto.description;
    article.appendChild(p);
  }

  if (produto.price != null) {
    const p = document.createElement('p');
    const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
    p.textContent = fmt.format(Number(produto.price));
    p.setAttribute('aria-label', 'preço');
    p.style.fontWeight = '600';
    article.appendChild(p);
  }

  // Botão "Adicionar ao cesto"
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Adicionar ao cesto';
  btn.addEventListener('click', () => {
    const lista = obterSelecionados();
    // Se quiseres somar quantidades: procura por id
    const idx = lista.findIndex(i => i.id === produto.id);
    if (idx >= 0) {
      lista[idx].quantidade = (lista[idx].quantidade || 1) + 1;
    } else {
      lista.push({
        id: produto.id,
        title: produto.title,
        price: Number(produto.price),
        image: produto.image || '',
        quantidade: 1
      });
    }
    guardarSelecionados(lista);
    renderizarCesto(); // atualiza a UI do cesto
  });
  article.appendChild(btn);

  const small = document.createElement('small');
  small.textContent = `ID: ${produto.id}`;
  article.appendChild(small);

  return article;
}

// ========= 5) Cesto (render + remover + limpar) =========
function renderizarCesto() {
  const container = document.querySelector('#lista-cesto');
  const totalOut = document.querySelector('#total-cesto');
  if (!container || !totalOut) return;

  const lista = obterSelecionados();
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = '<p>O cesto está vazio.</p>';
    totalOut.textContent = new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(0);
    return;
  }

  const ul = document.createElement('ul');
  let total = 0;

  lista.forEach(item => {
    const li = document.createElement('li');
    const art = document.createElement('article');

    const h4 = document.createElement('h4');
    h4.textContent = item.title;
    art.appendChild(h4);

    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title;
      img.loading = 'lazy';
      img.width = 72;
      art.appendChild(img);
    }

    const pQtd = document.createElement('p');
    pQtd.textContent = `Qtd: ${item.quantidade || 1}`;
    art.appendChild(pQtd);

    const fmt = new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'});
    const subtotal = (Number(item.price)||0) * (item.quantidade||1);
    total += subtotal;

    const pSub = document.createElement('p');
    pSub.textContent = `Subtotal: ${fmt.format(subtotal)}`;
    art.appendChild(pSub);

    const btnRem = document.createElement('button');
    btnRem.type = 'button';
    btnRem.textContent = 'Remover';
    btnRem.addEventListener('click', () => {
      const nova = obterSelecionados().filter(p => p.id !== item.id);
      guardarSelecionados(nova);
      renderizarCesto();
    });
    art.appendChild(btnRem);

    li.appendChild(art);
    ul.appendChild(li);
  });

  container.appendChild(ul);
  totalOut.textContent = new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(total);
}

function atualizarTotal(total) {
  const out = document.querySelector('#total-cesto');
  if (out) {
    const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
    out.textContent = fmt.format(total);
  }
}

// ========= categorias =========
// tenta obter categorias via endpoint; se falhar, gera a lista a partir de window.produtos
function carregarCategorias() {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;

  // tenta endpoint específico
  fetch('https://deisishop.pythonanywhere.com/categories/')
    .then(res => {
      if (!res.ok) throw new Error('não foi possível obter categorias do endpoint');
      return res.json();
    })
    .then(data => {
      let cats = [];
      if (Array.isArray(data)) {
        // data pode ser array de strings ou objetos {name:...}
        if (data.length && typeof data[0] === 'string') cats = data;
        else cats = data.map(c => c.name || c.title || String(c));
      }
      popularFiltroCategorias(cats);
    })
    .catch(() => {
      // fallback: extrair categorias dos produtos carregados
      const produtos = Array.isArray(window.produtos) ? window.produtos : [];
      const cats = Array.from(new Set(produtos.map(p => String(p.category || '').trim()).filter(Boolean)));
      popularFiltroCategorias(cats);
    });
}

function popularFiltroCategorias(categories) {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;

  // limpa mantendo a opção "Todas"
  const primeira = select.querySelector('option[value=""]');
  select.innerHTML = '';
  if (primeira) select.appendChild(primeira);
  else select.appendChild(new Option('Todas', ''));

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// --------- util: calcular total do cesto ----------
function calcularTotalCesto() {
  const lista = obterSelecionados();
  return lista.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qtd = Number(item.quantidade) || 1;
    return sum + price * qtd;
  }, 0);
}

// --------- util: aplicar desconto (estudante) ----------
function aplicarDesconto(total, isStudent = false /* coupon ignored */) {
  let discount = 0;
  // desconto estudante 25%
  if (isStudent) discount = 0.25;

  // nota: removido suporte a cupões conforme pedido (a caixa mantém-se no HTML)
  const totalAfter = total * (1 - discount);
  return { discountPercent: discount, totalAfter };
}

// --------- handler: comprar (POST /buy/) ----------
async function comprarHandler() {
  const lista = obterSelecionados();
  const msgEl = document.getElementById('checkout-message');
  if (!lista || lista.length === 0) {
    if (msgEl) msgEl.textContent = 'O cesto está vazio.';
    return;
  }

  const isStudent = !!document.getElementById('is-student')?.checked;
  const total = calcularTotalCesto();
  const { discountPercent, totalAfter } = aplicarDesconto(total, isStudent);

  const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  if (msgEl) msgEl.textContent = 'A processar pagamento...';

  const productsForApi = lista.map(item => ({
    product_id: item.id,
    quantity: Number(item.quantidade || 1)
  }));

  const payload = {
    products: productsForApi,
    total: Number(total.toFixed(2)),
    discountPercent: Number(discountPercent.toFixed(3)),
    totalAfter: Number(totalAfter.toFixed(2)),
    student: isStudent
  };

  console.log('BUY payload', payload);

  try {
    const res = await fetch(`${API_BASE}/buy/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // ler corpo como texto (pode ser vazio)
    const textBody = await res.text().catch(() => null);
    let jsonBody = null;
    try { jsonBody = textBody ? JSON.parse(textBody) : null; } catch (e) { jsonBody = null; }

    if (!res.ok) {
      // registar detalhes no console para debug, mas não os mostrar ao utilizador
      console.error('buy error status:', res.status, 'body:', textBody);

      const valorFinal = fmt.format(totalAfter);
      const referencia = '021125-0049 €';
      if (msgEl) {
        msgEl.innerHTML = [
          `Valor final a pagar(com eventuais descontos): ${valorFinal}`,
          `Referência de pagamento: ${referencia}`
        ].map(t => `<div>${t}</div>`).join('');
      }
      return;
    }

    // sucesso
    const resBody = jsonBody ?? textBody;
    console.log('buy success', res.status, resBody);

    guardarSelecionados([]);
    if (typeof renderizarCesto === 'function') renderizarCesto();

    const referencia = (jsonBody && (jsonBody.paymentReference || jsonBody.orderId || jsonBody.reference)) || '021125-0049 €';
    const valorFinal = fmt.format(totalAfter);

    if (msgEl) {
      msgEl.innerHTML = [
        `Valor final a pagar(com eventuais descontos): ${valorFinal}`,
        `Referência de pagamento: ${referencia}`
      ].map(t => `<div>${t}</div>`).join('');
    }
  } catch (err) {
    // registar detalhe e mostrar mensagem genérica na UI
    console.error('comprarHandler fetch error:', err);
    const valorFinal = fmt.format(totalAfter);
    const referencia = '021125-0049 €';
    if (msgEl) {
      msgEl.innerHTML = [
        `Valor final a pagar(com eventuais descontos): ${valorFinal}`,
        `Referência de pagamento: ${referencia}`,
        `<small style="color:#a00">Erro na comunicação com o servidor. Ver console para detalhes.</small>`
      ].map(t => `<div>${t}</div>`).join('');
    }
  }
}

// --------- ligar listener do botão comprar no arranque ----------
function ligarListenerComprar() {
  const btn = document.getElementById('comprar-btn');
  if (btn && !btn.dataset.bound) {
    btn.addEventListener('click', comprarHandler);
    btn.dataset.bound = '1';
  }
}