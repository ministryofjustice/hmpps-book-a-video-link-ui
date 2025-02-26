import Page, { PageElement } from '../page'

export default class ChangeProbationBookingPage extends Page {
  constructor() {
    super('Change probation video link booking details for')
  }

  selectTimePeriods = (timePeriods: string[]) =>
    cy
      .contains('legend', 'Select time period')
      .parent()
      .within(() => timePeriods.forEach(p => this.getByLabel(p).click()))

  continue = (): PageElement => this.getButton('Continue')
}
