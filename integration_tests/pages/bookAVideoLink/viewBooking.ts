import Page, { PageElement } from '../page'

export default class ViewBookingPage extends Page {
  constructor() {
    super('Bob Smith’s video link details')
  }

  addComments = (): PageElement => this.getLink('Add comments')

  changeNotes = (): PageElement => cy.get(`[data-qa="change-notes"]`)

  changeBookingDetails = (): PageElement => this.getButton('Change booking details')

  cancelVideoLink = (): PageElement => this.getButton('Cancel video link')

  changeLinkFor = (key: string): PageElement =>
    cy
      .get('.govuk-summary-list__row')
      .contains('.govuk-summary-list__key', key)
      .parent()
      .find('.govuk-summary-list__actions .govuk-link')
}
