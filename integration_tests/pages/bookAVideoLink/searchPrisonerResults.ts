import Page, { PageElement } from '../page'

export default class SearchPrisonerResultsPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  bookVideoLinkForPrisoner = (prisonerNumber: string): PageElement =>
    cy.get('table.govuk-table').contains('td', prisonerNumber).siblings().last().find('a')

  prisonerNotListed = (): PageElement => cy.get('a').contains('The prisoner is not listed')
}
