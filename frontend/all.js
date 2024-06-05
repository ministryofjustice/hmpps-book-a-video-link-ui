import { nodeListForEach } from './utils'
import Card from './components/card/card'
import DatePicker from './components/hmpps-date-picker/datePicker'

function initAll() {
  const $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })

  const $datePickers = document.querySelectorAll('[data-module="hmpps-datepicker"]')
  nodeListForEach($datePickers, function ($datePicker) {
    new DatePicker($datePicker, {}).init()
  })
}

export { initAll }
