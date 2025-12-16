// blogFooter.js - Script específico para o footer do Blog.html
const API_URL = "http://localhost:3000/posts";

// Aguarda o DOM estar pronto
document.addEventListener("DOMContentLoaded", function () {
  console.log("Script do footer do blog carregado");
  carregarDadosFooter();
});

// Carrega os dados da API e atualiza o footer
async function carregarDadosFooter() {
  try {
    console.log("Carregando dados do footer do blog...");
    
    // Mostra estado de carregamento
    const relatedGrid = document.getElementById('relatedPosts');
    if (relatedGrid) {
      relatedGrid.innerHTML = `
        <div class="loading-related">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Carregando artigos relacionados...</p>
        </div>
      `;
    }
    
    // Faz a requisição para a API
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const posts = await response.json();
    
    if (posts && posts.length > 0) {
      // Ordena por data (mais recentes primeiro)
      posts.sort((a, b) => {
        const dataA = new Date(a.ultimaEdicao || a.data);
        const dataB = new Date(b.ultimaEdicao || b.data);
        return dataB - dataA;
      });
      
      // Atualiza os artigos relacionados (3 primeiros posts)
      atualizarArtigosRelacionados(posts.slice(0, 3));
    } else {
      mostrarErroCarregamento("Nenhum post encontrado na API");
    }
  } catch (error) {
    console.error("Erro ao carregar dados do footer:", error);
    mostrarErroCarregamento("Erro ao conectar com a API");
  }
}

// Atualiza a seção de artigos relacionados
function atualizarArtigosRelacionados(posts) {
  const relatedGrid = document.getElementById('relatedPosts');
  
  if (!relatedGrid) {
    console.warn("Elemento #relatedPosts não encontrado");
    return;
  }
  
  // Limpa o conteúdo atual
  relatedGrid.innerHTML = '';
  
  // Verifica se há posts para mostrar
  if (posts.length === 0) {
    relatedGrid.innerHTML = `
      <div class="no-articles">
        <i class="fas fa-newspaper"></i>
        <p>Nenhum artigo relacionado disponível</p>
      </div>
    `;
    return;
  }
  
  // Adiciona os novos artigos
  posts.forEach((post, index) => {
    const relCard = criarCardRelacionado(post, index);
    relatedGrid.appendChild(relCard);
  });
  
  console.log(`${posts.length} artigos relacionados carregados`);
}

// Cria um card de artigo relacionado
function criarCardRelacionado(post, index) {
  const relCard = document.createElement('div');
  relCard.className = 'rel-card';
  relCard.setAttribute('data-id', post.id);
  
  // Formata a data
  const dataFormatada = formatarDataPost(post.data || new Date());
  const horarioRelativo = calcularHorarioRelativo(post.ultimaEdicao || post.data || new Date());
  
  // Imagens de fallback baseadas no índice
  const fallbackImages = [
    'img/RV.jpg',
    'img/TEC.webp',
    'img/JS.jpg'
  ];
  
  // URL da imagem ou fallback
  const imageUrl = post.imagem || fallbackImages[index % fallbackImages.length];
  
  relCard.innerHTML = `
    <div class="rel-img">
      <img src="${imageUrl}" 
           alt="${post.titulo}" 
           class="imagem-card"
           loading="lazy"
           onerror="this.onerror=null; this.src='${fallbackImages[index % fallbackImages.length]}'">
    </div>
    <div class="rel-content">
      <span class="rel-cat">${(post.categoria || 'TECNOLOGIA').toUpperCase()}</span>
      <h3 class="rel-title">${post.titulo || 'Artigo sem título'}</h3>
      <div class="rel-meta">
        <span class="rel-date">${dataFormatada}</span>
        <span class="rel-time"> – ${horarioRelativo}</span>
      </div>
    </div>
  `;
  
  // Adiciona evento de clique para visualizar o artigo
  relCard.addEventListener('click', function() {
    abrirArtigoRelacionado(post);
  });
  
  return relCard;
}

