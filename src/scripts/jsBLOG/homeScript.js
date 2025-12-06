// Configuração da API - Endereço do servidor JSON onde os posts estão armazenados
const API_URL = "http://localhost:3000/posts";

// Função auxiliar para selecionar elementos do DOM de forma segura
// Evita erros se o elemento não existir
function getElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return element;
}

// Elementos do DOM - Variáveis que armazenam os principais elementos HTML da página
const articlesGrid = getElement(".articles-grid"); // Grade principal onde os artigos são exibidos
const featuredCard = getElement(".featured-card"); // Card grande de destaque (post principal)
const popularList = getElement(".popular-list"); // Lista lateral de posts populares
const loadMoreWrap = getElement(".load-more-wrap"); // Container do botão "Carregar mais"
const articlesCount = getElement(".articles-count"); // Elemento que mostra a contagem de artigos
const articlesHeaderH2 = document.querySelector(".articles-header h2"); // Título da seção de artigos
const mainTitle = document.querySelector(".main-title"); // Título principal da página

// Variáveis de paginação - Controlam qual parte dos posts está sendo exibida
let currentPage = 1; // Página atual (começa na 1)
const postsPerPage = 6; // Quantidade de posts exibidos por página
let allPosts = []; // Array que armazena TODOS os posts vindos da API
let postsFiltrados = []; // Array que armazena os posts após filtro de busca

// Variável para armazenar timeout da busca - Usada para evitar buscas a cada tecla pressionada
let searchTimeout;

// Quando o documento HTML estiver completamente carregado e pronto
document.addEventListener("DOMContentLoaded", function () {
  carregarTodosDados(); // 1. Carrega todos os dados da API
  inicializarNavegacao(); // 2. Configura navegação suave entre seções
  inicializarBuscaEmTempoReal(); // 3. Ativa o sistema de busca em tempo real
});

// Função principal que carrega TUDO da API
async function carregarTodosDados() {
  try {
    mostrarLoading(); // Mostra indicador de carregamento

    // Faz requisição HTTP GET para a API
    const response = await fetch(API_URL);

    // Verifica se a resposta foi bem-sucedida (status 200-299)
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    // Converte a resposta de JSON para objeto JavaScript
    allPosts = await response.json();

    // Se não houver posts, mostra estado vazio
    if (allPosts.length === 0) {
      mostrarEstadoVazio();
      return;
    }

    // Ordenar por data - Mais recentes primeiro
    // Converte strings de data para objetos Date e compara
    allPosts.sort((a, b) => {
      // Usa data de última edição se existir, senão usa data original
      const dataA = new Date(a.ultimaEdicao || a.data);
      const dataB = new Date(b.ultimaEdicao || b.data);
      return dataB - dataA;
    });
    
    // Cria cópia para usar em filtros sem modificar o original
    postsFiltrados = [...allPosts];

    // Resetar paginação - Volta para a primeira página
    currentPage = 1;

    // Carregar todos os componentes da página:
    carregarPostDestaque(postsFiltrados[0]); // 1. Post em destaque (o mais recente)
    carregarArtigosPagina(); // 2. Grid de artigos com paginação
    carregarPopulares(postsFiltrados.slice(0, 4)); // 3. Lista de populares (4 primeiros)
    atualizarEstatisticas(postsFiltrados); // 4. Atualiza contadores e títulos

    esconderLoading(); // Remove indicador de carregamento
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    mostrarErro(); // Mostra mensagem de erro na interface
    esconderLoading();
  }
}

// ===== SISTEMA DE PAGINAÇÃO =====
// Mostra apenas 6 posts por vez e controla o botão "Carregar mais"

