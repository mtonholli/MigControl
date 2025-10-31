document.addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(window.location.search);
	const postId = params.get("id");

	const titleEl = document.getElementById("post-title");
	const dateEl = document.getElementById("post-date");
	const imageEl = document.getElementById("post-image");
	const bodyEl = document.getElementById("post-body");

	if (!postId) {
		bodyEl.innerHTML = `
			<p class="text-center text-danger mt-5">
				Nenhum post especificado. Volte para o <a href="/blog.html">blog</a>.
			</p>`;
		return;
	}

	try {
		const response = await fetch(`/api/posts/${postId}`);
		if (!response.ok) throw new Error("Falha ao carregar o post");

		const post = await response.json();

		// Define imagem padrão caso não exista
		const imagem =
			post.image && post.image.trim() !== ""
				? post.image
				: "./assets/images/LogoMigControlAzul.png";

		// Define título, data e conteúdo
		titleEl.textContent = post.title;
		dateEl.textContent = new Date(post.created_at).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
		imageEl.src = imagem;

		// Se o conteúdo vier em HTML, exibe diretamente
		bodyEl.innerHTML = post.content;
	} catch (error) {
		console.error("Erro ao carregar post:", error);
		bodyEl.innerHTML = `
			<p class="text-center text-danger mt-5">
				Erro ao carregar o post. <a href="/blog.html">Voltar</a>
			</p>`;
	}
});
