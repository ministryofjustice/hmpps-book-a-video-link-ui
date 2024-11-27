import { nodeListForEach } from './utils'
import BackLink from './components/back-link/back-link'
import Card from './components/card/card'
import FormSpinner from './components/form-spinner/form-spinner'

function initAll() {
  var $backLinks = document.querySelectorAll('.govuk-back-link')
  nodeListForEach($backLinks, function ($backLink) {
    new BackLink($backLink)
  })

  const $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })

  const $spinnerForms = document.querySelectorAll('[data-module="form-spinner"]')
  nodeListForEach($spinnerForms, function ($spinnerForm) {
    new FormSpinner($spinnerForm)
  })
}

export { initAll }
