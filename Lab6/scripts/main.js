// main.js

// -------------------------------
// 1) Inicialização do localStorage
// -------------------------------
const STORAGE_KEY = 'produtos-selecionados';
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, '[]'); // lista vazia
}

// Helpers de storage
function obterSelecionados() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function guardarSelecionados(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// -------------------------------
// 2) Ao carregar o DOM: render de produtos
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // deteta a variável produtos mesmo que tenha sido declarada como const
  const listaProdutos =
    (typeof window !== 'undefined' && Array.isArray(window.produtos)) ? window.produtos :
    (typeof produtos !== 'undefined' && Array.isArray(produtos)) ? produtos :
    null;

  if (!listaProdutos) {
    console.warn('⚠️ Não encontrei a lista "produtos". Verifica a ordem dos scripts.');
    return;
  }

  carregarProdutos(listaProdutos);
});

// -------------------------------------------
// 3) Função: carregarProdutos(produtos)
//    - percorre com forEach
//    - faz console.log(produto) e campos id/title
//    - insere <article> no nó-pai (sem <div>)
// -------------------------------------------
function carregarProdutos(produtos) {
  const pai = document.querySelector('#lista-produtos') || document.querySelector('#produtos');
  if (!pai) {
    console.warn('⚠️ Nó pai não encontrado (#lista-produtos ou #produtos).');
    return;
  }

  const frag = document.createDocumentFragment();

  produtos.forEach((produto) => {
    console.log(produto); // objeto completo
    console.log('id:', produto.id, 'title:', produto.title); // campos específicos

    const artigo = criarProduto(produto);

    // Se o pai for <ul>, embrulha em <li>; caso contrário, insere diretamente
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

// ------------------------------------------------------
// 4) Função: criarProduto(produto)
//    - cria <article> (sem <div>)
//    - cria título, imagem (com alt), descrição e preço
//    - cria botão "+ Adicionar ao cesto" com eventListener
// ------------------------------------------------------
function criarProduto(produto) {
  const article = document.createElement('article');

  // Título (usar h3 se a section já tiver h2)
  const h3 = document.createElement('h3');
  h3.textContent = produto.title || 'Sem título';
  article.appendChild(h3);

  // Imagem com alt
  if (produto.image) {
    const figure = document.createElement('figure');

    const img = document.createElement('img');
    img.src = produto.image;
    img.alt = produto.title || 'Imagem do produto';
    img.loading = 'lazy';
    img.decoding = 'async';
    figure.appendChild(img);

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = produto.category || '';
    figure.appendChild(figcaption);

    article.appendChild(figure);
  }

  // Descrição
  if (produto.description) {
    const pDesc = document.createElement('p');
    pDesc.textContent = produto.description;
    article.appendChild(pDesc);
  }

  // Preço
  if (produto.price != null) {
    const pPreco = document.createElement('p');
    const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
    pPreco.textContent = fmt.format(Number(produto.price));
    pPreco.setAttribute('aria-label', 'preço');
    article.appendChild(pPreco);
  }

  // Botão "+ Adicionar ao cesto"
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '+ Adicionar ao cesto';
  // 5) EventListener do botão: adiciona ao localStorage
  btn.addEventListener('click', () => {
    const lista = obterSelecionados();
    // Requisito: adicionar o produto à lista — push simples
    lista.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image
    });
    guardarSelecionados(lista);
    console.log(`✅ "${produto.title}" adicionado ao cesto (localStorage).`);
    // Opcional: emitir evento para UI do cesto reagir
    document.dispatchEvent(new CustomEvent('cesto:atualizado', { detail: lista }));
  });
  article.appendChild(btn);

  // Meta: ID do produto
  const small = document.createElement('small');
  small.textContent = `ID: ${produto.id}`;
  article.appendChild(small);

  return article;
}
