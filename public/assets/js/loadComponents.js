const loadedStyles = new Set()
const path = window.location.pathname

const headerStyles = () => {
  const header = document.querySelector('.header-main')
  const logo = document.querySelector('.logo')
  const navItems = document.querySelectorAll('.nav-link')
  const btnSearch = document.querySelector('.fa-search')
  const btnMenuBar = document.querySelector('.fa-bars')

  if (window.scrollY > 0) {
    header.classList.add('scrolled')
    logo.src = 'assets/images/LogoMigControlAzul.png'
    navItems.forEach((navItem) => {
      navItem.style.color = 'var(--color-gray-800)'
    })
    btnSearch.style.color = 'var(--color-gray-800)'
    btnMenuBar.style.color = 'var(--color-gray-800)'
  } else {
    header.classList.remove('scrolled')
    if (path.includes('/produto-')) {
      logo.src = 'assets/images/LogoMigControlAzul.png'
      navItems.forEach((navItem) => {
        navItem.style.color = 'var(--color-gray-800)'
      })
      btnSearch.style.color = 'var(--color-gray-800)'
      btnMenuBar.style.color = 'var(--color-gray-800)'
    } else {
      logo.src = 'assets/images/LogoMigControlBranca.png'
      if (window.matchMedia('(max-width: 992px)').matches) {
        navItems.forEach((navItem) => {
          navItem.style.color = 'var(--color-gray-800)'
        })
      } else {
        navItems.forEach((navItem) => {
          navItem.style.color = 'var(--color-gray-100)'
        })
      }
      btnSearch.style.color = 'var(--color-gray-100)'
      btnMenuBar.style.color = 'var(--color-gray-100)'
    }
  }
}

window.addEventListener('scroll', headerStyles)

const dropSubmenu = () => {
  document.querySelectorAll('.submenu-toggle').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault()

      const currentSubmenu = this.nextElementSibling
      const isCurrentOpen = currentSubmenu.classList.contains('open')

      document.querySelectorAll('.submenu').forEach((submenu) => {
        submenu.classList.remove('open')
      })

      if (!isCurrentOpen) {
        currentSubmenu.classList.add('open')
      }
    })
  })

  const dropdownToggle = document.querySelector('.dropdown-toggle-custom')
  const dropdownMenu = document.querySelector('#dropdown-menu-custom')

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', function (e) {
      e.preventDefault()

      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block'
    })
  }
}

const smoothEffect = () => {
  const contatoLink = document.querySelector('.nav-link.contato')

  if (!contatoLink) return

  contatoLink.addEventListener('click', async function (e) {
    e.preventDefault()

    const footer = document.querySelector('#footer')
    if (!footer) return

    // Posição do topo do footer
    const targetY = footer.getBoundingClientRect().top + window.scrollY
    const duration = 1000 // duração em milissegundos (1 segundo)

    const startY = window.scrollY
    const startTime = performance.now()

    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

    const animate = (currentTime) => {
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      const ease = easeInOutQuad(progress)
      const newY = startY + (targetY - startY) * ease
      window.scrollTo(0, newY)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  })
}

const initializeSearch = () => {
  const searchForm = document.querySelector('.search-form')
  const searchInput = document.querySelector('.search-input')
  const searchSubmit = document.querySelector('.search-submit')
  const searchModal = document.getElementById('searchModal')

  if (!searchForm || !searchInput || !searchSubmit) return

  const executeSearch = () => {
    const query = searchInput.value.trim()

    if (query) {
      const modal = bootstrap.Modal.getInstance(searchModal)
      if (modal) modal.hide()

      const currentPath = window.location.pathname
      const isInPublicFolder = currentPath.includes('/public/')
      const productsUrl = isInPublicFolder ? '../produtos.html' : './produtos.html'

      window.location.href = `${productsUrl}?search=${encodeURIComponent(query)}`
    }
  }

  searchSubmit.addEventListener('click', (e) => {
    e.preventDefault()
    executeSearch()
  })

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeSearch()
    }
  })

  searchModal.addEventListener('shown.bs.modal', () => {
    searchInput.value = ''
    searchInput.focus()
  })
}

export async function loadComponent(componentName, targetElementId) {
  try {
    console.log(`🔄 Carregando componente: ${componentName}`)

    const basePath = window.location.pathname.includes('/public/') ? '../' : './'
    const componentPath = `${basePath}partials/${componentName}.html`
    const cssPath = `${basePath}assets/css/${componentName}.css`

    // Carrega CSS se ainda não estiver carregado
    if (!loadedStyles.has(cssPath)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssPath
      document.head.appendChild(link)
      loadedStyles.add(cssPath)
      console.log(`✅ CSS de "${componentName}" carregado`)
    }

    // Busca e insere HTML do componente
    const response = await fetch(componentPath)
    if (!response.ok) throw new Error(`Erro ao carregar: ${response.status}`)

    const html = await response.text()
    const targetElement = document.getElementById(targetElementId)

    if (targetElement) {
      targetElement.innerHTML = html
      console.log(`✅ Componente "${componentName}" inserido em #${targetElementId}`)

      setTimeout(() => {
        headerStyles()
        dropSubmenu()
        smoothEffect()
        initializeSearch()
      }, 100)

      if (componentName === 'forms') {
        // Carrega forms.js dinamicamente e inicializa
        setTimeout(async () => {
          try {
            const module = await import('./forms.js')
            if (typeof module.initializeForms === 'function') {
              module.initializeForms()
              console.log('✅ forms.js carregado e inicializado')
            } else {
              console.warn('⚠️ initializeForms() não exportado corretamente.')
            }
          } catch (err) {
            console.error('❌ Erro ao carregar forms.js:', err)
          }
        }, 100)
      }
      if (componentName === 'footer') {
        const initWhatsappButton = () => {
          const button = document.getElementById('whatsappButton')
          if (!button) {
            console.warn('⚠️ Botão WhatsApp não encontrado no DOM.')
            return
          }

          const updateVisibility = () => {
            if (window.scrollY > 200) {
              button.classList.add('visible')
            } else {
              button.classList.remove('visible')
            }
          }

          // Verifica o estado inicial
          updateVisibility()

          // Escuta scroll
          window.addEventListener('scroll', updateVisibility)

          console.log('✅ Comportamento do botão WhatsApp ativado.')
        }

        // Espera o botão ser inserido no DOM
        setTimeout(initWhatsappButton, 100)
      }
    } else {
      console.error(`❌ Elemento destino "${targetElementId}" não encontrado no DOM`)
    }
  } catch (error) {
    console.error(`❌ Falha ao carregar o componente "${componentName}":`, error)
  }
}

// Carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM carregado, iniciando componentes...')
  loadComponent('footer', 'footer')
  loadComponent('header', 'header')
  loadComponent('forms', 'forms')
})
