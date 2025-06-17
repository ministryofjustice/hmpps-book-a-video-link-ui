import Page from '../pages/page'
import HomePage from '../pages/home'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import emptySearch from '../mockApis/fixtures/prisonerSearchApi/empty-paged.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
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
      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      // Search for a prisoner page
      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      // Prisoner search results page
      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.prisonerNotListed().click()

      // Prisoner not listed page
      const prisonerNotListedPage = Page.verifyOnPage(PrisonerNotListedPage)
      prisonerNotListedPage.continue().click()

      // Enter prisoner details page
      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      prisonerDetailsPage.continue().click()

      // New booking page - in REQUEST mode
      const newBookingPage = Page.verifyOnPage(NewBookingPage)
      newBookingPage.selectCourt('Aberystwyth Family')
      newBookingPage.selectHearingType('Civil')
      newBookingPage.selectCvpKnown('No')
      newBookingPage.selectGuestPinKnown('No')
      newBookingPage.selectDate(new Date(2050, 0, 1))
      newBookingPage.selectStartTime(15, 0)
      newBookingPage.selectEndTime(16, 0)
      newBookingPage.selectPreHearingRequired('Yes')
      newBookingPage.selectPostHearingRequired('Yes')
      newBookingPage.continue().click()

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
      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      // Search prisoners page
      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      // Search results page
      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.prisonerNotListed().click()

      // Prisoner not listed page
      const prisonerNotListedPage = Page.verifyOnPage(PrisonerNotListedPage)
      prisonerNotListedPage.continue().click()

      // Enter prisoner details manually page
      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      prisonerDetailsPage.continue().click()

      // Enter booking in request mode (will not ask for rooms)
      const bookingDetailsPage = Page.verifyOnPage(BookingDetailsPage)
      bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      bookingDetailsPage.enterProbationOfficerName('Alan Key')
      bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      bookingDetailsPage.selectMeetingType('Recall report')
      bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      bookingDetailsPage.selectStartTime(15, 0)
      bookingDetailsPage.selectEndTime(16, 0)
      bookingDetailsPage.continue().click()

      // Check request page
      const checkRequestPage = Page.verifyOnPage(CheckRequestPage)
      checkRequestPage.requestVideoLink().click()

      // Confirm the requested booking
      Page.verifyOnPage(BookingRequestedPage)
    })
  })
})
