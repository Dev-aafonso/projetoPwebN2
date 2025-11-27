// Configuração da API
const API_URL = "http://localhost:3000/posts";

// Elementos do DOM
const articlesGrid = document.querySelector(".articles-grid");
const featuredCard = document.querySelector(".featured-card");
const popularList = document.querySelector(".popular-list");
const loadMoreWrap = document.querySelector(".load-more-wrap");

// Variáveis de paginação
let currentPage = 1;
const postsPerPage = 6; // 6 posts por página (2 linhas de 3)
let allPosts = [];
let postsFiltrados = [];

// Carregar posts quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  carregarTodosDados();
  inicializarNavegacao();
});

// Função principal que carrega TUDO
async function carregarTodosDados() {
  try {
    mostrarLoading();

    const response = await fetch(API_URL);
    allPosts = await response.json();

    if (allPosts.length === 0) {
      mostrarEstadoVazio();
      return;
    }

    // Ordenar por data (mais recentes primeiro)
    allPosts.sort((a, b) => new Date(b.data) - new Date(a.data));
    postsFiltrados = [...allPosts]; // Inicialmente, todos os posts estão filtrados

    // Resetar paginação
    currentPage = 1;

    // ===== CARREGAR TODOS OS COMPONENTES =====

    // 1. Post em Destaque (primeiro post)
    carregarPostDestaque(postsFiltrados[0]);

    // 2. Grid de Artigos com paginação
    carregarArtigosPagina();

    // 3. Posts Populares (3 primeiros posts)
    carregarPopulares(postsFiltrados.slice(0, 3));

    // 4. Atualizar contadores e estatísticas
    atualizarEstatisticas(postsFiltrados);

    // 5. Inicializar busca
    inicializarBusca();

    esconderLoading();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    mostrarErro();
    esconderLoading();
  }
}

// ===== SISTEMA DE PAGINAÇÃO =====

function carregarArtigosPagina() {
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsPagina = postsFiltrados.slice(startIndex, endIndex);

  // Se for a primeira página, limpa o grid
  if (currentPage === 1) {
    articlesGrid.innerHTML = "";
  }

  if (postsPagina.length === 0) {
    if (currentPage === 1) {
      articlesGrid.innerHTML = `
                <div class="empty-articles">
                    <p>Nenhum artigo encontrado.</p>
                </div>
            `;
    }
    return;
  }

  // Adiciona os posts da página atual
  postsPagina.forEach((post, index) => {
    // Pula o primeiro post da primeira página (já está em destaque)
    if (currentPage === 1 && index === 0) return;

    const cardElement = criarCardArtigo(post);
    articlesGrid.appendChild(cardElement);
  });

  // Controla a visibilidade do botão "Carregar mais"
  if (endIndex < postsFiltrados.length) {
    mostrarBotaoCarregarMais();
  } else {
    esconderBotaoCarregarMais();
  }

  // Adicionar eventos de clique nos novos posts
  adicionarEventosPosts();
}

// Cria e exibe o botão "Carregar mais"
function mostrarBotaoCarregarMais() {
  let btnCarregarMais = document.getElementById("btnCarregarMais");

  // Cria o botão se não existir
  if (!btnCarregarMais) {
    btnCarregarMais = document.createElement("button");
    btnCarregarMais.id = "btnCarregarMais";
    btnCarregarMais.className = "btn-carregar-mais";
    btnCarregarMais.innerHTML = '<i class="fas fa-plus"></i> Carregar mais';
    btnCarregarMais.addEventListener("click", carregarMaisPosts);

    // Adiciona o botão no container load-more-wrap
    if (loadMoreWrap) {
      loadMoreWrap.appendChild(btnCarregarMais);
    } else {
      // Fallback: adiciona após o grid de artigos
      articlesGrid.parentNode.insertBefore(
        btnCarregarMais,
        articlesGrid.nextSibling
      );
    }
  }

  btnCarregarMais.style.display = "flex"; // Torna o botão visível
}

// Esconde o botão "Carregar mais"
function esconderBotaoCarregarMais() {
  const btnCarregarMais = document.getElementById("btnCarregarMais");
  if (btnCarregarMais) {
    btnCarregarMais.style.display = "none";
  }
}

// Carrega a próxima página de posts
function carregarMaisPosts() {
  currentPage++;
  carregarArtigosPagina();
}

// ===== 1. POST EM DESTAQUE =====
function carregarPostDestaque(post) {
  if (!post) return;

  const featuredLink = featuredCard.querySelector(".featured-link");
  const featuredMedia = featuredLink.querySelector(".featured-media img");
  const featuredCategory = featuredLink.querySelector(".featured-category");
  const featuredTitle = featuredLink.querySelector(".featured-title");
  const featuredMeta = featuredLink.querySelector(".featured-meta");

  // Usar dados do admin diretamente
  featuredMedia.src = post.imagem;
  featuredMedia.alt = post.titulo;
  featuredCategory.textContent = post.categoria || "TECNOLOGIA";
  featuredTitle.textContent = post.titulo;

  // Usar data e horário do admin (se existirem) ou calcular
  const dataFormatada = post.dataBlog || formatarData(post.data);
  const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

  featuredMeta.innerHTML = `
        <span>📅 ${dataFormatada}</span>
        <span>•</span>
        <span>🕐 ${horarioFormatado}</span>
    `;

  // Link para o post (usando ID do admin)
  featuredLink.href = `#post-${post.id}`;
  featuredLink.setAttribute("data-id", post.id);
  featuredLink.setAttribute("data-title", post.titulo);
}

