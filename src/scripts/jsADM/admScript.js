const API_URL = "http://localhost:3000/posts";

// Elementos principais
const listaPosts = document.getElementById("listaPosts");
const emptyState = document.getElementById("emptyState");
const btnAdd = document.getElementById("btnAdd");

// Modais
const modalOverlay = document.getElementById("modalOverlay");
const deleteModalOverlay = document.getElementById("deleteModalOverlay");

// Botões de fechar
const btnFechar = document.getElementById("btnFechar");
const btnFecharDelete = document.getElementById("btnFecharDelete");
const btnCancelar = document.getElementById("btnCancelar");
const btnCancelarDelete = document.getElementById("btnCancelarDelete");
const btnConfirmarDelete = document.getElementById("btnConfirmarDelete");

// Formulário
const formPost = document.getElementById("formPost");
const autorInput = document.getElementById("autor");
const tituloInput = document.getElementById("titulo");
const categoriaInput = document.getElementById("categoria");
const imagemInput = document.getElementById("imagem");
const conteudoInput = document.getElementById("conteudo");
const modalTitle = document.getElementById("modalTitle");
const postTitlePreview = document.getElementById("postTitlePreview");

let editId = null;
let posts = [];
let postToDelete = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    listarPosts();
    inicializarEventos();
});

function inicializarEventos() {
    // Abrir modal de criar
    btnAdd.addEventListener("click", () => {
        modalTitle.textContent = "Criar postagem";
        formPost.reset();
        editId = null;
        modalOverlay.classList.add("active");
    });

    // Fechar modais
    [btnFechar, btnCancelar].forEach((btn) => {
        btn.addEventListener("click", fecharModalCriar);
    });

    [btnFecharDelete, btnCancelarDelete].forEach((btn) => {
        btn.addEventListener("click", fecharModalExcluir);
    });

    // Confirmar exclusão
    btnConfirmarDelete.addEventListener("click", confirmarExclusao);

    // Submissão do formulário
    formPost.addEventListener("submit", salvarPost);

    // Fechar modais ao clicar fora
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) fecharModalCriar();
    });

    deleteModalOverlay.addEventListener("click", (e) => {
        if (e.target === deleteModalOverlay) fecharModalExcluir();
    });
}

function fecharModalCriar() {
    modalOverlay.classList.remove("active");
    formPost.reset();
    editId = null;
}

function fecharModalExcluir() {
    deleteModalOverlay.classList.remove("active");
    postToDelete = null;
}

// Listar posts
async function listarPosts() {
    try {
        const response = await fetch(API_URL);
        posts = await response.json();

        listaPosts.innerHTML = "";

        if (posts.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        posts.forEach(post => {
            const postElement = criarPostElement(post);
            listaPosts.appendChild(postElement);
        });

    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        emptyState.style.display = "block";
    }
}

function criarPostElement(post) {
    const postCard = document.createElement("div");
    postCard.className = "post-card";
    
    // Verificar se tem imagem ou usar placeholder
    const imageContent = post.imagem && post.imagem !== '' 
        ? `<img src="${post.imagem}" alt="${post.titulo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="post-image-placeholder" style="display:none;">
               <i class="fas fa-image"></i>
           </div>`
        : `<div class="post-image-placeholder">
               <i class="fas fa-image"></i>
           </div>`;

    postCard.innerHTML = `
        <div class="post-image">
            ${imageContent}
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.titulo}</h3>
            <p class="post-excerpt">${post.conteudo.substring(0, 100)}${post.conteudo.length > 100 ? '...' : ''}</p>
            <div class="post-meta">
                <div class="post-tags">
                    <span class="tag">${post.categoria}</span>
                </div>
                <div class="post-author">
                    <i class="fas fa-user"></i>
                    ${post.autor}
                </div>
            </div>
        </div>
        <div class="post-actions">
            <button class="btn-edit" data-id="${post.id}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-delete" data-id="${post.id}">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;

    // Eventos dos botões
    postCard.querySelector('.btn-edit').addEventListener('click', () => editarPost(post));
    postCard.querySelector('.btn-delete').addEventListener('click', () => abrirModalExclusao(post));

    return postCard;
}

function editarPost(post) {
    autorInput.value = post.autor;
    tituloInput.value = post.titulo;
    categoriaInput.value = post.categoria;
    imagemInput.value = post.imagem;
    conteudoInput.value = post.conteudo;
    editId = post.id;
    modalTitle.textContent = "Editar postagem";
    modalOverlay.classList.add("active");
}

function abrirModalExclusao(post) {
    postToDelete = post;
    postTitlePreview.textContent = post.titulo;
    deleteModalOverlay.classList.add("active");
}

async function confirmarExclusao() {
    if (!postToDelete) return;

    try {
        await fetch(`${API_URL}/${postToDelete.id}`, {
            method: "DELETE"
        });

        fecharModalExcluir();
        listarPosts();

    } catch (error) {
        console.error("Erro ao excluir post:", error);
        alert("Erro ao excluir postagem.");
    }
}

async function salvarPost(e) {
    e.preventDefault();

    const postData = {
        autor: autorInput.value.trim(),
        titulo: tituloInput.value.trim(),
        categoria: categoriaInput.value.trim(),
        imagem: imagemInput.value.trim(),
        conteudo: conteudoInput.value.trim(),
        data: new Date().toISOString()
    };

    try {
        if (editId) {
            // Editar post existente
            await fetch(`${API_URL}/${editId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(postData)
            });
        } else {
            // Criar novo post
            await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(postData)
            });
        }

        fecharModalCriar();
        listarPosts();

    } catch (error) {
        console.error("Erro ao salvar post:", error);
        alert("Erro ao salvar postagem.");
    }
}

// Adicionar alguns posts de exemplo para demonstração
async function adicionarPostsExemplo() {
    const postsExemplo = [
        {
            id: 1,
            titulo: "Como o React.JS mudou a forma de construir sistemas modernos?",
            conteudo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            autor: "Helena Souza",
            categoria: "Tecnologia",
            imagem: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        },
        {
            id: 2,
            titulo: "Os desafios do desenvolvimento frontend em 2024",
            conteudo: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            autor: "Carlos Silva",
            categoria: "Frontend",
            imagem: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        }
    ];

    // Verificar se já existem posts antes de adicionar exemplos
    try {
        const response = await fetch(API_URL);
        const postsExistentes = await response.json();
        
        if (postsExistentes.length === 0) {
            for (const post of postsExemplo) {
                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(post)
                });
            }
            listarPosts();
        }
    } catch (error) {
        console.error("Erro ao adicionar posts exemplo:", error);
    }
}

// Inicializar com posts exemplo (opcional)
// adicionarPostsExemplo();