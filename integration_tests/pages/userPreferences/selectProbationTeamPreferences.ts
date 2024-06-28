import Page, { PageElement } from '../page'

export default class SelectProbationTeamPreferencesPage extends Page {
  constructor() {
    super('Manage your list of probation teams')
  }

  expandAllSections = () => {
    cy.get('.govuk-accordion__show-all').then($button => {
      const isExpanded = $button.attr('aria-expanded') === 'true'
      if (!isExpanded) {
        cy.wrap($button).click()
      }
    })
  }

  checkedOptions = (): PageElement => cy.get('.govuk-accordion').find('input[type="checkbox"]').filter(':checked')

  selectProbationTeam = (probationTeam: string) => this.getByLabel(probationTeam).click()

  confirm = (): PageElement => this.getButton('Confirm')
}