// ===== 2. CRIAÇÃO DE CARDS =====
function criarCardArtigo(post) {
  // Usar dados do admin diretamente
  const dataFormatada = post.dataBlog || formatarData(post.data);
  const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

  const cardHTML = `
        <article class="card" data-category="${post.categoria || "TECNOLOGIA"}">
            <a href="#post-${post.id}" class="card-link" data-id="${
    post.id
  }" data-title="${post.titulo}">
                <div class="card-media">
                    <img src="${post.imagem}" alt="${post.titulo}" 
                         onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop'"/>
                </div>
                <div class="card-body">
                    <span class="card-category">${
                      post.categoria || "TECNOLOGIA"
                    }</span>
                    <h4>${post.titulo}</h4>
                    <div class="card-meta">
                        <span>${dataFormatada}</span>
                        <span>•</span>
                        <span>${horarioFormatado}</span>
                    </div>
                </div>
            </a>
        </article>
    `;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cardHTML;
  return tempDiv.firstElementChild;
}

// ===== 3. POSTS POPULARES =====
function carregarPopulares(posts) {
  if (!posts || posts.length === 0) return;

  popularList.innerHTML = posts.map((post) => criarItemPopular(post)).join("");
}

function criarItemPopular(post) {
  const dataFormatada = post.dataBlog || formatarData(post.data);
  const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

  return `
        <li class="popular-item">
            <a href="#post-${post.id}" class="popular-link" data-id="${
    post.id
  }" data-title="${post.titulo}">
                <div class="thumb">
                    <img src="${post.imagem}" alt="${post.titulo}"
                         onerror="this.src='https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&h=100&fit=crop'"/>
                </div>
                <div class="popular-meta">
                    <span class="popular-category">${
                      post.categoria || "TECNOLOGIA"
                    }</span>
                    <span class="popular-title">${post.titulo}</span>
                    <small class="popular-stats">${dataFormatada} • ${horarioFormatado}</small>
                </div>
            </a>
        </li>
    `;
}

// ===== 4. ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas(posts) {
  // Atualizar contador de artigos
  const articlesHeader = document.querySelector(".articles-header");
  if (articlesHeader) {
    articlesHeader.textContent = `Artigos (${posts.length})`;
  }

  // Atualizar hero section com dados dinâmicos
  atualizarHeroSection(posts);
}

function atualizarHeroSection(posts) {
  const totalArtigos = posts.length;
  const categorias = [...new Set(posts.map((p) => p.categoria))];

  // Atualizar subtítulo do hero se existir
  const heroSub = document.querySelector(".hero-sub");
  if (heroSub && totalArtigos > 0) {
    heroSub.innerHTML = `
            ${totalArtigos} artigos publicados • ${categorias.length} categorias<br>
            Conteúdo atualizado, direto e feito por quem vive código.
        `;
  }
}

// ===== 5. SISTEMA DE BUSCA =====
function inicializarBusca() {
  const searchForm = document.querySelector(".search-form");
  if (!searchForm) return;

  const searchInput = searchForm.querySelector('input[type="search"]');

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const termo = searchInput.value.trim();
    if (termo) {
      buscarPosts(termo);
    } else {
      limparBusca();
    }
  });

  // Busca em tempo real
  searchInput.addEventListener("input", function () {
    const termo = this.value.trim();
    if (termo.length >= 2) {
      buscarPosts(termo);
    } else if (termo.length === 0) {
      limparBusca();
    }
  });
}

function buscarPosts(termo) {
  postsFiltrados = allPosts.filter(
    (post) =>
      post.titulo.toLowerCase().includes(termo.toLowerCase()) ||
      post.conteudo.toLowerCase().includes(termo.toLowerCase()) ||
      (post.categoria &&
        post.categoria.toLowerCase().includes(termo.toLowerCase())) ||
      (post.autor && post.autor.toLowerCase().includes(termo.toLowerCase()))
  );

  // Resetar paginação para busca
  currentPage = 1;

  if (postsFiltrados.length > 0) {
    // Mostra o primeiro resultado em destaque
    carregarPostDestaque(postsFiltrados[0]);
    // Recarrega artigos com paginação
    carregarArtigosPagina();

    // Mostrar contador de resultados
    mostrarContadorResultados(postsFiltrados.length, termo);
  } else {
    articlesGrid.innerHTML = `
            <div class="no-results">
                <h3>🔍 Nenhum resultado encontrado</h3>
                <p>Não encontramos posts para "<strong>${termo}</strong>"</p>
                <button onclick="limparBusca()" class="btn btn-outline">Limpar busca</button>
            </div>
        `;

    // Esconder post em destaque e botão carregar mais
    featuredCard.style.display = "none";
    esconderBotaoCarregarMais();
  }
}

