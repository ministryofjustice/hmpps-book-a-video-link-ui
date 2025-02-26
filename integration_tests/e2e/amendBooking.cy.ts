import Page from '../pages/page'
import HomePage from '../pages/home'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import ViewBookingPage from '../pages/bookAVideoLink/viewBooking'
import AddCommentsPage from '../pages/bookAVideoLink/addComments'
import UpdateConfirmationPage from '../pages/bookAVideoLink/updateConfirmation'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import ChangeVideoLinkBookingPage from '../pages/bookAVideoLink/changeVideoLinkBooking'
import BookingNotAvailablePage from '../pages/bookAVideoLink/bookingNotAvailable'
import courtBookingNotAvailable from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingNotAvailable.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import ChangeProbationBookingPage from '../pages/bookAVideoLink/changeProbationBooking'
import LocationAvailabilityPage from '../pages/bookAVideoLink/locationAvailability'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'

context('Amend a booking', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubPrisoner', A0171DZ)
    cy.task('stubPrisonerList', [A0171DZ])
    cy.task('stubEnabledPrisons')
    cy.task('stubAllPrisons')
    cy.task('stubPrisonLocations', nottinghamLocations)
    cy.task('stubAvailabilityCheck')
    cy.task('stubUpdateBooking')
  })

  describe('Court', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetUserCourtPreferences')
      cy.task('stubCourtHearingTypes')
      cy.task('stubGetCourtSchedule')
      cy.task('stubGetBooking', bobSmithCourtBooking)
      cy.signIn()
    })

    it('Can add comments to a video link booking for a court', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.addComments().click()

      const addCommentsPage = Page.verifyOnPage(AddCommentsPage)
      addCommentsPage.enterComments('Test comment')
      addCommentsPage.continue().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })

    it('Can change the rooms for a court video link booking', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.changeBookingDetails().click()

      const changeVideoLinkBookingPage = Page.verifyOnPage(ChangeVideoLinkBookingPage)
      changeVideoLinkBookingPage.selectRoomForMainHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.selectRoomForPreHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.selectRoomForPostHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.continue().click()

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.updateBooking().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })

    it('Can change the rooms for a court video link booking with an alternative time suggested', () => {
      cy.task('stubAvailabilityCheck', courtBookingNotAvailable)

      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.changeBookingDetails().click()

      const changeVideoLinkBookingPage = Page.verifyOnPage(ChangeVideoLinkBookingPage)
      changeVideoLinkBookingPage.selectRoomForMainHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.selectRoomForPreHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.selectRoomForPostHearing('Legal Visits Room 1 - Magistrates Conf')
      changeVideoLinkBookingPage.continue().click()

      cy.task('stubAvailabilityCheck')
      const bookingNotAvailablePage = Page.verifyOnPage(BookingNotAvailablePage)
      bookingNotAvailablePage.optionNumber(2).click()

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.updateBooking().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })
  })

  describe('Probation', () => {
    beforeEach(() => {
      cy.task('stubProbationUser')
      cy.task('stubGetUserProbationTeamPreferences')
      cy.task('stubProbationMeetingTypes')
      cy.task('stubGetProbationTeamSchedule')
      cy.task('stubGetBooking', bobSmithProbationBooking)
      cy.task('stubAvailableLocations', nottinghamLocationAvailability)
      cy.signIn()
    })

    it('Can add comments to a video link booking for a probation team', () => {
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
      viewBookingPage.addComments().click()

      const addCommentsPage = Page.verifyOnPage(AddCommentsPage)
      addCommentsPage.enterComments('Test comment')
      addCommentsPage.continue().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })

    it('Can change the time for a probation video link booking', () => {
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
      viewBookingPage.changeBookingDetails().click()

      const changeProbationBookingPage = Page.verifyOnPage(ChangeProbationBookingPage)
      changeProbationBookingPage.continue().click()

      const locationAvailabilityPage = Page.verifyOnPage(LocationAvailabilityPage)
      locationAvailabilityPage.selectSlot('10:00 to 11:00')
      locationAvailabilityPage.continue().click()

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.updateBooking().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })
  })
})
