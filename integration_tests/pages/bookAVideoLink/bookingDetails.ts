import Page, { PageElement } from '../page'

export default class BookingDetailsPage extends Page {
  constructor() {
    super('Enter probation video link booking details for')
  }

  selectProbationTeam = (probationTeam: string) => this.getByLabel('Select probation team').select(probationTeam)

  enterProbationOfficerName = (name: string) => this.getByLabel('Full name').type(name)

  enterProbationOfficerEmail = (email: string) => this.getByLabel('Email address').type(email)

  selectMeetingType = (type: string) =>
    cy
      .contains('legend', 'Select meeting type')
      .parent()
      .within(() => this.getByLabel(type).click())

  selectDate = (date: Date) => this.selectDatePickerDate('Date', date)

  selectDuration = (duration: string) =>
    cy
      .contains('legend', 'Select meeting duration')
      .parent()
      .within(() => this.getByLabel(duration).click())

  selectTimePeriods = (timePeriods: string[]) =>
    cy
      .contains('legend', 'Select time period')
      .parent()
      .within(() => timePeriods.forEach(p => this.getByLabel(p).click()))

  continue = (): PageElement => this.getButton('Continue')
}
