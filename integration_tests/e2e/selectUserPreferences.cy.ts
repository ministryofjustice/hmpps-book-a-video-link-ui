import Page from '../pages/page'
import SelectCourtPreferencesPage from '../pages/userPreferences/selectCourtPreferences'
import CourtPreferencesConfirmationPage from '../pages/userPreferences/courtPreferencesConfirmation'
import SelectProbationTeamPreferencesPage from '../pages/userPreferences/selectProbationTeamPreferences'
import HomePage from '../pages/home'
import ProbationTeamPreferencesConfirmationPage from '../pages/userPreferences/probationTeamPreferencesConfirmation'

context('Select User Preferences', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubGetUserPreferences')
  })

  describe('Court user', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetEnabledCourts')
      cy.task('stubSetUserCourtPreferences')
    })

    it('Court user is asked to complete preferences in first log in', () => {
      cy.task('stubGetUserCourtPreferences', [])
      cy.signIn()

      const selectCourtPreferencesPage = Page.verifyOnPage(SelectCourtPreferencesPage)
      selectCourtPreferencesPage.expandAllSections()
      selectCourtPreferencesPage.checkedOptions().should('have.length', 0)
      selectCourtPreferencesPage.selectCourt('Aberystwyth Civil')
      selectCourtPreferencesPage.selectCourt('Aberystwyth Family')
      selectCourtPreferencesPage.confirm().click()

      cy.task('stubGetUserCourtPreferences')
      const courtPreferencesConfirmationPage = Page.verifyOnPage(CourtPreferencesConfirmationPage)
      courtPreferencesConfirmationPage.continue().click()

      Page.verifyOnPage(HomePage)
    })

    it('Court user can update court preferences', () => {
      cy.task('stubGetUserCourtPreferences')
      cy.signIn()

      const homePage = Page.verifyOnPage(HomePage)
      homePage.manageCourts().click()

      const selectCourtPreferencesPage = Page.verifyOnPage(SelectCourtPreferencesPage)
      selectCourtPreferencesPage.expandAllSections()
      selectCourtPreferencesPage.checkedOptions().should('have.length', 2)
      selectCourtPreferencesPage.confirm().click()

      const courtPreferencesConfirmationPage = Page.verifyOnPage(CourtPreferencesConfirmationPage)
      courtPreferencesConfirmationPage.continue().click()

      Page.verifyOnPage(HomePage)
    })
  })

  describe('Probation user', () => {
    beforeEach(() => {
      cy.task('stubProbationUser')
      cy.task('stubGetEnabledProbationTeams')
      cy.task('stubSetUserProbationTeamPreferences')
    })

    it('Probation user is asked to complete preferences in first log in', () => {
      cy.task('stubGetUserProbationTeamPreferences', [])
      cy.signIn()

      const selectProbationTeamPreferencesPage = Page.verifyOnPage(SelectProbationTeamPreferencesPage)
      selectProbationTeamPreferencesPage.expandAllSections()
      selectProbationTeamPreferencesPage.checkedOptions().should('have.length', 0)
      selectProbationTeamPreferencesPage.selectProbationTeam('Blackpool MC (PPOC)')
      selectProbationTeamPreferencesPage.selectProbationTeam('Burnley MC (PPOC)')
      selectProbationTeamPreferencesPage.confirm().click()

      cy.task('stubGetUserProbationTeamPreferences')
      const probationTeamPreferencesConfirmationPage = Page.verifyOnPage(ProbationTeamPreferencesConfirmationPage)
      probationTeamPreferencesConfirmationPage.continue().click()

      Page.verifyOnPage(HomePage)
    })

    it('Probation user can update probation team preferences', () => {
      cy.task('stubGetUserProbationTeamPreferences')
      cy.signIn()

      const homePage = Page.verifyOnPage(HomePage)
      homePage.manageProbationTeams().click()

      const selectProbationTeamPreferencesPage = Page.verifyOnPage(SelectProbationTeamPreferencesPage)
      selectProbationTeamPreferencesPage.expandAllSections()
      selectProbationTeamPreferencesPage.checkedOptions().should('have.length', 2)
      selectProbationTeamPreferencesPage.confirm().click()

      const probationTeamPreferencesConfirmationPage = Page.verifyOnPage(ProbationTeamPreferencesConfirmationPage)
      probationTeamPreferencesConfirmationPage.continue().click()

      Page.verifyOnPage(HomePage)
    })
  })
})