// Função para abrir artigo relacionado
function abrirArtigoRelacionado(post) {
  console.log("Abrindo artigo relacionado:", post.id, post.titulo);
  
  // Pode implementar diferentes comportamentos:
  // 1. Redirecionar para uma página de detalhes
  // 2. Abrir um modal com o conteúdo
  // 3. Navegar para a Home com o post destacado
  
  // Por enquanto, vamos redirecionar para a Home com âncora
  // window.location.href = `../blog/Home.html#post-${post.id}`;
  
  // Ou mostrar um alerta (temporário)
  alert(`Artigo "${post.titulo}" seria aberto em uma nova página.\n\nID: ${post.id}\nAutor: ${post.autor || 'Desconhecido'}`);
}

// Função auxiliar para formatar data no padrão do blog
function formatarDataPost(dataString) {
  try {
    const data = new Date(dataString);
    const dia = data.getDate();
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    return `${dia}, ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
  } catch (error) {
    console.warn("Erro ao formatar data:", error);
    return "Data desconhecida";
  }
}

// Função auxiliar para calcular horário relativo
function calcularHorarioRelativo(dataString) {
  try {
    const dataPost = new Date(dataString);
    const agora = new Date();
    const diferencaMs = agora - dataPost;
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    
    if (diferencaMinutos < 1) return "Agora mesmo";
    if (diferencaMinutos === 1) return "Editado há 1 minuto";
    if (diferencaMinutos < 60) return `Editado há ${diferencaMinutos} minutos`;
    
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    if (diferencaHoras === 1) return "Editado há 1 hora";
    if (diferencaHoras < 24) return `Editado há ${diferencaHoras} horas`;
    
    const diferencaDias = Math.floor(diferencaHoras / 24);
    if (diferencaDias === 1) return "Editado há 1 dia";
    return `Editado há ${diferencaDias} dias`;
  } catch (error) {
    console.warn("Erro ao calcular horário relativo:", error);
    return "Editado recentemente";
  }
}

// Mostra mensagem de erro
function mostrarErroCarregamento(mensagem) {
  const relatedGrid = document.getElementById('relatedPosts');
  if (!relatedGrid) return;
  
  relatedGrid.innerHTML = `
    <div class="error-related">
      <i class="fas fa-exclamation-triangle"></i>
      <h4>Erro ao carregar</h4>
      <p>${mensagem}</p>
      <button onclick="carregarDadosFooter()" class="btn-retry">
        <i class="fas fa-redo"></i> Tentar novamente
      </button>
    </div>
  `;
}

// Adiciona CSS dinâmico para os elementos criados
function adicionarEstilosDinamicos() {
  const style = document.createElement('style');
  style.textContent = `
    .loading-related {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      font-style: italic;
      grid-column: 1 / -1;
    }
    
    .loading-spinner {
      font-size: 24px;
      margin-bottom: 10px;
      color: var(--color-primary, #4a6cf7);
    }
    
    .no-articles, .error-related {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      grid-column: 1 / -1;
    }
    
    .no-articles i, .error-related i {
      font-size: 32px;
      margin-bottom: 15px;
      color: #ccc;
    }
    
    .btn-retry {
      background: var(--color-primary, #4a6cf7);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      font-size: 14px;
    }
    
    .btn-retry:hover {
      opacity: 0.9;
    }
    
    .rel-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .rel-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    
    .rel-card .rel-title {
      font-size: 16px;
      margin: 10px 0;
      line-height: 1.4;
      color: #333;
    }
    
    .rel-card .rel-meta {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
  `;
  
  document.head.appendChild(style);
}

// Inicializa os estilos dinâmicos
adicionarEstilosDinamicos();

// Torna a função acessível globalmente para o botão de tentar novamente
window.carregarDadosFooter = carregarDadosFooter;