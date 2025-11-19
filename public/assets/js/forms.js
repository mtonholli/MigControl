export function initializeForms() {
  const form = document.getElementById('formularioContato')
  if (!form) {
    console.warn('Formulário não encontrado no DOM.')
    return
  }

  const formModalElement = document.getElementById('formModal')
  const confirmModalElement = document.getElementById('confirmModal')
  const confirmModalLabel = document.getElementById('confirmModalLabel')
  const confirmModalMessage = document.getElementById('confirmModalMessage')
  const formModal = new bootstrap.Modal(formModalElement)
  const confirmModal = new bootstrap.Modal(confirmModalElement)

  // Função para validar se pelo menos um produto foi selecionado
  function validateProdutos() {
    const checkboxes = form.querySelectorAll('input[name="produtos"]:checked')
    const errorElement = document.getElementById('produtosError')

    if (checkboxes.length === 0) {
      errorElement.style.display = 'block'
      return false
    } else {
      errorElement.style.display = 'none'
      return true
    }
  }

  // Função para coletar produtos selecionados
  function getSelectedProdutos() {
    const checkboxes = form.querySelectorAll('input[name="produtos"]:checked')
    const selectedProdutos = Array.from(checkboxes).map((checkbox) => checkbox.value)
    return selectedProdutos
  }

  // Adicionar event listeners para validação em tempo real
  const produtoCheckboxes = form.querySelectorAll('input[name="produtos"]')
  produtoCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', validateProdutos)
  })

  // Melhorar a experiência do usuário com clicks no label
  const produtoItems = form.querySelectorAll('.produto-item')
  produtoItems.forEach((item) => {
    item.addEventListener('click', function (e) {
      // Se o clique não foi diretamente no checkbox, simular o clique
      if (e.target.tagName !== 'INPUT') {
        const checkbox = item.querySelector('input[type="checkbox"]')
        if (checkbox) {
          checkbox.checked = !checkbox.checked
          validateProdutos()
        }
      }
    })
  })

form.addEventListener('submit', async function (e) {
  e.preventDefault()

  if (!validateProdutos()) return

  const formData = new FormData(form)
  const data = {}

  // converter formData ignorando produtos
  formData.forEach((value, key) => {
    if (key !== "produtos") {
      data[key] = value
    }
  })

  // array real com todos os produtos selecionados
  const selectedProdutos = getSelectedProdutos()
  data.produtos = selectedProdutos

  console.log("Dados do formulário:", data)

    console.log('Dados do formulário:', data)

    try {
      const response = await fetch('/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        confirmModalLabel.textContent = 'Mensagem enviada com sucesso!'
        confirmModalMessage.innerHTML = `
        Olá!<br/><br/>
        Recebemos suas informações e agradecemos o seu interesse nos produtos e soluções Mig Control.<br/><br/>
        Um de nossos consultores especializados entrará em contato com você em breve, utilizando a opção de contato preferencial 
        que você indicou no formulário. Nosso objetivo é entender suas necessidades e apresentar as melhores soluções para a sua empresa.<br/><br/>
        Produtos selecionados:<br/>
        <strong>${selectedProdutos.join('<br/>• ')}</strong><br/><br/>
        Fique atento aos nossos canais de comunicação. Caso tenha alguma urgência ou precise de atendimento imediato, 
        você pode entrar em contato diretamente conosco pelo contatos indicados na aba "Contato", durante nosso horário comercial.<br/><br/>
        Atenciosamente,<br/>
        Equipe Mig Control
        `
        form.reset()
        // Esconder mensagem de erro após reset
        document.getElementById('produtosError').style.display = 'none'
      } else {
        confirmModalLabel.textContent = 'Erro no envio'
        confirmModalMessage.textContent =
          result.message || 'Falha no envio dos dados. Por favor, tente novamente mais tarde.'
      }

      formModal.hide()
      confirmModal.show()
    } catch (error) {
      console.error('Erro ao enviar o formulário:', error)
      confirmModalLabel.textContent = 'Erro inesperado'
      confirmModalMessage.textContent =
        'Não foi possível enviar sua mensagem. Tente novamente mais tarde.'
      formModal.hide()
      confirmModal.show()
    }
  })

  // Função para resetar validações quando o modal for fechado
  formModalElement.addEventListener('hidden.bs.modal', function () {
    document.getElementById('produtosError').style.display = 'none'
  })
}
