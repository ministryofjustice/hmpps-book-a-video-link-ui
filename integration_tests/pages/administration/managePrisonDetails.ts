import Page, { PageElement } from '../page'

export default class ManagePrisonDetailsPage extends Page {
  constructor() {
    super('Manage prison details')
  }

  managePrisonLink = (prisonCode: string): PageElement => cy.get(`[data-qa=manage-prison-link-${prisonCode}]`)
}
