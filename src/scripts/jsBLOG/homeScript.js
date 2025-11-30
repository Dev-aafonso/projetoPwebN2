// Configuração da API
const API_URL = "http://localhost:3000/posts";

// Função auxiliar para elementos DOM
function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Elemento não encontrado: ${selector}`);
    }
    return element;
}

// Elementos do DOM
const articlesGrid = getElement(".articles-grid");
const featuredCard = getElement(".featured-card");
const popularList = getElement(".popular-list");
const loadMoreWrap = getElement(".load-more-wrap");

// Variáveis de paginação
let currentPage = 1;
const postsPerPage = 6;
let allPosts = [];
let postsFiltrados = [];

// Debounce para busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        allPosts = await response.json();

        if (allPosts.length === 0) {
            mostrarEstadoVazio();
            return;
        }

        // Ordenar por data (mais recentes primeiro)
        allPosts.sort((a, b) => new Date(b.data) - new Date(a.data));
        postsFiltrados = [...allPosts];

        // Resetar paginação
        currentPage = 1;

        // Carregar todos os componentes
        carregarPostDestaque(postsFiltrados[0]);
        carregarArtigosPagina();
        carregarPopulares(postsFiltrados.slice(0, 3));
        atualizarEstatisticas(postsFiltrados);
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
    if (!articlesGrid) return;

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

    // Filtrar posts para exibição (pular o primeiro na primeira página)
    const postsParaExibir = currentPage === 1 ? postsPagina.slice(1) : postsPagina;

    // Adiciona os posts da página atual
    postsParaExibir.forEach(post => {
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

function mostrarBotaoCarregarMais() {
    let btnCarregarMais = document.getElementById("btnCarregarMais");

    if (!btnCarregarMais) {
        btnCarregarMais = document.createElement("button");
        btnCarregarMais.id = "btnCarregarMais";
        btnCarregarMais.className = "btn-carregar-mais";
        btnCarregarMais.innerHTML = '<i class="fas fa-plus"></i> Carregar mais';
        btnCarregarMais.addEventListener("click", carregarMaisPosts);

        if (loadMoreWrap) {
            loadMoreWrap.appendChild(btnCarregarMais);
        } else if (articlesGrid) {
            articlesGrid.parentNode.insertBefore(btnCarregarMais, articlesGrid.nextSibling);
        }
    }

    btnCarregarMais.style.display = "flex";
}

function esconderBotaoCarregarMais() {
    const btnCarregarMais = document.getElementById("btnCarregarMais");
    if (btnCarregarMais) {
        btnCarregarMais.style.display = "none";
    }
}

function carregarMaisPosts() {
    currentPage++;
    carregarArtigosPagina();
}

// ===== 1. POST EM DESTAQUE =====
function carregarPostDestaque(post) {
    if (!featuredCard || !post) return;

    const featuredLink = featuredCard.querySelector(".featured-link");
    if (!featuredLink) {
        console.error("Elemento .featured-link não encontrado");
        return;
    }

    const featuredMedia = featuredLink.querySelector(".featured-media img");
    const featuredCategory = featuredLink.querySelector(".featured-category");
    const featuredTitle = featuredLink.querySelector(".featured-title");
    const featuredMeta = featuredLink.querySelector(".featured-meta");

    if (featuredMedia) {
        featuredMedia.src = post.imagem;
        featuredMedia.alt = post.titulo;
    }

    if (featuredCategory) {
        featuredCategory.textContent = post.categoria || "TECNOLOGIA";
    }

    if (featuredTitle) {
        featuredTitle.textContent = post.titulo;
    }

    if (featuredMeta) {
        const dataFormatada = post.dataBlog || formatarData(post.data);
        const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

        featuredMeta.innerHTML = `
            <span>📅 ${dataFormatada}</span>
            <span>•</span>
            <span>🕐 ${horarioFormatado}</span>
        `;
    }

    // Link para o post
    featuredLink.href = `#post-${post.id}`;
    featuredLink.setAttribute("data-id", post.id);
    featuredLink.setAttribute("data-title", post.titulo);
}

// ===== 2. CRIAÇÃO DE CARDS =====
function criarCardArtigo(post) {
    const dataFormatada = post.dataBlog || formatarData(post.data);
    const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

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
    if (!popularList || !posts || posts.length === 0) return;

    popularList.innerHTML = posts.map(post => criarItemPopular(post)).join("");
    adicionarEventosPosts(); // Adiciona eventos aos links populares
}

