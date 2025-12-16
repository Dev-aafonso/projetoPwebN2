// Configuração da API - Mesmo endereço do blog principal
const API_URL = "http://localhost:3000/posts";

// ===== SELEÇÃO DE ELEMENTOS DA DOM =====

// Elementos principais da página
const listaPosts = document.getElementById("listaPosts"); // Container onde os posts são listados
const emptyState = document.getElementById("emptyState"); // Mensagem "nenhum post encontrado"
const btnAdd = document.getElementById("btnAdd"); // Botão para adicionar novo post

// Elementos dos modais (janelas pop-up)
const modalOverlay = document.getElementById("modalOverlay"); // Modal de criar/editar post
const deleteModalOverlay = document.getElementById("deleteModalOverlay"); // Modal de excluir post

// Botões para fechar os modais
const btnFechar = document.getElementById("btnFechar"); // Fechar modal criar/editar (X)
const btnFecharDelete = document.getElementById("btnFecharDelete"); // Fechar modal excluir (X)
const btnCancelarDelete = document.getElementById("btnCancelarDelete"); // Cancelar exclusão (botão)
const btnConfirmarDelete = document.getElementById("btnConfirmarDelete"); // Confirmar exclusão

// Elementos do formulário de postagem
const formPost = document.getElementById("formPost"); // Formulário principal
const autorInput = document.getElementById("autor"); // Campo nome do autor
const tituloInput = document.getElementById("titulo"); // Campo título do post
const categoriaInput = document.getElementById("categoria"); // Campo categoria
const imagemInput = document.getElementById("imagem"); // Campo URL da imagem
const conteudoInput = document.getElementById("conteudo"); // Campo conteúdo (textarea)
const modalTitle = document.getElementById("modalTitle"); // Título do modal (Criar/Editar)
const postTitlePreview = document.getElementById("postTitlePreview"); // Preview do título no modal de excluir

// ===== VARIÁVEIS DE ESTADO =====

let editId = null; // Armazena o ID do post sendo editado (null se for novo post)
let postToDelete = null; // Armazena o post selecionado para exclusão

// Variáveis para controle de paginação
let currentPage = 1; // Página atual sendo exibida (começa em 1)
const postsPerPage = 6; // Quantidade de posts exibidos por página
let allPosts = []; // Array com todos os posts carregados da API

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

// Quando o documento HTML estiver totalmente carregado e pronto
document.addEventListener("DOMContentLoaded", function () {
  listarTodosPosts(); // 1. Carrega os posts da API
  inicializarEventos(); // 2. Configura todos os event listeners
  adicionarPostsExemplo(); // 3. Adiciona posts de exemplo se necessário
});

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====

// Configura todos os eventos de clique e submit da página
function inicializarEventos() {
  // Botão "Novo post" - abre modal de criação
  btnAdd.addEventListener("click", () => {
    modalTitle.textContent = "Criar postagem"; // Altera título do modal para "Criar"
    formPost.reset(); // Limpa todos os campos do formulário
    editId = null; // Reseta ID de edição (indica que é novo post)
    modalOverlay.classList.add("active"); // Mostra o modal adicionando classe "active"
  });

  // Botões para fechar modais
  btnFechar.addEventListener("click", fecharModalCriar); // X do modal criar/editar
  btnFecharDelete.addEventListener("click", fecharModalExcluir); // X do modal excluir
  btnCancelarDelete.addEventListener("click", fecharModalExcluir); // Botão "Cancelar"

  // Botão de confirmar exclusão
  btnConfirmarDelete.addEventListener("click", confirmarExclusao);

  // Evento de submit do formulário (criar/editar post)
  formPost.addEventListener("submit", salvarPost);

  // Fechar modais ao clicar fora do conteúdo (no overlay escuro)
  modalOverlay.addEventListener("click", (e) => {
    // Se clicou exatamente no overlay (não no conteúdo interno)
    if (e.target === modalOverlay) fecharModalCriar();
  });

  deleteModalOverlay.addEventListener("click", (e) => {
    if (e.target === deleteModalOverlay) fecharModalExcluir();
  });
}

// ===== CONTROLE DE MODAIS =====

