const API_URL = "http://localhost:3000/posts";

// Elementos do DOM
const postsContainer = document.getElementById('postsContainer');
const artigosSemelhantes = document.getElementById('artigosSemelhantes');
const postDestaque = document.getElementById('postDestaque');

// Carregar todos os posts
async function carregarPosts() {
    try {
        const response = await fetch(API_URL);
        const posts = await response.json();

        // Ordenar por ID (mais recentes primeiro)
        posts.sort((a, b) => b.id - a.id);

        // Renderizar posts
        renderizarPosts(posts);
        renderizarArtigosSemelhantes(posts);
        renderizarPostDestaque(posts);

    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        mostrarErro();
    }
}

// Renderizar posts principais
function renderizarPosts(posts) {
    if (!postsContainer) return;

    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <h3>Nenhum post encontrado</h3>
                <p>Volte em breve para conferir nossos conteúdos!</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <article class="post-item">
            <div class="post-header">
                <span class="post-categoria">${post.categoria}</span>
                <h2 class="post-titulo">${post.titulo}</h2>
                <div class="post-meta">
                    <span class="post-data">${post.data}</span>
                </div>
            </div>
            <div class="post-content">
                <p>${post.conteudo}</p>
            </div>
            ${post.imagem ? `
                <div class="post-image">
                    <img src="${post.imagem}" alt="${post.titulo}" />
                </div>
            ` : ''}
        </article>
    `).join('');
}

// Renderizar artigos semelhantes
function renderizarArtigosSemelhantes(posts) {
    if (!artigosSemelhantes) return;

    // Pegar os 3 posts mais recentes para artigos semelhantes
    const postsRecentes = posts.slice(0, 3);
    
    if (postsRecentes.length === 0) {
        artigosSemelhantes.innerHTML = `
            <div class="empty-state">
                <p>Nenhum artigo semelhante disponível</p>
            </div>
        `;
        return;
    }

    artigosSemelhantes.innerHTML = postsRecentes.map(post => `
        <div class="artigo-semelhante">
            <div class="artigo-categoria">${post.categoria}</div>
            <h3 class="artigo-titulo">${post.titulo}</h3>
            <div class="artigo-meta">${post.data}</div>
        </div>
    `).join('');
}

// Renderizar post em destaque (primeiro post)
function renderizarPostDestaque(posts) {
    if (!postDestaque || posts.length === 0) return;

    const destaque = posts[0];
    
    postDestaque.innerHTML = `
        <div class="destaque-header">
            <span class="destaque-categoria">${destaque.categoria}</span>
            <h1 class="destaque-titulo">${destaque.titulo}</h1>
            <div class="destaque-meta">
                <span class="destaque-data">${destaque.data}</span>
            </div>
        </div>
        <div class="destaque-content">
            <p>${destaque.conteudo}</p>
        </div>
        ${destaque.imagem ? `
            <div class="destaque-image">
                <img src="${destaque.imagem}" alt="${destaque.titulo}" />
            </div>
        ` : ''}
    `;
}

// Mostrar erro de carregamento
function mostrarErro() {
    if (postsContainer) {
        postsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar posts</h3>
                <p>Verifique se o JSON Server está rodando na porta 3000</p>
                <button onclick="carregarPosts()" class="btn-retry">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Atualizar posts periodicamente (opcional)
function iniciarAtualizacaoAutomatica() {
    // Atualizar a cada 30 segundos
    setInterval(carregarPosts, 30000);
}

// Filtro de posts por categoria
function filtrarPorCategoria(categoria) {
    carregarPosts().then(posts => {
        if (categoria === 'todos') {
            renderizarPosts(posts);
        } else {
            const postsFiltrados = posts.filter(post => 
                post.categoria.toLowerCase() === categoria.toLowerCase()
            );
            renderizarPosts(postsFiltrados);
        }
    });
}

// Buscar posts
function buscarPosts(termo) {
    carregarPosts().then(posts => {
        const postsFiltrados = posts.filter(post =>
            post.titulo.toLowerCase().includes(termo.toLowerCase()) ||
            post.conteudo.toLowerCase().includes(termo.toLowerCase()) ||
            post.categoria.toLowerCase().includes(termo.toLowerCase())
        );
        renderizarPosts(postsFiltrados);
    });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarPosts();
    
    // Iniciar atualização automática se necessário
    // iniciarAtualizacaoAutomatica();
    
    // Adicionar event listeners para filtros (se existirem)
    const filtrosCategoria = document.querySelectorAll('[data-categoria]');
    filtrosCategoria.forEach(filtro => {
        filtro.addEventListener('click', (e) => {
            e.preventDefault();
            const categoria = filtro.getAttribute('data-categoria');
            filtrarPorCategoria(categoria);
        });
    });

    // Adicionar event listener para busca (se existir)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            buscarPosts(e.target.value);
        });
    }
});

// Exportar funções para uso global
window.carregarPosts = carregarPosts;
window.filtrarPorCategoria = filtrarPorCategoria;
window.buscarPosts = buscarPosts;