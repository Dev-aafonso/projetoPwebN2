// Configuração da API - URL base para o JSON Server
const API_URL = "http://localhost:3000/posts";

// ===== SELEÇÃO DE ELEMENTOS DA DOM =====

// Elementos principais da página
const listaPosts = document.getElementById("listaPosts"); // Container onde os posts são listados
const emptyState = document.getElementById("emptyState"); // Mensagem "nenhum post encontrado"
const btnAdd = document.getElementById("btnAdd"); // Botão para adicionar novo post

// Elementos dos modais (janelas pop-up)
const modalOverlay = document.getElementById("modalOverlay"); // Modal de criar/editar
const deleteModalOverlay = document.getElementById("deleteModalOverlay"); // Modal de excluir

// Botões para fechar os modais
const btnFechar = document.getElementById("btnFechar"); // Fechar modal criar/editar
const btnFecharDelete = document.getElementById("btnFecharDelete"); // Fechar modal excluir (X)
const btnCancelarDelete = document.getElementById("btnCancelarDelete"); // Cancelar exclusão
const btnConfirmarDelete = document.getElementById("btnConfirmarDelete"); // Confirmar exclusão

// Elementos do formulário de postagem
const formPost = document.getElementById("formPost"); // Formulário principal
const autorInput = document.getElementById("autor"); // Campo nome do autor
const tituloInput = document.getElementById("titulo"); // Campo título do post
const categoriaInput = document.getElementById("categoria"); // Campo categoria
const imagemInput = document.getElementById("imagem"); // Campo URL da imagem
const conteudoInput = document.getElementById("conteudo"); // Campo conteúdo
const modalTitle = document.getElementById("modalTitle"); // Título do modal (Criar/Editar)
const postTitlePreview = document.getElementById("postTitlePreview"); // Preview do título no modal de excluir

// ===== VARIÁVEIS DE ESTADO =====

let editId = null; // Armazena o ID do post sendo editado (null se for novo)
let postToDelete = null; // Armazena o post selecionado para exclusão

// Variáveis para controle de paginação
let currentPage = 1; // Página atual sendo exibida
const postsPerPage = 6; // Quantidade de posts por página
let allPosts = []; // Array com todos os posts carregados da API

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

// Quando o documento HTML estiver totalmente carregado
document.addEventListener("DOMContentLoaded", function () {
  listarTodosPosts(); // Carrega os posts da API
  inicializarEventos(); // Configura todos os event listeners
  adicionarPostsExemplo(); // Adiciona posts de exemplo se necessário
});

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====

// Configura todos os eventos de clique e submit
function inicializarEventos() {
  // Botão "Novo post" - abre modal de criação
  btnAdd.addEventListener("click", () => {
    modalTitle.textContent = "Criar postagem"; // Altera título do modal
    formPost.reset(); // Limpa o formulário
    editId = null; // Reseta ID de edição
    modalOverlay.classList.add("active"); // Mostra o modal
  });

  // Botões para fechar modais
  btnFechar.addEventListener("click", fecharModalCriar);
  btnFecharDelete.addEventListener("click", fecharModalExcluir);
  btnCancelarDelete.addEventListener("click", fecharModalExcluir);

  // Botão de confirmar exclusão
  btnConfirmarDelete.addEventListener("click", confirmarExclusao);

  // Evento de submit do formulário (criar/editar post)
  formPost.addEventListener("submit", salvarPost);

  // Fechar modais ao clicar fora do conteúdo (no overlay)
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) fecharModalCriar();
  });

  deleteModalOverlay.addEventListener("click", (e) => {
    if (e.target === deleteModalOverlay) fecharModalExcluir();
  });
}

// ===== CONTROLE DE MODAIS =====

// Fecha o modal de criar/editar e reseta o formulário
function fecharModalCriar() {
  modalOverlay.classList.remove("active"); // Esconde o modal
  formPost.reset(); // Limpa todos os campos
  editId = null; // Reseta o ID de edição
}

// Fecha o modal de exclusão
function fecharModalExcluir() {
  deleteModalOverlay.classList.remove("active"); // Esconde o modal
  postToDelete = null; // Limpa a referência do post a ser excluído
}

// ===== GERENCIAMENTO DE POSTS =====

