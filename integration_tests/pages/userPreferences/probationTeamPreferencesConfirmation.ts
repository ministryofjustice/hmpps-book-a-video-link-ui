import Page, { PageElement } from '../page'

export default class ProbationTeamPreferencesConfirmationPage extends Page {
  constructor() {
    super('Your probation team list has been updated')
  }

  continue = (): PageElement => this.getButton('Continue')
}
