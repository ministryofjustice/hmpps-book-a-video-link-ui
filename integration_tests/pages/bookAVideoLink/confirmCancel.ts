import Page, { PageElement } from '../page'

export default class ConfirmCancelPage extends Page {
  constructor() {
    super("Are you sure you want to cancel Bob Smith's booking?")
  }

  cancelTheBooking = (): PageElement => this.getButton('Yes, cancel the booking')
}