function carregarArtigosPagina() {
  if (!articlesGrid) return; // Sai se o elemento não existir

  // Calcula índices dos posts a serem exibidos
  // Ex: página 1: startIndex=0, endIndex=6 (posts 0 a 5)
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  
  // Pega apenas os posts da página atual
  const postsPagina = postsFiltrados.slice(startIndex, endIndex);

  // Se for a primeira página, limpa o grid antes de adicionar
  if (currentPage === 1) {
    articlesGrid.innerHTML = "";
  }

  // Se não há posts para mostrar na página atual
  if (postsPagina.length === 0) {
    if (currentPage === 1) {
      // Se é a primeira página e não tem posts, mostra mensagem
      articlesGrid.innerHTML = `
        <div class="empty-articles">
          <p>Nenhum artigo encontrado.</p>
        </div>
      `;
    }
    return;
  }

  // Para cada post da página atual, cria e adiciona o card
  postsPagina.forEach((post) => {
    const cardElement = criarCardArtigo(post); // Cria elemento HTML do card
    articlesGrid.appendChild(cardElement); // Adiciona ao grid
  });

  // Controla a visibilidade do botão "Carregar mais"
  // Se ainda há posts após a página atual, mostra o botão
  if (endIndex < postsFiltrados.length) {
    mostrarBotaoCarregarMais();
  } else {
    esconderBotaoCarregarMais();
  }

  // Adiciona eventos de clique nos novos posts adicionados
  adicionarEventosPosts();
}

// Cria e mostra o botão "Carregar mais"
function mostrarBotaoCarregarMais() {
  let btnCarregarMais = document.getElementById("btnCarregarMais");

  // Se o botão não existe ainda, cria ele
  if (!btnCarregarMais) {
    btnCarregarMais = document.createElement("button");
    btnCarregarMais.id = "btnCarregarMais";
    btnCarregarMais.className = "btn-carregar-mais";
    btnCarregarMais.innerHTML = '<i class="fas fa-plus"></i> Carregar mais';
    
    // Quando clicado, carrega mais posts
    btnCarregarMais.addEventListener("click", carregarMaisPosts);

    // Adiciona o botão na posição correta da página
    if (loadMoreWrap) {
      loadMoreWrap.appendChild(btnCarregarMais);
    } else if (articlesGrid) {
      articlesGrid.parentNode.insertBefore(
        btnCarregarMais,
        articlesGrid.nextSibling
      );
    }
  }

  btnCarregarMais.style.display = "flex"; // Torna visível
}

// Esconde o botão "Carregar mais"
function esconderBotaoCarregarMais() {
  const btnCarregarMais = document.getElementById("btnCarregarMais");
  if (btnCarregarMais) {
    btnCarregarMais.style.display = "none"; // Torna invisível
  }
}

// Carrega a próxima página de posts
function carregarMaisPosts() {
  currentPage++; // Incrementa a página atual
  carregarArtigosPagina(); // Carrega os posts da nova página
}

// ===== FUNÇÕES PARA DATA/HORA =====

// Obtém a data formatada CORRETAMENTE
function obterDataFormatada(post) {
  try {
    // Prioridade: data da postagem original
    const dataParaFormatar = post.data || new Date().toISOString();
    return formatarData(dataParaFormatar);
  } catch {
    return "16, Fev"; // Fallback
  }
}

// Obtém o horário relativo CORRETAMENTE
function obterHorarioRelativo(post) {
  try {
    // Para determinar "há quanto tempo foi publicado/editado"
    // Se tem data de última edição, usa ela, senão usa data de criação
    const dataReferencia = post.ultimaEdicao || post.data || new Date().toISOString();
    return calcularTempoRelativo(dataReferencia);
  } catch {
    return "12 minutos"; // Fallback
  }
}

// Indica se o post foi editado
function foiEditado(post) {
  return post.ultimaEdicao && post.ultimaEdicao !== post.data;
}

