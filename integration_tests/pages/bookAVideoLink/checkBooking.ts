import Page, { PageElement } from '../page'

export default class CheckBookingPage extends Page {
  constructor() {
    super('Check and confirm your booking')
  }

  bookVideoLink = (): PageElement => this.getButton('Book video link')

  updateBooking = (): PageElement => this.getButton('Update booking')
}