// Fecha o modal de criar/editar e reseta o formulário
function fecharModalCriar() {
  modalOverlay.classList.remove("active"); // Remove classe "active" para esconder
  formPost.reset(); // Limpa todos os campos do formulário
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
    
    // Converte resposta para JSON (array de posts)
    allPosts = await response.json();

    // Ordena posts por data (do mais recente para o mais antigo)
    // Prioriza data de última edição, se existir
    allPosts.sort((a, b) => {
      const dataA = new Date(a.ultimaEdicao || a.data);
      const dataB = new Date(b.ultimaEdicao || b.data);
      return dataB - dataA;
    });

    currentPage = 1; // Volta para a primeira página
    carregarPostsPagina(); // Carrega os posts da página atual
  } catch (error) {
    console.error("Erro ao carregar posts:", error);
    emptyState.style.display = "block"; // Mostra mensagem de erro/estado vazio
  }
}

// Carrega e exibe os posts da página atual (6 por página)
function carregarPostsPagina() {
  // Calcula índices para slice dos posts
  // Ex: página 1: startIndex=0, endIndex=6 (posts 0-5)
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsPagina = allPosts.slice(startIndex, endIndex); // Pega apenas os posts da página atual

  // Se for a primeira página, limpa o container antes de adicionar
  if (currentPage === 1) {
    listaPosts.innerHTML = ""; // Remove todos os filhos
  }

  // Verifica se não há posts para mostrar
  if (allPosts.length === 0) {
    emptyState.style.display = "block"; // Mostra estado vazio
    esconderBotaoCarregarMais(); // Esconde botão "carregar mais"
    return; // Sai da função
  }

  emptyState.style.display = "none"; // Esconde estado vazio

  // Cria e adiciona cada post ao DOM
  postsPagina.forEach((post) => {
    const postElement = criarPostElement(post); // Cria elemento HTML do post
    listaPosts.appendChild(postElement); // Adiciona ao container
  });

  // Controla a visibilidade do botão "Carregar mais"
  // Se ainda há posts após os da página atual, mostra o botão
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
    
    // Quando clicado, carrega mais posts
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
  currentPage++; // Incrementa a página atual (1 -> 2, 2 -> 3, etc)
  carregarPostsPagina(); // Carrega os posts da nova página
}

// ===== CRIAÇÃO DE ELEMENTOS HTML =====