// ===== 1. POST EM DESTAQUE =====
// Atualiza o card grande de destaque com o primeiro post
function carregarPostDestaque(post) {
  if (!featuredCard || !post) return; // Sai se não houver elemento ou post

  // Encontra o link dentro do card de destaque
  const featuredLink = featuredCard.querySelector(".featured-link");
  if (!featuredLink) {
    console.error("Elemento .featured-link não encontrado");
    return;
  }

  // Seleciona elementos filhos do link
  const featuredMedia = featuredLink.querySelector(".featured-media img"); // Imagem
  const featuredCategory = featuredLink.querySelector(".featured-category"); // Categoria
  const featuredTitle = featuredLink.querySelector(".featured-title"); // Título
  const featuredMeta = featuredLink.querySelector(".featured-meta"); // Data e hora

  // Atualiza a imagem
  if (featuredMedia) {
    featuredMedia.src = post.imagem; // URL da imagem
    featuredMedia.alt = post.titulo; // Texto alternativo
    
    // Se a imagem não carregar, usa uma imagem padrão
    featuredMedia.onerror = function () {
      this.src =
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop";
    };
  }

  // Atualiza categoria
  if (featuredCategory) {
    featuredCategory.textContent = post.categoria || "TECNOLOGIA"; // Usa padrão se não tiver
  }

  // Atualiza título
  if (featuredTitle) {
    featuredTitle.textContent = post.titulo;
  }

  // Atualiza data e hora
  if (featuredMeta) {
    // Usa as novas funções para obter data e hora corretas
    const dataFormatada = obterDataFormatada(post);
    const horarioFormatado = obterHorarioRelativo(post);
    const editado = foiEditado(post) ? " (Editado)" : "";

    featuredMeta.innerHTML = `
            <span>📅 ${dataFormatada}</span>
            <span>•</span>
            <span>🕐 ${horarioFormatado}${editado}</span>
        `;
  }

  // Configura o link para apontar para o post específico
  featuredLink.href = `#post-${post.id}`; // Link âncora
  featuredLink.setAttribute("data-id", post.id); // ID para identificação
  featuredLink.setAttribute("data-title", post.titulo); // Título para referência
}

// ===== 2. CRIAÇÃO DE CARDS =====
// Cria o HTML para um card de artigo normal (no grid)
function criarCardArtigo(post) {
  // Usa as novas funções para data e hora
  const dataFormatada = obterDataFormatada(post);
  const horarioFormatado = obterHorarioRelativo(post);
  const editado = foiEditado(post) ? " (Editado)" : "";

  // Template HTML do card
  const cardHTML = `
        <article class="card" data-category="${post.categoria || "TECNOLOGIA"}">
            <a href="#post-${post.id}" class="card-link" data-id="${post.id}" data-title="${post.titulo}">
                <div class="card-media">
                    <img src="${post.imagem}" alt="${post.titulo}" 
                         onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop'"/>
                </div>
                <div class="card-body">
                    <span class="card-category">${post.categoria || "TECNOLOGIA"}</span>
                    <h4>${post.titulo}</h4>
                    <div class="card-meta">
                        <span>📅 ${dataFormatada}</span>
                        <span>•</span>
                        <span>🕐 ${horarioFormatado}${editado}</span>
                    </div>
                </div>
            </a>
        </article>
    `;

  // Converte string HTML para elemento DOM real
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cardHTML;
  return tempDiv.firstElementChild; // Retorna o elemento criado
}

// ===== 3. POSTS POPULARES =====
// Atualiza a lista lateral de posts populares
function carregarPopulares(posts) {
  if (!popularList || !posts || posts.length === 0) return;

  // Converte array de posts em HTML e insere na lista
  popularList.innerHTML = posts.map((post) => criarItemPopular(post)).join("");
  
  // Adiciona eventos de clique nos itens criados
  adicionarEventosPosts();
}

// Cria HTML para um item da lista de populares
function criarItemPopular(post) {
  const dataFormatada = obterDataFormatada(post);
  const horarioFormatado = obterHorarioRelativo(post);
  const editado = foiEditado(post) ? " (Editado)" : "";

  return `
        <li class="popular-item">
            <a href="#post-${post.id}" class="popular-link" data-id="${post.id}" data-title="${post.titulo}">
                <div class="thumb">
                    <img src="${post.imagem}" alt="${post.titulo}"
                         onerror="this.src='https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&h=100&fit=crop'"/>
                </div>
                <div class="popular-meta">
                    <span class="popular-category">${post.categoria || "TECNOLOGIA"}</span>
                    <span class="popular-title">${post.titulo}</span>
                    <small class="popular-stats">${dataFormatada} • ${horarioFormatado}${editado}</small>
                </div>
            </a>
        </li>
    `;
}

