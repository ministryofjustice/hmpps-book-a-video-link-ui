import HomePage from '../pages/home'
import AuthSignInPage from '../pages/signIn/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/signIn/authManageDetails'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubCourtUser')
    cy.task('stubUserPreferences')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('Phase banner visible in header', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.headerPhaseBanner().should('contain.text', 'dev')
  })

  it('User can sign out', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User can manage their details', () => {
    cy.signIn()
    cy.task('stubAuthManageDetails')
    const homePage = Page.verifyOnPage(HomePage)

    homePage.manageDetails().get('a').invoke('removeAttr', 'target')
    homePage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubCourtUser', 'bobby brown')
    cy.signIn()

    homePage.headerUserName().contains('B. Brown')
  })
})
