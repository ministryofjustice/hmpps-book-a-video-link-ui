import { nodeListForEach } from './utils'
import BackLink from './components/back-link/back-link'
import Card from './components/card/card'
import FormSpinner from './components/form-spinner/form-spinner'
import MojAddAnother from './components/moj-add-another/moj-add-another'
import { ExportButton, PrintButton } from './components/action-bar/print-and-export'
import overrideSkipLink from './components/skip-link/skip-link'

function initAll() {
  var $backLinks = document.querySelectorAll('.govuk-back-link')
  nodeListForEach($backLinks, function ($backLink) {
    new BackLink($backLink)
  })

  const $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })

  const $addAnothers = document.querySelectorAll('.moj-add-another')
  nodeListForEach($addAnothers, function ($addAnother) {
    new MojAddAnother($addAnother)
  })

  const $spinnerForms = document.querySelectorAll('[data-module="form-spinner"]')
  nodeListForEach($spinnerForms, function ($spinnerForm) {
    new FormSpinner($spinnerForm)
  })

  var $exportButtons = document.querySelectorAll('[class*=hmpps-print-and-export--export]')
  nodeListForEach($exportButtons, function ($exportButton) {
    new ExportButton($exportButton)
  })

  var $printButtons = document.querySelectorAll('[class*=hmpps-print-and-export--print]')
  nodeListForEach($printButtons, function ($printButton) {
    new PrintButton($printButton)
  })

  overrideSkipLink()
}

export { initAll }
