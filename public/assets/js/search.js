// assets/js/search.js

const normalizeString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
}

const displaySearchTerm = (query) => {
  const container = document.querySelector('.banner-products .container-fluid')
  if (container && !container.querySelector('.clear-search')) {
    const title = document.createElement('h4')
    title.className = 'mt-3'
    title.innerHTML = `<h4 style="color: #fdfdfd">pesquisando por: <strong style="color: #bae3ff;">${query}</strong></h4>`
    const clearButton = document.createElement('button')
    clearButton.className = 'btn btn-outline-light mt-3 clear-search'
    clearButton.innerHTML = '<i class="fas fa-times"></i> Limpar Pesquisa'
    clearButton.addEventListener('click', () => {
      window.location.href = 'produtos.html'
    })
    container.append(title, clearButton)
  }
}

const filterProducts = (query) => {
  const allProducts = document.querySelectorAll('.product-card')
  const sections = document.querySelectorAll('.product-category')
  let hasResults = false

  const normalizedQuery = normalizeString(query)

  allProducts.forEach((product) => {
    const title = product.querySelector('h4')?.textContent || ''
    const description = product.querySelector('p')?.textContent || ''
    const productText = normalizeString(title + ' ' + description)

    if (productText.includes(normalizedQuery)) {
      product.style.display = 'block'
      product.classList.add('search-result')
      hasResults = true
    } else {
      product.style.display = 'none'
      product.classList.remove('search-result')
    }
  })

  sections.forEach((section) => {
    const visibleProducts = section.querySelectorAll(
      '.product-card[style*="block"], .product-card:not([style*="none"])'
    )
    const actualVisibleProducts = Array.from(visibleProducts).filter(
      (p) => !p.style.display || p.style.display !== 'none'
    )

    if (actualVisibleProducts.length === 0) {
      section.style.display = 'none'
    } else {
      section.style.display = 'block'
    }
  })

  showNoResultsMessage(hasResults, query)
}

const showNoResultsMessage = (hasResults, query) => {
  const existingMessage = document.querySelector('.no-results-message')
  if (existingMessage) {
    existingMessage.remove()
  }

  if (!hasResults) {
    const message = document.createElement('div')
    message.className = 'no-results-message text-center py-5'
    message.innerHTML = `
      <div class="container">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h3>Nenhum produto encontrado</h3>
        <p class="text-muted">Não encontramos produtos relacionados a "<strong>${query}</strong>"</p>
        <p class="text-muted">Tente usar palavras-chave diferentes ou navegue por nossas categorias.</p>
        <button class="btn btn-primary mt-3" onclick="window.location.href='produtos.html'">
          Ver Todos os Produtos
        </button>
      </div>
    `

    const banner = document.querySelector('.banner-products')
    if (banner && banner.nextElementSibling) {
      banner.parentNode.insertBefore(message, banner.nextElementSibling)
    }
  }
}

const initializeProductFilter = () => {
  if (!window.location.pathname.includes('produtos.html')) return

  const urlParams = new URLSearchParams(window.location.search)
  const searchQuery = urlParams.get('search')

  if (!searchQuery) return

  displaySearchTerm(searchQuery)
  filterProducts(searchQuery)

  setTimeout(() => {
    const searchResults = document.querySelectorAll('.product-card.search-result')
    searchResults.forEach((card) => {
      card.style.animation = 'searchHighlight 2s ease-in-out'
      card.style.border = '2px solid #007bff'
      card.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)'
    })
  }, 100)
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeProductFilter, 500)
})