function mostrarContadorResultados(total, termo) {
  let contador = document.getElementById("contador-resultados");
  if (!contador) {
    contador = document.createElement("div");
    contador.id = "contador-resultados";
    contador.className = "contador-resultados";
    articlesGrid.parentNode.insertBefore(contador, articlesGrid);
  }

  contador.innerHTML = `
        <span>${total} resultado(s) encontrado(s) para "<strong>${termo}</strong>"</span>
        <button onclick="limparBusca()" class="btn-limpar-busca">✕</button>
    `;
}

function limparBusca() {
  const searchInput = document.querySelector(
    '.search-form input[type="search"]'
  );
  if (searchInput) searchInput.value = "";

  const contador = document.getElementById("contador-resultados");
  if (contador) contador.remove();

  featuredCard.style.display = "block";
  postsFiltrados = [...allPosts];
  currentPage = 1;
  carregarTodosDados();
}

// ===== FUNÇÕES AUXILIARES =====

// Formatar data do ISO para o formato do blog
function formatarData(dataString) {
  try {
    const data = new Date(dataString);
    const dia = data.getDate();
    const mes = data
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    return `${dia}, ${mes}`;
  } catch {
    return "16, Fev"; // Fallback
  }
}

// Calcular tempo relativo (ex: "Editado há 12 minutos")
function calcularTempoRelativo(dataString) {
  try {
    const dataPost = new Date(dataString);
    const agora = new Date();
    const diferencaMs = agora - dataPost;
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));

    if (diferencaMinutos < 1) return "Editado agora há pouco";
    if (diferencaMinutos < 60) return `Editado há ${diferencaMinutos} minutos`;

    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    if (diferencaHoras < 24) return `Editado há ${diferencaHoras} horas`;

    const diferencaDias = Math.floor(diferencaHoras / 24);
    return `Editado há ${diferencaDias} dias`;
  } catch {
    return "Editado há 12 minutos"; // Fallback
  }
}

// Adicionar eventos de clique nos posts
function adicionarEventosPosts() {
  document
    .querySelectorAll(".card-link, .popular-link, .featured-link")
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const postId = this.getAttribute("data-id");
        const postTitle = this.getAttribute("data-title");
        abrirPost(postId, postTitle);
      });
    });
}

// Função para abrir post
function abrirPost(postId, postTitle) {
  console.log("Abrindo post:", postId, postTitle);

  // Scroll suave para o post
  const postElement = document.querySelector(`[data-id="${postId}"]`);
  if (postElement) {
    postElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

// Inicializar navegação suave
function inicializarNavegacao() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

// ===== LOADING E ESTADOS =====
function mostrarLoading() {
  let loading = document.getElementById("loading-blog");
  if (!loading) {
    loading = document.createElement("div");
    loading.id = "loading-blog";
    loading.className = "loading-blog";
    loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Carregando posts...</p>
        `;
    articlesGrid.parentNode.insertBefore(loading, articlesGrid);
  }
  articlesGrid.style.opacity = "0.5";
}

function esconderLoading() {
  const loading = document.getElementById("loading-blog");
  if (loading) loading.remove();
  articlesGrid.style.opacity = "1";
}

// ===== TRATAMENTO DE ERROS =====
function mostrarErro() {
  articlesGrid.innerHTML = `
        <div class="error-message">
            <h3>😕 Erro de Conexão</h3>
            <p>Não foi possível carregar os posts do blog.</p>
            <p>Verifique se o JSON Server está rodando na porta 3000.</p>
            <div class="error-actions">
                <button onclick="carregarTodosDados()" class="btn btn-primary">
                    🔄 Tentar Novamente
                </button>
                <button onclick="verificarServidor()" class="btn btn-outline">
                    🔍 Verificar Servidor
                </button>
            </div>
        </div>
    `;
}

function verificarServidor() {
  window.open("http://localhost:3000/posts", "_blank");
}

function mostrarEstadoVazio() {
  articlesGrid.innerHTML = `
        <div class="empty-state-blog">
            <h3>📝 Blog Vazio</h3>
            <p>Nenhum post encontrado no banco de dados.</p>
            <p>Acesse o painel admin para criar o primeiro post!</p>
            <div class="empty-actions">
                <a href="../admin/Adm.html" class="btn btn-primary">
                    🚀 Ir para o Admin
                </a>
                <button onclick="carregarTodosDados()" class="btn btn-outline">
                    🔄 Recarregar
                </button>
            </div>
        </div>
    `;
}

// Exportar funções para uso global
window.limparBusca = limparBusca;
window.carregarTodosDados = carregarTodosDados;
window.verificarServidor = verificarServidor;
window.carregarMaisPosts = carregarMaisPosts;
