let currentPostId = null;

// Carregar posts ao inicializar a página
document.addEventListener("DOMContentLoaded", function () {
	carregarPosts();
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
                    </div>
                `;
		return;
	}

	const postsHTML = posts
		.map(
			(post) => `
                <div class="card post-card mb-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h5 class="card-title">${post.title}</h5>
                                <p class="card-text">${post.content.substring(
																	0,
																	150
																)}${post.content.length > 150 ? "..." : ""}</p>
                                <small class="post-meta">
                                    <i class="fas fa-calendar me-1"></i>
                                    Criado em: ${formatarData(post.created_at)}
                                    ${
																			post.updated_at
																				? `<span class="ms-3"><i class="fas fa-edit me-1"></i>Atualizado: ${formatarData(
																						post.updated_at
																				  )}</span>`
																				: ""
																		}
                                </small>
                            </div>
                            <div class="col-md-4 text-end d-flex align-items-center justify-content-end">
                                <button class="btn btn-action btn-edit" onclick="editarPost(${
																	post.id
																})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-action btn-delete" onclick="confirmarExclusao(${
																	post.id
																}, '${post.title.replace(
				/'/g,
				"\\'"
			)}')" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
		)
		.join("");

	container.innerHTML = postsHTML;
}

// Abrir modal novo post
function abrirModalNovo() {
	currentPostId = null;
	document.getElementById("modalTitle").innerHTML =
		'<i class="fas fa-plus me-2"></i>Novo Post';
	document.getElementById("postForm").reset();
	document.getElementById("postId").value = "";
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
		document.getElementById("content").value = post.content;

		new bootstrap.Modal(document.getElementById("postModal")).show();
	} catch (error) {
		mostrarAlerta("Erro ao carregar post: " + error.message, "danger");
	}
}

// Salvar post
async function salvarPost() {
  const form = document.getElementById('postForm');
  const formData = new FormData(form);

  const postId = document.getElementById('postId').value;
  const method = postId ? 'PUT' : 'POST';
  const url = postId ? `/admin/posts/${postId}` : '/admin/posts';

  try {
    const response = await fetch(url, {
      method,
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      alert('✅ ' + result.message);
      location.reload();
    } else {
      alert('⚠️ ' + result.message);
    }
  } catch (error) {
    console.error('Erro ao salvar post:', error);
    alert('Erro ao salvar post.');
  }
}

// Função para confirmar exclusão
function confirmarExclusao(id, title) {
	currentPostId = id;
	document.getElementById("deletePostTitle").textContent = title;
	new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

// Confirmar exclusão
document
	.getElementById("confirmDelete")
	.addEventListener("click", async function () {
		try {
			const response = await fetch(`/admin/posts/${currentPostId}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Erro ao excluir post");
			}

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
		const result = await response.json();

		if (response.ok) {
			window.location.href = "/login.html";
		} else {
			mostrarAlerta("Erro ao fazer logout", "danger");
		}
	} catch (error) {
		mostrarAlerta("Erro ao fazer logout", "danger");
	}
}

// Mostrar alertas
function mostrarAlerta(mensagem, tipo) {
	const alertsContainer = document.getElementById("alerts");
	const alertId = "alert-" + Date.now();

	const alertHTML = `
                <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                    <i class="fas fa-${
											tipo === "success"
												? "check-circle"
												: "exclamation-triangle"
										} me-2"></i>
                    ${mensagem}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

	alertsContainer.innerHTML = alertHTML;

	// Auto-remover após 5 segundos
	setTimeout(() => {
		const alert = document.getElementById(alertId);
		if (alert) {
			const bsAlert = new bootstrap.Alert(alert);
			bsAlert.close();
		}
	}, 5000);
}

// Função para formatar data
function formatarData(dataString) {
	const data = new Date(dataString);
	return (
		data.toLocaleDateString("pt-BR") +
		" às " +
		data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
	);
}
