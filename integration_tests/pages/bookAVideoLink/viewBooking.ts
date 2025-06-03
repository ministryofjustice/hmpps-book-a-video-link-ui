import Page, { PageElement } from '../page'

export default class ViewBookingPage extends Page {
  constructor() {
    super('Bob Smith’s video link details')
  }

  addComments = (): PageElement => this.getLink('Add comments')

  changeNotes = (): PageElement => cy.get(`[data-qa="change-notes"]`)

  changeBookingDetails = (): PageElement => this.getButton('Change booking details')

  cancelVideoLink = (): PageElement => this.getButton('Cancel video link')
}