// Busca todos os posts da API e atualiza a interface
async function listarTodosPosts() {
  try {
    // Faz requisição GET para a API
    const response = await fetch(API_URL);
    allPosts = await response.json(); // Converte resposta para JSON

    // Ordena posts por data (do mais recente para o mais antigo)
    allPosts.sort((a, b) => new Date(b.data) - new Date(a.data));

    currentPage = 1; // Volta para a primeira página
    carregarPostsPagina(); // Carrega os posts da página atual
  } catch (error) {
    console.error("Erro ao carregar posts:", error);
    emptyState.style.display = "block"; // Mostra mensagem de erro
  }
}

// Carrega e exibe os posts da página atual
function carregarPostsPagina() {
  // Calcula índices para slice dos posts
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsPagina = allPosts.slice(startIndex, endIndex); // Pega apenas os posts da página atual

  // Se for a primeira página, limpa o container antes de adicionar
  if (currentPage === 1) {
    listaPosts.innerHTML = "";
  }

  // Verifica se não há posts para mostrar
  if (allPosts.length === 0) {
    emptyState.style.display = "block"; // Mostra estado vazio
    esconderBotaoCarregarMais(); // Esconde botão "carregar mais"
    return;
  }

  emptyState.style.display = "none"; // Esconde estado vazio

  // Cria e adiciona cada post ao DOM
  postsPagina.forEach((post) => {
    const postElement = criarPostElement(post); // Cria elemento HTML do post
    listaPosts.appendChild(postElement); // Adiciona ao container
  });

  // Controla a visibilidade do botão "Carregar mais"
  if (endIndex < allPosts.length) {
    mostrarBotaoCarregarMais(); // Ainda há mais posts para carregar
  } else {
    esconderBotaoCarregarMais(); // Todos os posts já foram carregados
  }
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

    // Adiciona o botão após a lista de posts
    const postsSection = document.querySelector(".posts-section");
    postsSection.appendChild(btnCarregarMais);
  }

  btnCarregarMais.style.display = "block"; // Torna o botão visível
}

// Esconde o botão "Carregar mais"
function esconderBotaoCarregarMais() {
  const btnCarregarMais = document.getElementById("btnCarregarMais");
  if (btnCarregarMais) {
    btnCarregarMais.style.display = "none"; // Torna o botão invisível
  }
}

// Carrega a próxima página de posts
function carregarMaisPosts() {
  currentPage++; // Incrementa a página atual
  carregarPostsPagina(); // Carrega os posts da nova página
}

// ===== CRIAÇÃO DE ELEMENTOS HTML =====

