import { nodeListForEach } from './utils'
import BackLink from './back-link'
import Card from './card'
import FormSpinner from './form-spinner'
import MojAddAnother from './moj-add-another'
import { ExportButton, PrintButton } from './print-and-export'
import overrideSkipLink from './skip-link'

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
