import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Book a video link with a prison')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')
  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  bookVideoLink = (): PageElement => this.getLink('Book a new video link')
  manageCourts = (): PageElement => this.getLink('Manage your list of courts')
  manageProbationTeams = (): PageElement => this.getLink('Manage your list of probation teams')
}
