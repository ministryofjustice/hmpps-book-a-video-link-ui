import Page, { PageElement } from '../page'

export default class AdministrationPage extends Page {
  constructor() {
    super('Administration')
  }

  extractDataByHearingDate = (): PageElement => this.getLink('Extract data by hearing date')

  extractDataByBookingDate = (): PageElement => this.getLink('Extract data by booking date')
}