function criarItemPopular(post) {
    const dataFormatada = post.dataBlog || formatarData(post.data);
    const horarioFormatado = post.horarioBlog || calcularTempoRelativo(post.data);

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
                    <small class="popular-stats">${dataFormatada} • ${horarioFormatado}</small>
                </div>
            </a>
        </li>
    `;
}

// ===== 4. ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas(posts) {
    const articlesHeader = document.querySelector(".articles-header");
    if (articlesHeader) {
        articlesHeader.textContent = `Artigos (${posts.length})`;
    }
}

// ===== 5. SISTEMA DE BUSCA =====
function inicializarBusca() {
    const searchForm = document.querySelector(".search-form");
    if (!searchForm) return;

    const searchInput = searchForm.querySelector('input[type="search"]');
    if (!searchInput) return;

    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const termo = searchInput.value.trim();
        if (termo) {
            buscarPosts(termo);
        } else {
            limparBusca();
        }
    });

    // Busca em tempo real com debounce
    searchInput.addEventListener('input', debounce(function() {
        const termo = this.value.trim();
        if (termo.length >= 2) {
            buscarPosts(termo);
        } else if (termo.length === 0) {
            limparBusca();
        }
    }, 300));
}

function buscarPosts(termo) {
    postsFiltrados = allPosts.filter(post =>
        post.titulo.toLowerCase().includes(termo.toLowerCase()) ||
        (post.conteudo && post.conteudo.toLowerCase().includes(termo.toLowerCase())) ||
        (post.categoria && post.categoria.toLowerCase().includes(termo.toLowerCase())) ||
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
        
        // Mostrar featured card
        if (featuredCard) {
            featuredCard.style.display = "block";
        }
    } else {
        if (articlesGrid) {
            articlesGrid.innerHTML = `
                <div class="no-results">
                    <h3>🔍 Nenhum resultado encontrado</h3>
                    <p>Não encontramos posts para "<strong>${termo}</strong>"</p>
                    <button onclick="limparBusca()" class="btn btn-outline">Limpar busca</button>
                </div>
            `;
        }

        // Esconder post em destaque e botão carregar mais
        if (featuredCard) {
            featuredCard.style.display = "none";
        }
        esconderBotaoCarregarMais();
    }
}

function mostrarContadorResultados(total, termo) {
    let contador = document.getElementById("contador-resultados");
    if (!contador) {
        contador = document.createElement("div");
        contador.id = "contador-resultados";
        contador.className = "contador-resultados";
        if (articlesGrid && articlesGrid.parentNode) {
            articlesGrid.parentNode.insertBefore(contador, articlesGrid);
        }
    }

    contador.innerHTML = `
        <span>${total} resultado(s) encontrado(s) para "<strong>${termo}</strong>"</span>
        <button onclick="limparBusca()" class="btn-limpar-busca">✕</button>
    `;
}

function limparBusca() {
    const searchInput = document.querySelector('.search-form input[type="search"]');
    if (searchInput) searchInput.value = "";

    const contador = document.getElementById("contador-resultados");
    if (contador) contador.remove();

    if (featuredCard) {
        featuredCard.style.display = "block";
    }
    
    postsFiltrados = [...allPosts];
    currentPage = 1;
    carregarTodosDados();
}

// ===== FUNÇÕES AUXILIARES =====

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        const dia = data.getDate();
        const mes = data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        return `${dia}, ${mes}`;
    } catch {
        return "16, Fev";
    }
}

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
        return "Editado há 12 minutos";
    }
}

function adicionarEventosPosts() {
    document.querySelectorAll(".card-link, .popular-link, .featured-link").forEach(link => {
        // Remover event listeners existentes para evitar duplicação
        link.replaceWith(link.cloneNode(true));
    });

    // Adicionar novos event listeners
    document.querySelectorAll(".card-link, .popular-link, .featured-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const postId = this.getAttribute("data-id");
            const postTitle = this.getAttribute("data-title");
            abrirPost(postId, postTitle);
        });
    });
}

function abrirPost(postId, postTitle) {
    console.log("Abrindo post:", postId, postTitle);
    
    // Verificar se estamos na página home ou em uma página de post individual
    const isHomePage = window.location.pathname.includes('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('.html');
    
    if (isHomePage) {
        // Na home page, apenas faz scroll suave para o post
        const postElement = document.querySelector(`[data-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            
            // Adicionar destaque visual temporário
            postElement.style.transition = "all 0.3s ease";
            postElement.style.boxShadow = "0 0 0 3px var(--color-primary)";
            setTimeout(() => {
                postElement.style.boxShadow = "";
            }, 2000);
        } else {
            // Se o post não estiver visível na página atual, mostrar mensagem
            console.log("Post não encontrado na página atual");
            // Opcional: você pode carregar o post dinamicamente aqui
        }
    } else {
        // Se não estiver na home, redirecionar para a home com âncora
        window.location.href = `index.html#post-${postId}`;
    }
}

function inicializarNavegacao() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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
    if (!articlesGrid) return;

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
    if (articlesGrid) {
        articlesGrid.style.opacity = "1";
    }
}

// ===== TRATAMENTO DE ERROS =====
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

function verificarServidor() {
    window.open("http://localhost:3000/posts", "_blank");
}

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

// Exportar funções para uso global
window.limparBusca = limparBusca;
window.carregarTodosDados = carregarTodosDados;
window.verificarServidor = verificarServidor;
window.carregarMaisPosts = carregarMaisPosts;