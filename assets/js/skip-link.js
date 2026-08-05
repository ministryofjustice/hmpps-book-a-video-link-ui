function overrideSkipLink() {
  console.log('Initialising skip link override...')

  const skipLink = document.querySelector('.govuk-skip-link')
  const mainContent = document.getElementById('main-content')

  if (!skipLink || !mainContent) return

  const focusableSelectors = [
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[tabindex="0"]',
    'input:not([type="hidden"])',
    'textarea',
  ]

  const firstFocusableElement = mainContent.querySelector(focusableSelectors.join(','))

  if (firstFocusableElement) {
    let elementId

    if (firstFocusableElement.id) {
      elementId = firstFocusableElement.id
    } else {
      elementId = 'first-focusable-element'
      firstFocusableElement.id = elementId
    }

    skipLink.href = `#${elementId}`

    skipLink.addEventListener('click', event => {
      event.preventDefault()

      if (firstFocusableElement instanceof HTMLElement && typeof firstFocusableElement.focus === 'function') {
        firstFocusableElement.focus()

        if (firstFocusableElement instanceof HTMLInputElement || firstFocusableElement instanceof HTMLTextAreaElement) {
          firstFocusableElement.select()
        }
      }
    })
  }
}

export default overrideSkipLink
