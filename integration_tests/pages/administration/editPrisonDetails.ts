import Page, { PageElement } from '../page'

export default class EditPrisonDetailsPage extends Page {
  constructor() {
    // This is not ideal as hardcoded, the prison name is the page title.
    super('AA3 Prison for test')
  }

  selectPickUpTimeOn = (): PageElement => cy.get(`[data-qa=pick-up-time-on]`)

  selectPickUpTime30 = (): PageElement => cy.get(`[data-qa=pick-up-time-30]`)

  save = (): PageElement => this.getButton('Save')

  assertSaved = (): PageElement => cy.get(`.moj-alert__content`).should('have.text', 'Changes have been saved')
}
