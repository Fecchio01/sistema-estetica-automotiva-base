const confirmationDetails = {
  booking: {
    title: 'Apagar agendamento?',
    message: 'A reserva será removida da agenda.',
    confirmLabel: 'Apagar agendamento',
  },
  client: {
    title: 'Apagar cliente?',
    message: 'O cliente sairá das novas operações, mas o histórico será preservado.',
    confirmLabel: 'Apagar cliente',
  },
  employee: {
    title: 'Apagar funcionário?',
    message: 'O acesso do funcionário será removido. O histórico das ordens será preservado.',
    confirmLabel: 'Apagar funcionário',
  },
  service: {
    title: 'Apagar serviço?',
    message: 'O serviço sairá do catálogo, mas não alterará atendimentos antigos.',
    confirmLabel: 'Apagar serviço',
  },
  order: {
    title: 'Apagar ordem?',
    message: 'Este atendimento será removido do sistema.',
    confirmLabel: 'Apagar ordem',
  },
}

const fallbackDetails = {
  title: 'Confirmar exclusão?',
  message: 'Este registro será removido do sistema.',
  confirmLabel: 'Apagar',
}

export function getConfirmationDetails(kind) {
  return { ...(confirmationDetails[kind] || fallbackDetails) }
}

let activeResolve = null

function closeDialog(result) {
  const dialog = document.querySelector('#confirm-dialog')
  if (!dialog) return
  dialog.classList.add('hidden')
  dialog.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('confirm-dialog-open')
  const resolve = activeResolve
  activeResolve = null
  resolve?.(result)
}

export function requestConfirmation(kind = 'unknown') {
  const dialog = document.querySelector('#confirm-dialog')
  if (!dialog) return Promise.resolve(false)
  const details = getConfirmationDetails(kind)
  dialog.querySelector('[data-confirm-title]').textContent = details.title
  dialog.querySelector('[data-confirm-message]').textContent = details.message
  dialog.querySelector('[data-confirm-submit]').textContent = details.confirmLabel
  dialog.classList.remove('hidden')
  dialog.setAttribute('aria-hidden', 'false')
  document.body.classList.add('confirm-dialog-open')
  const cancel = dialog.querySelector('[data-confirm-cancel]')
  const submit = dialog.querySelector('[data-confirm-submit]')
  window.setTimeout(() => cancel?.focus(), 0)
  return new Promise((resolve) => {
    activeResolve?.(false)
    activeResolve = resolve
    cancel.onclick = () => closeDialog(false)
    submit.onclick = () => closeDialog(true)
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    const dialog = document.querySelector('#confirm-dialog')
    if (!dialog || dialog.classList.contains('hidden')) return
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDialog(false)
    }
    if (event.key === 'Enter' && document.activeElement === dialog.querySelector('[data-confirm-submit]')) {
      event.preventDefault()
      closeDialog(true)
    }
  })
}

globalThis.__requestConfirmation = requestConfirmation
