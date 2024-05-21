import { nodeListForEach } from './utils'
import Card from './components/card/card'

function initAll() {
  const $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })
}

export { initAll }
