import Page, { PageElement } from '../page'

export default class CourtPreferencesConfirmationPage extends Page {
  constructor() {
    super('Your court list has been updated')
  }

  continue = (): PageElement => this.getButton('Continue')
}
