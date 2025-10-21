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