// ===== 4. ATUALIZAR ESTATÍSTICAS =====
// Atualiza contadores e títulos da página
function atualizarEstatisticas(posts) {
  // Atualiza contador de artigos (ex: "15 artigos")
  if (articlesCount) {
    articlesCount.textContent = `${posts.length} artigos`;
  }

  // Atualiza título da seção
  if (articlesHeaderH2) {
    articlesHeaderH2.textContent = "Artigos";
  }
  
  // Atualiza título principal da página
  if (mainTitle) {
    mainTitle.textContent = "TECH BLOG";
  }
}

// ===== 5. SISTEMA DE BUSCA EM TEMPO REAL =====
// Configura a busca que filtra posts enquanto digita
function inicializarBuscaEmTempoReal() {
  const searchForm = document.querySelector(".search-form");
  if (!searchForm) {
    console.warn("Formulário de busca não encontrado");
    return;
  }

  const searchInput = searchForm.querySelector('input[type="search"]');
  if (!searchInput) return;

  // Busca em tempo real enquanto digita
  searchInput.addEventListener("input", function() {
    clearTimeout(searchTimeout); // Cancela busca anterior
    
    const termo = this.value.trim(); // Texto digitado
    
    // Se o campo estiver vazio, mostra todos os posts
    if (termo.length === 0) {
      limparBusca();
      return;
    }
    
    // Aguardar 300ms após parar de digitar para fazer a busca
    // Isso evita fazer busca a cada letra digitada
    searchTimeout = setTimeout(() => {
      realizarBusca(termo);
    }, 300);
  });

  // Evitar submit do formulário (já fazemos busca em tempo real)
  searchForm.addEventListener("submit", function(e) {
    e.preventDefault(); // Impede recarregamento da página
    const termo = searchInput.value.trim();
    if (termo) {
      realizarBusca(termo);
    }
  });
}

// Executa a busca de fato
function realizarBusca(termo) {
  console.log("Buscando por:", termo);
  
  // Se o termo for muito curto, não busca
  if (termo.length < 2) {
    limparBusca();
    return;
  }

  // Filtra posts que contenham o termo em algum campo
  postsFiltrados = allPosts.filter(
    (post) =>
      post.titulo.toLowerCase().includes(termo.toLowerCase()) || // No título
      (post.conteudo && post.conteudo.toLowerCase().includes(termo.toLowerCase())) || // No conteúdo
      (post.categoria && post.categoria.toLowerCase().includes(termo.toLowerCase())) || // Na categoria
      (post.autor && post.autor.toLowerCase().includes(termo.toLowerCase())) // No autor
  );

  // Resetar paginação para busca
  currentPage = 1;

  // Se encontrou resultados
  if (postsFiltrados.length > 0) {
    // Mostra o primeiro resultado em destaque
    carregarPostDestaque(postsFiltrados[0]);
    // Recarrega artigos com paginação
    carregarArtigosPagina();
    
    // Atualiza os populares com base na busca
    carregarPopulares(postsFiltrados.slice(0, 4));

    // Mostrar contador de resultados
    mostrarContadorResultados(postsFiltrados.length, termo);

    // Atualizar estatísticas
    atualizarEstatisticas(postsFiltrados);

    // Mostrar featured card
    if (featuredCard) {
      featuredCard.style.display = "block";
    }
  } else {
    // Nenhum resultado encontrado
    if (articlesGrid) {
      articlesGrid.innerHTML = `
        <div class="no-results">
          <h3>🔍 Nenhum resultado encontrado</h3>
          <p>Não encontramos posts para "<strong>${termo}</strong>"</p>
          <button onclick="limparBusca()" class="btn btn-outline">Limpar busca</button>
        </div>
      `;
    }

    // Limpar populares
    if (popularList) {
      popularList.innerHTML = `<li class="popular-item no-results-popular">Nenhum resultado encontrado para "${termo}"</li>`;
    }

    // Esconder post em destaque e botão carregar mais
    if (featuredCard) {
      featuredCard.style.display = "none";
    }
    esconderBotaoCarregarMais();

    // Atualizar estatísticas
    atualizarEstatisticas([]);
  }
}

