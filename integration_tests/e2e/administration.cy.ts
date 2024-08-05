import { startOfToday } from 'date-fns'
import Page from '../pages/page'
import HomePage from '../pages/home'
import AdministrationPage from '../pages/administration/administration'
import ExtractDataByBookingDatePage from '../pages/administration/extractDataByBookingDate'
import ExtractDataByHearingDatePage from '../pages/administration/extractDataByHearingDate'

context('Administration', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['BVLS_ADMIN'])
  })

  beforeEach(() => {
    cy.task('stubAdminUser')
  })

  it('Admin user can download a CSV of court booking events by date of booking', () => {
    cy.task('stubCourtDataExtractByBookingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByBookingDate().click()

    const extractDataByBookingDatePage = Page.verifyOnPage(ExtractDataByBookingDatePage)
    extractDataByBookingDatePage.selectCourt()
    extractDataByBookingDatePage.selectDate(startOfToday())
    extractDataByBookingDatePage.enterNumberOfDays(7)
    extractDataByBookingDatePage.extractData().click()

    cy.readFile('cypress/downloads/courtDataExtractByBookingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of probation booking events by date of booking', () => {
    cy.task('stubProbationDataExtractByBookingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByBookingDate().click()

    const extractDataByBookingDatePage = Page.verifyOnPage(ExtractDataByBookingDatePage)
    extractDataByBookingDatePage.selectProbation()
    extractDataByBookingDatePage.selectDate(startOfToday())
    extractDataByBookingDatePage.enterNumberOfDays(7)
    extractDataByBookingDatePage.extractData().click()

    cy.readFile('cypress/downloads/probationDataExtractByBookingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of court booking events by date of hearing', () => {
    cy.task('stubCourtDataExtractByHearingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByHearingDate().click()

    const extractDataByHearingDatePage = Page.verifyOnPage(ExtractDataByHearingDatePage)
    extractDataByHearingDatePage.selectCourt()
    extractDataByHearingDatePage.selectDate(startOfToday())
    extractDataByHearingDatePage.enterNumberOfDays(7)
    extractDataByHearingDatePage.extractData().click()

    cy.readFile('cypress/downloads/courtDataExtractByHearingDate.csv').should('exist')
  })

  it('Admin user can download a CSV of probation booking events by date of hearing', () => {
    cy.task('stubProbationDataExtractByMeetingDate')
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.administrationArea().click()

    const administrationPage = Page.verifyOnPage(AdministrationPage)
    administrationPage.extractDataByHearingDate().click()

    const extractDataByHearingDatePage = Page.verifyOnPage(ExtractDataByHearingDatePage)
    extractDataByHearingDatePage.selectProbation()
    extractDataByHearingDatePage.selectDate(startOfToday())
    extractDataByHearingDatePage.enterNumberOfDays(7)
    extractDataByHearingDatePage.extractData().click()

    cy.readFile('cypress/downloads/probationDataExtractByMeetingDate.csv').should('exist')
  })
})