// Cria o elemento HTML completo para um post (card)
function criarPostElement(post) {
  const postCard = document.createElement("div");
  postCard.className = "post-card"; // Classe CSS para estilização

  // Determina a data para exibição (data original ou data de edição)
  const dataParaExibicao = post.ultimaEdicao || post.data;
  const dataPost = new Date(dataParaExibicao);
  const dia = dataPost.getDate(); // Dia do mês (1-31)
  const mes = dataPost
    .toLocaleDateString("pt-BR", { month: "short" }) // Nome abreviado do mês (fev, mar, etc.)
    .replace(".", ""); // Remove o ponto da abreviação

  // Verifica se o post foi editado
  const foiEditado = post.ultimaEdicao && post.ultimaEdicao !== post.data;
  const indicadorEdicao = foiEditado ? " (Editado)" : "";

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

  // Template HTML do card do post
  postCard.innerHTML = `
        <div class="post-image">
            ${imageContent}
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.titulo}</h3>
            <p class="post-excerpt">${post.conteudo.substring(0, 100)}${ // Primeiros 100 caracteres
    post.conteudo.length > 100 ? "..." : "" // Adiciona "..." se o conteúdo for muito longo
  }</p>
            <div class="post-meta">
                <div class="post-tags">
                    <span class="tag">${post.categoria}</span>
                    ${foiEditado ? '<span class="tag edited-tag">EDITADO</span>' : ''}
                </div>
                <div class="post-author">
                    ${dia}, ${mes}${indicadorEdicao} ● 💬 ${post.autor} <!-- Data formatada e autor -->
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
    .addEventListener("click", () => editarPost(post)); // Editar este post
  postCard
    .querySelector(".btn-delete")
    .addEventListener("click", () => abrirModalExclusao(post)); // Excluir este post

  return postCard; // Retorna o elemento criado
}

// ===== OPERAÇÕES CRUD (Create, Read, Update, Delete) =====

// Preenche o formulário com dados do post para edição
function editarPost(post) {
  // Preenche todos os campos do formulário com dados do post
  autorInput.value = post.autor;
  tituloInput.value = post.titulo;
  categoriaInput.value = post.categoria;
  imagemInput.value = post.imagem;
  conteudoInput.value = post.conteudo;

  editId = post.id; // Armazena o ID do post sendo editado
  modalTitle.textContent = "Editar postagem"; // Altera título do modal para "Editar"
  modalOverlay.classList.add("active"); // Abre o modal
}

// Abre o modal de confirmação de exclusão
function abrirModalExclusao(post) {
  postToDelete = post; // Armazena referência do post a ser excluído
  postTitlePreview.textContent = post.titulo; // Mostra título no preview do modal
  deleteModalOverlay.classList.add("active"); // Abre o modal
}

// Executa a exclusão do post após confirmação
async function confirmarExclusao() {
  if (!postToDelete) return; // Sai da função se não há post para excluir

  try {
    // Requisição DELETE para a API
    // Envia DELETE para /posts/{id}
    await fetch(`${API_URL}/${postToDelete.id}`, {
      method: "DELETE", // Método HTTP DELETE
    });

    fecharModalExcluir(); // Fecha o modal
    listarTodosPosts(); // Recarrega a lista de posts (atualiza interface)
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    alert("Erro ao excluir postagem."); // Feedback para o usuário
  }
}

// ===== FUNÇÃO PARA SINCRONIZAR COM O BLOG =====

// Formata os dados do post no padrão do blog (com data de edição real)
function formatarDadosParaBlog(postData, estaEditando = false) {
    const agora = new Date();
    
    // Para novos posts, data de criação = data de edição
    // Para edições, mantém data original de criação, mas adiciona data de edição
    const dadosFormatados = {
        ...postData,
        categoria: postData.categoria.toUpperCase()
    };
    
    // Adiciona timestamp da última edição
    dadosFormatados.ultimaEdicao = agora.toISOString();
    
    // Se é um NOVO POST, também define a data de criação
    if (!estaEditando) {
        dadosFormatados.data = agora.toISOString();
    }
    
    return dadosFormatados;
}

// Salva um post novo ou atualiza um existente
async function salvarPost(e) {
    e.preventDefault(); // Impede o comportamento padrão do formulário (recarregar página)

    // Coleta os dados do formulário em um objeto
    const postData = {
        autor: autorInput.value.trim(), // Remove espaços extras
        titulo: tituloInput.value.trim(),
        categoria: categoriaInput.value.trim(),
        imagem: imagemInput.value.trim(),
        conteudo: conteudoInput.value.trim(),
        // data será definida na função formatarDadosParaBlog
    };

    try {
        // Determina se está editando ou criando novo
        const estaEditando = editId !== null;
        
        // Formata os dados para o padrão do blog
        const dadosFormatados = formatarDadosParaBlog(postData, estaEditando);

        if (editId) {
            // MODO EDIÇÃO: Atualiza post existente
            const postExistente = allPosts.find((p) => p.id === editId);
            
            // Mantém a data ORIGINAL de criação
            dadosFormatados.data = postExistente.data;
            
            // Preserva outras propriedades existentes
            dadosFormatados.id = postExistente.id;
            
            await fetch(`${API_URL}/${editId}`, {
                method: "PUT", // Método HTTP PUT (atualizar)
                headers: {
                    "Content-Type": "application/json", // Informa que estamos enviando JSON
                },
                body: JSON.stringify(dadosFormatados), // Converte objeto para string JSON
            });
        } else {
            // MODO CRIAÇÃO: Cria novo post
            await fetch(API_URL, {
                method: "POST", // Método HTTP POST (criar)
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dadosFormatados),
            });
        }

        fecharModalCriar(); // Fecha o modal
        listarTodosPosts(); // Recarrega a lista de posts
        
        // Feedback visual de sucesso
        mostrarNotificacao(estaEditando ? 'Post atualizado com sucesso!' : 'Post criado com sucesso!');
        
    } catch (error) {
        console.error("Erro ao salvar post:", error);
        alert("Erro ao salvar postagem."); // Feedback para o usuário
    }
}

// Função para mostrar notificação temporária
function mostrarNotificacao(mensagem) {
    // Cria uma notificação temporária
    const notification = document.createElement('div');
    notification.className = 'notification-sync';
    notification.textContent = mensagem;
    
    // Estilos inline para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification); // Adiciona à página
    
    // Remove após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}