// Mostra contador de resultados da busca
function mostrarContadorResultados(total, termo) {
  // Remove contador anterior se existir
  const contadorAnterior = document.getElementById("contador-resultados");
  if (contadorAnterior) {
    contadorAnterior.remove();
  }

  // Cria novo contador
  const contador = document.createElement("div");
  contador.id = "contador-resultados";
  contador.className = "contador-resultados";

  // Posiciona antes da grid de artigos
  if (articlesGrid && articlesGrid.parentNode) {
    const articlesSection = articlesGrid.closest(".articles");
    if (articlesSection) {
      articlesSection.insertBefore(contador, articlesGrid);
    } else {
      articlesGrid.parentNode.insertBefore(contador, articlesGrid);
    }
  }

  // HTML do contador
  contador.innerHTML = `
        <span>${total} resultado(s) encontrado(s) para "<strong>${termo}</strong>"</span>
        <button onclick="limparBusca()" class="btn-limpar-busca">✕ Limpar busca</button>
    `;
}

// Limpa a busca e volta a mostrar todos os posts
function limparBusca() {
  // Limpa campo de busca
  const searchInput = document.querySelector('.search-form input[type="search"]');
  if (searchInput) {
    searchInput.value = "";
  }

  // Remove contador de resultados
  const contador = document.getElementById("contador-resultados");
  if (contador) contador.remove();

  // Mostra card de destaque novamente
  if (featuredCard) {
    featuredCard.style.display = "block";
  }

  // Restaura todos os posts
  postsFiltrados = [...allPosts];
  currentPage = 1;
  
  // Recarrega todos os dados originais
  carregarPostDestaque(postsFiltrados[0]);
  carregarArtigosPagina();
  carregarPopulares(postsFiltrados.slice(0, 4));
  atualizarEstatisticas(postsFiltrados);
}

// ===== FUNÇÕES AUXILIARES =====

// Formata data no padrão "16, Fev"
function formatarData(dataString) {
  try {
    const data = new Date(dataString);
    const dia = data.getDate(); // Dia do mês (1-31)
    // Mês abreviado (Fev, Mar, etc.)
    const mes = data
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", ""); // Remove ponto da abreviação
    return `${dia}, ${mes}`;
  } catch {
    return "16, Fev"; // Valor padrão em caso de erro
  }
}

// Calcula tempo relativo: "há 5 minutos", "há 2 horas", etc.
function calcularTempoRelativo(dataString) {
  try {
    const dataPost = new Date(dataString); // Data do post
    const agora = new Date(); // Data/hora atual
    const diferencaMs = agora - dataPost; // Diferença em milissegundos
    
    // Converter para segundos
    const diferencaSegundos = Math.floor(diferencaMs / 1000);
    
    if (diferencaSegundos < 60) {
      return "agora há pouco";
    }
    
    const diferencaMinutos = Math.floor(diferencaSegundos / 60);
    if (diferencaMinutos < 60) {
      return `${diferencaMinutos} min${diferencaMinutos > 1 ? '' : ''}`;
    }
    
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    if (diferencaHoras < 24) {
      return `${diferencaHoras} h`;
    }
    
    const diferencaDias = Math.floor(diferencaHoras / 24);
    if (diferencaDias < 30) {
      return `${diferencaDias} dia${diferencaDias > 1 ? 's' : ''}`;
    }
    
    const diferencaMeses = Math.floor(diferencaDias / 30);
    if (diferencaMeses < 12) {
      return `${diferencaMeses} mês${diferencaMeses > 1 ? 'es' : ''}`;
    }
    
    const diferencaAnos = Math.floor(diferencaMeses / 12);
    return `${diferencaAnos} ano${diferencaAnos > 1 ? 's' : ''}`;
  } catch {
    return "12 minutos"; // Valor padrão em caso de erro
  }
}

