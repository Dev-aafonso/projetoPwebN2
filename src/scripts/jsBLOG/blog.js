const API_URL = "http://localhost:3000/posts";

// Elementos do DOM que serão atualizados
const elementos = {
    categoria: document.getElementById('postCategoria'),
    titulo: document.getElementById('postTitulo'),
    autor: document.getElementById('postAutor'),
    data: document.getElementById('postData'),
    conteudo: document.getElementById('postConteudo'),
    imagem: document.getElementById('postImagem'),
    artigosSemelhantes: document.getElementById('artigosSemelhantes')
};

// Carregar post específico ou o mais recente
async function carregarPost(postId = null) {
    try {
        const response = await fetch(API_URL);
        const posts = await response.json();

        if (posts.length === 0) {
            mostrarEstadoVazio();
            return;
        }

        let post;
        if (postId) {
            // Carregar post específico
            post = posts.find(p => p.id == postId);
        } else {
            // Carregar post mais recente
            post = posts.sort((a, b) => b.id - a.id)[0];
        }

        if (post) {
            renderizarPost(post);
            carregarArtigosSemelhantes(posts, post.id);
        } else {
            mostrarPostNaoEncontrado();
        }

    } catch (error) {
        console.error("Erro ao carregar post:", error);
        mostrarErro();
    }
}

// Renderizar o post principal
function renderizarPost(post) {
    // Atualizar elementos do post
    if (elementos.categoria) elementos.categoria.textContent = post.categoria;
    if (elementos.titulo) elementos.titulo.textContent = post.titulo;
    if (elementos.autor) elementos.autor.textContent = post.autor;
    if (elementos.data) elementos.data.textContent = post.data;
    if (elementos.imagem) {
        elementos.imagem.src = post.imagem || 'image.png';
        elementos.imagem.alt = post.titulo;
    }

    // Renderizar conteúdo formatado
    if (elementos.conteudo) {
        elementos.conteudo.innerHTML = formatarConteudo(post.conteudo);
    }
}

// Formatar conteúdo do post (se necessário)
function formatarConteudo(conteudo) {
    // Se o conteúdo já vem formatado em HTML, usar como está
    // Se for texto plano, converter parágrafos
    if (conteudo.includes('<') && conteudo.includes('>')) {
        return conteudo;
    }
    
    // Converter quebras de linha em parágrafos
    return `<p>${conteudo.replace(/\n/g, '</p><p>')}</p>`;
}

// Carregar artigos semelhantes (excluindo o post atual)
function carregarArtigosSemelhantes(posts, postIdAtual) {
    if (!elementos.artigosSemelhantes) return;

    const artigosSemelhantes = posts
        .filter(post => post.id != postIdAtual)
        .slice(0, 3); // Pegar até 3 artigos

    if (artigosSemelhantes.length === 0) {
        elementos.artigosSemelhantes.innerHTML = `
            <div class="empty-artigos">
                <p>Nenhum outro artigo disponível no momento.</p>
            </div>
        `;
        return;
    }

    elementos.artigosSemelhantes.innerHTML = artigosSemelhantes.map(post => `
        <div class="rel-card">
            <div class="rel-img">
                <img src="${post.imagem || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                     alt="${post.titulo}" 
                     class="imagem-card"
                     onclick="carregarPost(${post.id})"
                     style="cursor: pointer;">
            </div>
            <span class="rel-cat">${post.categoria}</span>
            <h3 class="rel-title" onclick="carregarPost(${post.id})" style="cursor: pointer;">
                ${post.titulo}
            </h3>
            <p class="rel-meta">${post.data}</p>
        </div>
    `).join('');
}

// Estados de interface
function mostrarEstadoVazio() {
    if (elementos.conteudo) {
        elementos.conteudo.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum post encontrado</h3>
                <p>Volte em breve para conferir nossos conteúdos!</p>
            </div>
        `;
    }
    if (elementos.artigosSemelhantes) {
        elementos.artigosSemelhantes.innerHTML = `
            <div class="empty-artigos">
                <p>Nenhum artigo disponível no momento.</p>
            </div>
        `;
    }
}

function mostrarPostNaoEncontrado() {
    if (elementos.conteudo) {
        elementos.conteudo.innerHTML = `
            <div class="error-state">
                <h3>Post não encontrado</h3>
                <p>O post que você está procurando não existe ou foi removido.</p>
                <button onclick="carregarPost()" class="btn-voltar">
                    Voltar para o post mais recente
                </button>
            </div>
        `;
    }
}

function mostrarErro() {
    if (elementos.conteudo) {
        elementos.conteudo.innerHTML = `
            <div class="error-state">
                <h3>Erro ao carregar post</h3>
                <p>Verifique se o JSON Server está rodando na porta 3000.</p>
                <button onclick="carregarPost()" class="btn-retry">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Navegação entre posts
function navegarParaPost(postId) {
    carregarPost(postId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Função para obter parâmetros da URL
function obterParametroURL(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há um ID específico na URL
    const postId = obterParametroURL('id');
    
    // Configurar botão "Voltar para o início"
    const backButton = document.querySelector('.back');
    if (backButton) {
        backButton.addEventListener('click', function() {
            carregarPost(); // Carrega o post mais recente
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Carregar post inicial
    carregarPost(postId);
});

// CSS adicional para estados (adicione ao seu CSS)
const cssAdicional = `
.empty-state, .error-state, .empty-artigos {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.empty-state h3, .error-state h3 {
    margin-bottom: 10px;
    color: #333;
}

.btn-retry, .btn-voltar {
    background: #6b5eff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 15px;
}

.btn-retry:hover, .btn-voltar:hover {
    background: #5a4fe0;
}

.rel-title:hover {
    color: #6b5eff;
}
`;

// Adicionar CSS dinamicamente
const style = document.createElement('style');
style.textContent = cssAdicional;
document.head.appendChild(style);

// Tornar funções globais
window.carregarPost = carregarPost;
window.navegarParaPost = navegarParaPost;

// scripts/back-to-top.js
document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o botão
    const backToTopBtn = document.querySelector('.back-to-top');
    
    if (!backToTopBtn) return;
    
    // Adiciona classe inicial
    backToTopBtn.classList.add('back-to-top-hidden');
    
    // Mostrar/ocultar botão ao rolar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('back-to-top-hidden');
            backToTopBtn.classList.add('back-to-top-visible');
        } else {
            backToTopBtn.classList.remove('back-to-top-visible');
            backToTopBtn.classList.add('back-to-top-hidden');
        }
    });
    
    // Rolagem suave ao clicar
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Rolagem suave
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Foco no topo para acessibilidade
        document.body.focus();
    });
    
    // Adiciona id ao topo da página para navegação
    const topElement = document.createElement('div');
    topElement.id = 'topo';
    topElement.style.position = 'absolute';
    topElement.style.top = '0';
    document.body.prepend(topElement);
});