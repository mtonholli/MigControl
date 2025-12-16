let currentPostId = null;
let pendingEditorContent = null;
let editorReady = false;

// Carregar posts ao inicializar a página
document.addEventListener("DOMContentLoaded", function () {
	carregarPosts();
});

document.addEventListener("DOMContentLoaded", () => {
  tinymce.init({
    selector: "#content",
    height: 400,
    menubar: true,
	content_css: "/assets/css/post.css",
    plugins: "lists link image code table autoresize",
    toolbar:
      "undo redo | blocks fontfamily fontsize | " +
      "bold italic underline | forecolor backcolor | " +
      "alignleft aligncenter alignright | " +
      "bullist numlist | link image | removeformat | code",
    setup(editor) {
      editor.on("init", () => {
        editorReady = true;

        // 🔥 aplica conteúdo pendente com segurança
        if (pendingEditorContent !== null) {
          editor.setContent(pendingEditorContent);
          pendingEditorContent = null;
        }
      });
    }
  });
});

// Carregar posts
async function carregarPosts() {
	try {
		const response = await fetch("/admin/posts");
		const posts = await response.json();

		if (!response.ok) {
			throw new Error(posts.message || "Erro ao carregar posts");
		}

		exibirPosts(posts);
		document.getElementById("loading").style.display = "none";
	} catch (error) {
		console.error("Erro:", error);
		mostrarAlerta("Erro ao carregar posts: " + error.message, "danger");
		document.getElementById("loading").style.display = "none";
	}
}

// Exibir posts
function exibirPosts(posts) {
	const container = document.getElementById("posts-container");

	if (posts.length === 0) {
		container.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-blog fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">Nenhum post encontrado</h4>
        <p class="text-muted">Clique em "Novo Post" para criar seu primeiro post.</p>
      </div>`;
		return;
	}

	container.innerHTML = posts
		.map(
			(post) => `
        <div class="card post-card mb-3">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title">${post.title}</h5>
                <p class="card-text">
                  ${post.content.substring(0, 150)}${post.content.length > 150 ? "..." : ""}
                </p>
                <small class="post-meta">
                  <i class="fas fa-calendar me-1"></i>
                  Criado em: ${formatarData(post.created_at)}
                  ${
										post.updated_at
											? `<span class="ms-3">
                          <i class="fas fa-edit me-1"></i>
                          Atualizado: ${formatarData(post.updated_at)}
                        </span>`
											: ""
									}
                </small>
              </div>
              <div class="col-md-4 text-end d-flex align-items-center justify-content-end">
                <button class="btn btn-action btn-edit" onclick="editarPost(${post.id})">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-action btn-delete"
                  onclick="confirmarExclusao(${post.id}, '${post.title.replace(/'/g, "\\'")}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>`
		)
		.join("");
}

// Abrir modal novo post
function abrirModalNovo() {
	currentPostId = null;
	document.getElementById("modalTitle").innerHTML =
		'<i class="fas fa-plus me-2"></i>Novo Post';
	document.getElementById("postForm").reset();
	document.getElementById("postId").value = "";

	const modalEl = document.getElementById("postModal");
	const modal = new bootstrap.Modal(modalEl);
	modal.show();

	modalEl.addEventListener(
		"shown.bs.modal",
		() => {
			const editor = tinymce.get("content");
			if (editor) editor.setContent("");
		},
		{ once: true }
	);
}


// Editar post
async function editarPost(id) {
  try {
    const response = await fetch(`/admin/posts/${id}`);
    const post = await response.json();

    if (!response.ok) {
      throw new Error(post.message || "Erro ao carregar post");
    }

    currentPostId = id;

    document.getElementById("modalTitle").innerHTML =
      '<i class="fas fa-edit me-2"></i>Editar Post';

    document.getElementById("postId").value = id;
    document.getElementById("title").value = post.title;

    // 🔑 guarda conteúdo
    pendingEditorContent = post.content || "";

    const modal = new bootstrap.Modal(
      document.getElementById("postModal")
    );
    modal.show();

    // se o editor já estiver pronto, aplica imediatamente
    if (editorReady) {
      tinymce.get("content").setContent(pendingEditorContent);
      pendingEditorContent = null;
    }

  } catch (error) {
    mostrarAlerta("Erro ao carregar post: " + error.message, "danger");
  }
}

// Salvar post
async function salvarPost() {
	const form = document.getElementById("postForm");
	const formData = new FormData(form);

	const editor = tinymce.get("content");
	if (editor) {
		formData.set("content", editor.getContent());
	}

	const postId = document.getElementById("postId").value;
	const method = postId ? "PUT" : "POST";
	const url = postId ? `/admin/posts/${postId}` : "/admin/posts";

	try {
		const response = await fetch(url, { method, body: formData });
		const result = await response.json();

		if (result.success) {
			alert("✅ " + result.message);
			location.reload();
		} else {
			alert("⚠️ " + result.message);
		}
	} catch (error) {
		console.error("Erro ao salvar post:", error);
		alert("Erro ao salvar post.");
	}
}

// Confirmar exclusão
function confirmarExclusao(id, title) {
	currentPostId = id;
	document.getElementById("deletePostTitle").textContent = title;
	new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

// Executar exclusão
document.getElementById("confirmDelete").addEventListener("click", async () => {
	try {
		const response = await fetch(`/admin/posts/${currentPostId}`, {
			method: "DELETE",
		});
		const result = await response.json();

		if (!response.ok) throw new Error(result.message);

		mostrarAlerta(result.message, "success");
		bootstrap.Modal.getInstance(
			document.getElementById("deleteModal")
		).hide();
		carregarPosts();
	} catch (error) {
		mostrarAlerta("Erro ao excluir post: " + error.message, "danger");
	}
});

// Logout
async function logout() {
	try {
		const response = await fetch("/logout", { method: "POST" });
		if (response.ok) window.location.href = "/login.html";
		else mostrarAlerta("Erro ao fazer logout", "danger");
	} catch {
		mostrarAlerta("Erro ao fazer logout", "danger");
	}
}

// Alertas
function mostrarAlerta(mensagem, tipo) {
	const alertsContainer = document.getElementById("alerts");
	const alertId = "alert-" + Date.now();

	alertsContainer.innerHTML = `
    <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show">
      ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;

	setTimeout(() => {
		const alert = document.getElementById(alertId);
		if (alert) new bootstrap.Alert(alert).close();
	}, 5000);
}

// Data
function formatarData(dataString) {
	const data = new Date(dataString);
	return (
		data.toLocaleDateString("pt-BR") +
		" às " +
		data.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		})
	);
}
