const API_URL = "http://localhost:3000/usuarios";

const listaUsuarios = document.getElementById("listaUsuarios");
const emptyState = document.getElementById("emptyState");
const btnAdd = document.getElementById("btnAdd");
const modalOverlay = document.getElementById("modalOverlay");
const btnFechar = document.getElementById("btnFechar");
const btnCancelar = document.getElementById("btnCancelar");
const formUsuario = document.getElementById("formUsuario");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");

let editId = null;
let usuarios = [];

// Abrir modal
btnAdd.addEventListener("click", () => {
  modalTitle.textContent = "Novo Usuário";
  formUsuario.reset();
  editId = null;
  modalOverlay.classList.add("active");
});

// Fechar modal
[btnFechar, btnCancelar].forEach((btn) => {
  btn.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
    formUsuario.reset();
    editId = null;
  });
});

// Listar
async function listarUsuarios(filtro = "") {
  try {
    const res = await fetch(API_URL);
    usuarios = await res.json();

    const filtrados = usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(filtro) ||
        u.email.toLowerCase().includes(filtro)
    );

    listaUsuarios.innerHTML = "";

    if (filtrados.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    filtrados.forEach((u) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h2>${u.nome}</h2>
        <p><i class="fas fa-envelope"></i> ${u.email}</p>
        <div class="actions">
          <button class="edit"><i class="fas fa-edit"></i> Editar</button>
          <button class="delete"><i class="fas fa-trash"></i> Excluir</button>
        </div>
      `;

      card.querySelector(".edit").onclick = () => {
        nomeInput.value = u.nome;
        emailInput.value = u.email;
        editId = u.id;
        modalTitle.textContent = "Editar Usuário";
        modalOverlay.classList.add("active");
      };

      card.querySelector(".delete").onclick = async () => {
        if (confirm(`Excluir ${u.nome}?`)) {
          await fetch(`${API_URL}/${u.id}`, { method: "DELETE" });
          listarUsuarios(searchInput.value.trim().toLowerCase());
        }
      };

      listaUsuarios.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

// Salvar
formUsuario.onsubmit = async (e) => {
  e.preventDefault();
  const usuario = {
    nome: nomeInput.value.trim(),
    email: emailInput.value.trim(),
  };

  try {
    if (editId) {
      await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    }

    modalOverlay.classList.remove("active");
    formUsuario.reset();
    listarUsuarios(searchInput.value.trim().toLowerCase());
  } catch (err) {
    console.error(err);
  }
};

// Busca
searchInput.addEventListener("input", (e) => {
  listarUsuarios(e.target.value.trim().toLowerCase());
});

// Init
listarUsuarios();
