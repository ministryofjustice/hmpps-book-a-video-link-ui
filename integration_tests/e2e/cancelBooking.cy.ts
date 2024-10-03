import Page from '../pages/page'
import HomePage from '../pages/home'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import ViewBookingPage from '../pages/bookAVideoLink/viewBooking'
import ConfirmCancelPage from '../pages/bookAVideoLink/confirmCancel'
import CancelConfirmationPage from '../pages/bookAVideoLink/cancelConfirmation'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'

context('Cancel a booking', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubPrisoner', A0171DZ)
    cy.task('stubPrisonerList', [A0171DZ])
    cy.task('stubEnabledPrisons')
    cy.task('stubPrisonLocations', nottinghamLocations)
    cy.task('stubCancelBooking')
  })

  describe('Court', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetUserCourtPreferences')
      cy.task('stubGetCourtSchedule')
      cy.task('stubGetBooking', bobSmithCourtBooking)
      cy.signIn()
    })

    it('Can cancel a court video link booking', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.cancelVideoLink().click()

      const confirmCancelPage = Page.verifyOnPage(ConfirmCancelPage)
      confirmCancelPage.cancelTheBooking().click()

      Page.verifyOnPage(CancelConfirmationPage)
    })
  })

  describe('Probation', () => {
    beforeEach(() => {
      cy.task('stubProbationUser')
      cy.task('stubGetUserProbationTeamPreferences')
      cy.task('stubGetProbationTeamSchedule')
      cy.task('stubGetBooking', bobSmithProbationBooking)
      cy.signIn()
    })

    it('Can cancel a probation video link booking', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetProbationTeamSchedule', {
        probationTeamCode: 'BLKPPP',
        date: '2050-01-01',
        response: probationBookingsForDay,
      })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectProbationTeam('Blackpool MC (PPOC)')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.cancelVideoLink().click()

      const confirmCancelPage = Page.verifyOnPage(ConfirmCancelPage)
      confirmCancelPage.cancelTheBooking().click()

      Page.verifyOnPage(CancelConfirmationPage)
    })
  })
})
