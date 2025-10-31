// assets/js/blogLoader.js

document.addEventListener("DOMContentLoaded", async () => {
	const container = document.getElementById("blog-posts");

	try {
		const response = await fetch("/api/posts");
		if (!response.ok) throw new Error("Falha ao carregar posts");

		const posts = await response.json();

		if (!posts.length) {
			container.innerHTML = `
				<p class="text-center text-muted mt-4">
					Nenhum post publicado ainda. Volte em breve!
				</p>`;
			return;
		}

		container.innerHTML = posts
			.map((post, index) => {
				const dataFormatada = new Date(post.created_at)
					.toLocaleDateString("pt-BR", {
						day: "2-digit",
						month: "long",
						year: "numeric",
					})
					.replace(" de ", " de ");

				// Imagem padrão caso o post não tenha uma
				const imagem =
					post.image && post.image.trim() !== ""
						? post.image
						: ".\assets\images\LogoMigControlAzul.png";

				// Gera um link para a página do post completo (exemplo)
				const link = `/post.html?id=${post.id}`;

				return `
				<a href="${link}" class="produto-card" style="--delay: ${index * 0.2}s">
					<div class="imagem-wrapper">
						<img src="${imagem}" alt="${post.title}" />
						<span class="tags">
							<span class="tag">Blog</span>
							<span class="tag">MigControl</span>
						</span>
					</div>
					<div class="produto-texto">
						<span class="data-publicacao">${dataFormatada}</span>
						<h4>${post.title}</h4>
						<p class="descricao">
							${post.content.length > 150 ? post.content.slice(0, 150) + "..." : post.content}
						</p>
						<span class="link-produto">Ler mais →</span>
					</div>
				</a>
				`;
			})
			.join("");
	} catch (error) {
		console.error("Erro ao carregar posts:", error);
		container.innerHTML = `
			<p class="text-center text-danger mt-4">
				Erro ao carregar os posts. Tente novamente mais tarde.
			</p>`;
	}
});
