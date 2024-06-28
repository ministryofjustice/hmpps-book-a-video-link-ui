import Page, { PageElement } from '../page'

export default class ViewBookingPage extends Page {
  constructor() {
    super('video link details')
  }

  addComments = (): PageElement => this.getLink('Add comments')
  changeBookingDetails = (): PageElement => this.getButton('Change booking details')
}
