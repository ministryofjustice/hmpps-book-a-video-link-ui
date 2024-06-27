import Page, { PageElement } from '../page'

export default class BookingNotAvailablePage extends Page {
  constructor() {
    super('Video link booking not available')
  }

  optionNumber = (optionNumber: number): PageElement => cy.get(`[data-qa="option-${optionNumber}"]`)
}
