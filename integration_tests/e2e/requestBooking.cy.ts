import Page from '../pages/page'
import HomePage from '../pages/home'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import emptySearch from '../mockApis/fixtures/prisonerSearchApi/empty-paged.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import courtBookingNotAvailable from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingNotAvailable.json'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
import BookingNotAvailablePage from '../pages/bookAVideoLink/bookingNotAvailable'
import PrisonerNotListedPage from '../pages/bookAVideoLink/prisonerNotListed'
import PrisonerDetailsPage from '../pages/bookAVideoLink/prisonerDetails'
import CheckRequestPage from '../pages/bookAVideoLink/checkRequest'
import BookingRequestedPage from '../pages/bookAVideoLink/bookingRequested'
import BookingDetailsPage from '../pages/bookAVideoLink/bookingDetails'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'

context('Request a booking', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubAllPrisons')
    cy.task('stubEnabledPrisons')
    cy.task('stubAttributeSearch', emptySearch)
    cy.task('stubPrisonLocations', nottinghamLocations)
    cy.task('stubAvailabilityCheck')
    cy.task('stubRequestBooking')
  })

  describe('Court', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetUserCourtPreferences')
      cy.task('stubCourtHearingTypes')
      cy.signIn()
    })

    it('Can request a video link booking for a court', () => {
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.prisonerNotListed().click()

      const prisonerNotListedPage = Page.verifyOnPage(PrisonerNotListedPage)
      prisonerNotListedPage.continue().click()

      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      prisonerDetailsPage.continue().click()

      const newBookingPage = Page.verifyOnPage(NewBookingPage)
      newBookingPage.selectCourt('Aberystwyth Family')
      newBookingPage.selectHearingType('Civil')
      newBookingPage.selectDate(new Date(2050, 0, 1))
      newBookingPage.selectStartTime(15, 0)
      newBookingPage.selectEndTime(16, 0)
      newBookingPage.selectRoomForMainHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectPreHearingRequired('Yes')
      newBookingPage.selectRoomForPreHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectPostHearingRequired('Yes')
      newBookingPage.selectRoomForPostHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectCvpKnown('No')
      newBookingPage.continue().click()

      const checkRequestPage = Page.verifyOnPage(CheckRequestPage)
      checkRequestPage.requestVideoLink().click()

      Page.verifyOnPage(BookingRequestedPage)
    })

    it('Can request a video link booking for a court with an alternative time suggested', () => {
      cy.task('stubAvailabilityCheck', courtBookingNotAvailable)

      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.prisonerNotListed().click()

      const prisonerNotListedPage = Page.verifyOnPage(PrisonerNotListedPage)
      prisonerNotListedPage.continue().click()

      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      prisonerDetailsPage.continue().click()

      const newBookingPage = Page.verifyOnPage(NewBookingPage)
      newBookingPage.selectCourt('Aberystwyth Family')
      newBookingPage.selectHearingType('Civil')
      newBookingPage.selectDate(new Date(2050, 0, 1))
      newBookingPage.selectStartTime(15, 0)
      newBookingPage.selectEndTime(16, 0)
      newBookingPage.selectRoomForMainHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectPreHearingRequired('Yes')
      newBookingPage.selectRoomForPreHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectPostHearingRequired('Yes')
      newBookingPage.selectRoomForPostHearing('Closed Visits Cubicle 6 - Crown Ct')
      newBookingPage.selectCvpKnown('No')
      newBookingPage.continue().click()

      cy.task('stubAvailabilityCheck')
      const bookingNotAvailablePage = Page.verifyOnPage(BookingNotAvailablePage)
      bookingNotAvailablePage.optionNumber(2).click()

      const checkRequestPage = Page.verifyOnPage(CheckRequestPage)
      checkRequestPage.requestVideoLink().click()

      Page.verifyOnPage(BookingRequestedPage)
    })
  })

  describe('Probation', () => {
    beforeEach(() => {
      cy.task('stubProbationUser')
      cy.task('stubGetUserProbationTeamPreferences')
      cy.task('stubProbationMeetingTypes')
      cy.task('stubAvailableLocations', nottinghamLocationAvailability)
      cy.signIn()
    })

    it('Can request a video link booking for a probation team', () => {
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.prisonerNotListed().click()

      const prisonerNotListedPage = Page.verifyOnPage(PrisonerNotListedPage)
      prisonerNotListedPage.continue().click()

      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      prisonerDetailsPage.continue().click()

      const bookingDetailsPage = Page.verifyOnPage(BookingDetailsPage)
      bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      bookingDetailsPage.enterProbationOfficerName('Alan Key')
      bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      bookingDetailsPage.selectMeetingType('Recall report')
      bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      bookingDetailsPage.selectStartTime(15, 0)
      bookingDetailsPage.selectEndTime(16, 0)
      bookingDetailsPage.continue().click()

      const checkRequestPage = Page.verifyOnPage(CheckRequestPage)
      checkRequestPage.requestVideoLink().click()

      Page.verifyOnPage(BookingRequestedPage)
    })
  })
})
