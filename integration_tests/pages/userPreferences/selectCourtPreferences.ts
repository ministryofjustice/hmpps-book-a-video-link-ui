import Page, { PageElement } from '../page'

export default class SelectCourtPreferencesPage extends Page {
  constructor() {
    super('Manage your list of courts')
  }

  expandAllSections = () =>
    cy.get('.govuk-accordion__show-all').then($button => {
      const isExpanded = $button.attr('aria-expanded') === 'true'
      if (!isExpanded) {
        cy.wrap($button).click()
      }
    })

  checkedOptions = (): PageElement => cy.get('.govuk-accordion').find('input[type="checkbox"]').filter(':checked')

  selectCourt = (court: string) => this.getByLabel(court).click()

  confirm = (): PageElement => this.getButton('Confirm')
}