// Cria o elemento HTML completo para um post
function criarPostElement(post) {
  const postCard = document.createElement("div");
  postCard.className = "post-card"; // Classe CSS para estilização

  // Define o conteúdo da imagem: usa imagem real ou placeholder
  const imageContent =
    post.imagem && post.imagem !== ""
      ? // Se tem imagem: mostra imagem com fallback para placeholder se der erro
        `<img src="${post.imagem}" alt="${post.titulo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="post-image-placeholder" style="display:none;">
             <i class="fas fa-image"></i>
         </div>`
      : // Se não tem imagem: mostra apenas placeholder
        `<div class="post-image-placeholder">
             <i class="fas fa-image"></i>
         </div>`;

  // Formata a data para exibição amigável (ex: "16, fev")
  const dataPost = new Date(post.data);
  const dia = dataPost.getDate(); // Dia do mês (1-31)
  const mes = dataPost
    .toLocaleDateString("pt-BR", { month: "short" }) // Nome abreviado do mês
    .replace(".", ""); // Remove o ponto da abreviação

  // Template HTML do card do post
  postCard.innerHTML = `
        <div class="post-image">
            ${imageContent}
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.titulo}</h3>
            <p class="post-excerpt">${post.conteudo.substring(0, 100)}${
    post.conteudo.length > 100 ? "..." : "" // Adiciona "..." se o conteúdo for muito longo
  }</p>
            <div class="post-meta">
                <div class="post-tags">
                    <span class="tag">${post.categoria}</span>
                </div>
                <div class="post-author">
                    ${dia}, ${mes} ● 💬 ${post.autor}
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

  // Adiciona eventos aos botões de ação do post
  postCard
    .querySelector(".btn-edit")
    .addEventListener("click", () => editarPost(post));
  postCard
    .querySelector(".btn-delete")
    .addEventListener("click", () => abrirModalExclusao(post));

  return postCard; // Retorna o elemento criado
}

// ===== OPERAÇÕES CRUD =====

// Preenche o formulário com dados do post para edição
function editarPost(post) {
  // Preenche todos os campos do formulário
  autorInput.value = post.autor;
  tituloInput.value = post.titulo;
  categoriaInput.value = post.categoria;
  imagemInput.value = post.imagem;
  conteudoInput.value = post.conteudo;

  editId = post.id; // Armazena o ID do post sendo editado
  modalTitle.textContent = "Editar postagem"; // Altera título do modal
  modalOverlay.classList.add("active"); // Abre o modal
}

// Abre o modal de confirmação de exclusão
function abrirModalExclusao(post) {
  postToDelete = post; // Armazena referência do post a ser excluído
  postTitlePreview.textContent = post.titulo; // Mostra título no preview
  deleteModalOverlay.classList.add("active"); // Abre o modal
}

// Executa a exclusão do post após confirmação
async function confirmarExclusao() {
  if (!postToDelete) return; // Sai da função se não há post para excluir

  try {
    // Requisição DELETE para a API
    await fetch(`${API_URL}/${postToDelete.id}`, {
      method: "DELETE",
    });

    fecharModalExcluir(); // Fecha o modal
    listarTodosPosts(); // Recarrega a lista de posts
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    alert("Erro ao excluir postagem."); // Feedback para o usuário
  }
}

// Salva um post novo ou atualiza um existente
async function salvarPost(e) {
  e.preventDefault(); // Impede o comportamento padrão do formulário

  // Coleta os dados do formulário
  const postData = {
    autor: autorInput.value.trim(),
    titulo: tituloInput.value.trim(),
    categoria: categoriaInput.value.trim(),
    imagem: imagemInput.value.trim(),
    conteudo: conteudoInput.value.trim(),
    data: new Date().toISOString(), // Data atual como padrão
  };

  try {
    if (editId) {
      // MODE EDIÇÃO: Atualiza post existente
      const postExistente = allPosts.find((p) => p.id === editId);
      postData.data = postExistente.data; // Mantém a data original

      // Requisição PUT para atualizar
      await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
    } else {
      // MODO CRIAÇÃO: Cria novo post
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
    }

    fecharModalCriar(); // Fecha o modal
    listarTodosPosts(); // Recarrega a lista de posts
  } catch (error) {
    console.error("Erro ao salvar post:", error);
    alert("Erro ao salvar postagem."); // Feedback para o usuário
  }
}

// ===== FUNÇÃO AUXILIAR - POSTS EXEMPLO =====

// Adiciona posts de exemplo para demonstração (apenas se não houver posts)
async function adicionarPostsExemplo() {
  const postsExemplo = [
    {
      id: 1,
      titulo: "Como o React.JS mudou a forma de construir sistemas modernos?",
      conteudo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      autor: "Helena Souza",
      categoria: "Tecnologia",
      imagem: "https://images.unsplash.com/photo-1633356122544-f134324a6cee...",
      data: new Date(2024, 1, 16).toISOString(), // 16 de fevereiro
    },
    {
      id: 2,
      titulo: "Os desafios do desenvolvimento frontend em 2024",
      conteudo: "Ut enim ad minim veniam, quis nostrud exercitation...",
      autor: "Carlos Silva",
      categoria: "Frontend",
      imagem: "https://images.unsplash.com/photo-1555066931-4365d14bab8c...",
      data: new Date(2024, 1, 15).toISOString(), // 15 de fevereiro
    },
    {
      id: 3,
      titulo: "A importância da acessibilidade web nos projetos atuais",
      conteudo: "Duis aute irure dolor in reprehenderit in voluptate...",
      autor: "João Silva",
      categoria: "Acessibilidade",
      imagem: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d...",
      data: new Date(2024, 1, 14).toISOString(), // 14 de fevereiro
    },
  ];

  try {
    // Verifica se já existem posts no servidor
    const response = await fetch(API_URL);
    const postsExistentes = await response.json();

    // Só adiciona exemplos se não houver posts
    if (postsExistentes.length === 0) {
      // Adiciona cada post exemplo
      for (const post of postsExemplo) {
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(post),
        });
      }
      console.log("Posts exemplo adicionados com sucesso!");
      listarTodosPosts(); // Recarrega a lista com os novos posts
    }
  } catch (error) {
    console.error("Erro ao adicionar posts exemplo:", error);
  }
}
