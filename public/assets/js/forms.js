export function initializeForms() {
  const form = document.getElementById('formularioContato')
  if (!form) {
    console.warn('Formulario nao encontrado no DOM.')
    return
  }

  const formModalElement = document.getElementById('formModal')
  const confirmModalElement = document.getElementById('confirmModal')
  const confirmModalLabel = document.getElementById('confirmModalLabel')
  const confirmModalMessage = document.getElementById('confirmModalMessage')
  const formModal = new bootstrap.Modal(formModalElement)
  const confirmModal = new bootstrap.Modal(confirmModalElement)

  // Validar produtos apenas se a secao existir
  function validateProdutos() {
    const errorElement = document.getElementById('produtosError')

    // Secao desabilitada => nenhuma validacao
    if (!errorElement) return true

    const checkboxes = form.querySelectorAll('input[name="produtos"]:checked')

    if (checkboxes.length === 0) {
      errorElement.style.display = 'block'
      return false
    } else {
      errorElement.style.display = 'none'
      return true
    }
  }

  // Coletar produtos selecionados (se existirem)
  function getSelectedProdutos() {
    const checkboxes = form.querySelectorAll('input[name="produtos"]:checked')
    if (checkboxes.length === 0) return []
    return Array.from(checkboxes).map((checkbox) => checkbox.value)
  }

  // Event listeners apenas se houver produtos no DOM
  const produtoCheckboxes = form.querySelectorAll('input[name="produtos"]')
  if (produtoCheckboxes.length > 0) {
    produtoCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', validateProdutos)
    })
  }

  const produtoItems = form.querySelectorAll('.produto-item')
  if (produtoItems.length > 0) {
    produtoItems.forEach((item) => {
      item.addEventListener('click', function (e) {
        // Se o clique nao foi diretamente no checkbox, simular clique
        if (e.target.tagName !== 'INPUT') {
          const checkbox = item.querySelector('input[type="checkbox"]')
          if (checkbox) {
            checkbox.checked = !checkbox.checked
            validateProdutos()
          }
        }
      })
    })
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault()

    // Valida apenas se a secao existir
    const produtosAtivos = produtoCheckboxes.length > 0
    if (produtosAtivos && !validateProdutos()) return

    const formData = new FormData(form)
    const data = {}

    // converter formData ignorando produtos
    formData.forEach((value, key) => {
      if (key !== 'produtos') {
        data[key] = value
      }
    })

    // array real com os produtos selecionados
    const selectedProdutos = getSelectedProdutos()
    data.produtos = selectedProdutos

    console.log('Dados do formulario:', data)

    try {
      const response = await fetch('/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        confirmModalLabel.textContent = 'Mensagem enviada com sucesso!'
        confirmModalMessage.innerHTML = `
        Ola!<br/><br/>
        Recebemos suas informacoes e agradecemos o seu interesse nos produtos e solucoes Mig Control.<br/><br/>
        Um de nossos consultores especializados entrara em contato com voce em breve.<br/><br/>
        Produtos selecionados:<br/>
        <strong>${selectedProdutos.join('<br/>• ')}</strong><br/><br/>
        Atenciosamente,<br/>
        Equipe Mig Control
        `
        form.reset()

        const errorElement = document.getElementById('produtosError')
        if (errorElement) errorElement.style.display = 'none'
      } else {
        confirmModalLabel.textContent = 'Erro no envio'
        confirmModalMessage.textContent =
          result.message || 'Falha no envio dos dados. Por favor, tente novamente mais tarde.'
      }

      formModal.hide()
      confirmModal.show()
    } catch (error) {
      console.error('Erro ao enviar o formulario:', error)
      confirmModalLabel.textContent = 'Erro inesperado'
      confirmModalMessage.textContent =
        'Nao foi possivel enviar sua mensagem. Tente novamente mais tarde.'
      formModal.hide()
      confirmModal.show()
    }
  })

  // Resetar erro ao fechar modal se existir
  formModalElement.addEventListener('hidden.bs.modal', function () {
    const errorElement = document.getElementById('produtosError')
    if (errorElement) errorElement.style.display = 'none'
  })
}
