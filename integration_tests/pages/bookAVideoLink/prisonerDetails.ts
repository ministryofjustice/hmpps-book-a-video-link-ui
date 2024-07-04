import Page, { PageElement } from '../page'

export default class PrisonerDetailsPage extends Page {
  constructor() {
    super('Who is the video link for?')
  }

  enterFirstName = (firstName: string) => this.getByLabel('First name').type(firstName)
  enterLastName = (lastName: string) => this.getByLabel('Last name').type(lastName)

  enterDateOfBirth = (day: string, month: string, year: string) =>
    this.getByLabel('Day').type(day) && this.getByLabel('Month').type(month) && this.getByLabel('Year').type(year)

  selectPrison = (prison: string) => this.getByLabel('Prison').select(prison)

  continue = (): PageElement => this.getButton('Continue')
}