// Adiciona eventos de clique em todos os links de posts
function adicionarEventosPosts() {
  // Seleciona todos os links de posts (cards, populares, destaque)
  const links = document.querySelectorAll(".card-link, .popular-link, .featured-link");
  
  // Remove event listeners existentes para evitar duplicação
  links.forEach(link => {
    link.removeEventListener("click", handlePostClick);
  });

  // Adiciona novos event listeners
  links.forEach((link) => {
    link.addEventListener("click", handlePostClick);
  });
}

// Manipula clique em qualquer link de post
function handlePostClick(e) {
  e.preventDefault(); // Impede comportamento padrão do link
  
  const postId = this.getAttribute("data-id"); // ID do post
  const postTitle = this.getAttribute("data-title"); // Título do post
  
  abrirPost(postId, postTitle); // Abre o post
}

// Abre/visualiza um post específico
function abrirPost(postId, postTitle) {
  console.log("Abrindo post:", postId, postTitle);

  // Verifica se está na página inicial
  const isHomePage =
    window.location.pathname.includes("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith(".html");

  if (isHomePage) {
    // Se está na home, apenas rola até o post
    const post = allPosts.find(p => p.id == postId);
    if (post) {
      const postElement = document.querySelector(`[data-id="${postId}"]`);
      if (postElement) {
        // Rola suavemente até o post
        postElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        
        // Adiciona destaque visual temporário (borda azul)
        postElement.style.transition = "all 0.3s ease";
        postElement.style.boxShadow = "0 0 0 3px var(--color-primary)";
        setTimeout(() => {
          postElement.style.boxShadow = ""; // Remove destaque após 2 segundos
        }, 2000);
      }
    }
  } else {
    // Se não está na home, vai para a home com âncora
    window.location.href = `index.html#post-${postId}`;
  }
}

// Configura navegação suave para links âncora (#section)
function inicializarNavegacao() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#") {
        e.preventDefault(); // Impede comportamento padrão
        
        const target = document.querySelector(href); // Encontra elemento alvo
        if (target) {
          // Rola suavemente até o elemento
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

// ===== LOADING E ESTADOS =====
// Mostra indicador de carregamento
function mostrarLoading() {
  if (!articlesGrid) return;

  let loading = document.getElementById("loading-blog");
  if (!loading) {
    // Cria elemento de loading
    loading = document.createElement("div");
    loading.id = "loading-blog";
    loading.className = "loading-blog";
    loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Carregando posts...</p>
        `;

    // Insere antes da grid de artigos
    const articlesSection = articlesGrid.closest(".articles");
    if (articlesSection) {
      articlesSection.insertBefore(loading, articlesGrid);
    } else {
      articlesGrid.parentNode.insertBefore(loading, articlesGrid);
    }
  }
  articlesGrid.style.opacity = "0.5"; // Torna grid semi-transparente
}

// Esconde indicador de carregamento
function esconderLoading() {
  const loading = document.getElementById("loading-blog");
  if (loading) loading.remove(); // Remove elemento
  
  if (articlesGrid) {
    articlesGrid.style.opacity = "1"; // Restaura opacidade
  }
}

// ===== TRATAMENTO DE ERROS =====
// Mostra mensagem de erro de conexão
function mostrarErro() {
  if (!articlesGrid) return;

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

// Abre a API no navegador para verificação
function verificarServidor() {
  window.open("http://localhost:3000/posts", "_blank");
}

// Mostra estado quando não há posts
function mostrarEstadoVazio() {
  if (!articlesGrid) return;

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

// Exportar funções para uso global (disponíveis no console)
window.limparBusca = limparBusca;
window.carregarTodosDados = carregarTodosDados;
window.verificarServidor = verificarServidor;
window.carregarMaisPosts = carregarMaisPosts;
window.abrirPost = abrirPost;
window.realizarBusca = realizarBusca;