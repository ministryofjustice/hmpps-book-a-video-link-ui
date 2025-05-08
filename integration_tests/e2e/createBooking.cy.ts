import Page from '../pages/page'
import HomePage from '../pages/home'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import smithSearch from '../mockApis/fixtures/prisonerSearchApi/SMITH-paged.json'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'
import nottinghamSelectRoomsByDateTime from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTime.json'
import nottinghamSelectRoomsByDateTimeEmpty from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTimeEmpty.json'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import ConfirmationPage from '../pages/bookAVideoLink/confirmation'
import SelectRoomsPage from '../pages/bookAVideoLink/selectRoomsPage'
import BookingDetailsPage from '../pages/bookAVideoLink/bookingDetails'
import LocationAvailabilityPage from '../pages/bookAVideoLink/locationAvailability'
import NoRoomsAvailablePage from '../pages/bookAVideoLink/noRoomsAvailablePage'

context('Create a booking', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubAllPrisons')
    cy.task('stubEnabledPrisons')
    cy.task('stubAttributeSearch', smithSearch as unknown as JSON)
    cy.task('stubPrisoner', A0171DZ as unknown as JSON)
    cy.task('stubPrisonLocations', nottinghamLocations as unknown as JSON)
    cy.task('stubAvailabilityCheck')
    cy.task('stubCreateBooking')
  })

  describe('Court', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetUserCourtPreferences')
      cy.task('stubCourtHearingTypes')
      cy.task('stubGetBooking', bobSmithCourtBooking as unknown as JSON)
      cy.task('stubPostRoomsByDateAndTime', nottinghamSelectRoomsByDateTime as unknown as JSON)
      cy.signIn()
    })

    it('Can create a video link booking for a court', () => {
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      // Prisoner search page
      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      // Prisoner search results page
      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

      // Enter booking details (court) page
      const newBookingPage = Page.verifyOnPage(NewBookingPage)
      newBookingPage.selectCourt('Aberystwyth Family')
      newBookingPage.selectHearingType('Civil')
      newBookingPage.selectCvpKnown('No')
      newBookingPage.selectDate(new Date(2050, 0, 1))
      newBookingPage.selectStartTime(15, 0)
      newBookingPage.selectEndTime(16, 0)
      newBookingPage.selectPreHearingRequired('Yes')
      newBookingPage.selectPostHearingRequired('Yes')
      newBookingPage.continue().click()

      // Select from available rooms page - the times will all reflect the main hearing time
      // (because wiremock cannot return different, multiple responses to the same POST endpoint, one per hearing)
      const selectRoomsPage = Page.verifyOnPage(SelectRoomsPage)
      selectRoomsPage.selectRoomForMainHearing('Closed Visits Cubicle 6 - Crown Ct')
      selectRoomsPage.selectRoomForPreHearing('Closed Visits Cubicle 6 - Crown Ct')
      selectRoomsPage.selectRoomForPostHearing('Closed Visits Cubicle 6 - Crown Ct')

      selectRoomsPage.continue().click()

      // Check the booking details page
      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.assertCourt('Aberystwyth Family')
      checkBookingPage.assertPrison('Nottingham (HMP)')
      checkBookingPage.assertDate('1 January 2050')
      checkBookingPage.assertPreHearingTime('14:45 to 15:00')
      checkBookingPage.assertHearingTime('15:00 to 16:00')
      checkBookingPage.assertPostHearingTime('16:00 to 16:15')
      checkBookingPage.assertHearingRoom('Closed Visits Cubicle 6 - Crown Ct')
      checkBookingPage.bookVideoLink().click()

      // Confirmation of booking page
      Page.verifyOnPage(ConfirmationPage)
    })

    it('Can handle no rooms available for a court booking', () => {
      // Stub for no rooms available
      cy.task('stubPostRoomsByDateAndTime', nottinghamSelectRoomsByDateTimeEmpty as unknown as JSON)

      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      // Prisoner search page
      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      // Prisoner search results page
      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

      // Enter booking details (court) page
      const newBookingPage = Page.verifyOnPage(NewBookingPage)
      newBookingPage.selectCourt('Aberystwyth Family')
      newBookingPage.selectHearingType('Civil')
      newBookingPage.selectCvpKnown('No')
      newBookingPage.selectDate(new Date(2050, 0, 1))
      newBookingPage.selectStartTime(15, 0)
      newBookingPage.selectEndTime(16, 0)
      newBookingPage.selectPreHearingRequired('Yes')
      newBookingPage.selectPostHearingRequired('Yes')
      newBookingPage.continue().click()

      // No rooms available page
      const noRoomsAvailablePage = Page.verifyOnPage(NoRoomsAvailablePage)
      noRoomsAvailablePage.assertCourt('Aberystwyth Family')
      noRoomsAvailablePage.assertPrison('Nottingham (HMP)')
      noRoomsAvailablePage.assertDate('01/01/2050')
      noRoomsAvailablePage.assertPreHearingTime('14:45 to 15:00')
      noRoomsAvailablePage.assertHearingTime('15:00 to 16:00')
      noRoomsAvailablePage.assertPostHearingTime('16:00 to 16:15')

      noRoomsAvailablePage.changeTimesButton().click()

      // Check navigation back to the booking page to re-enter times
      Page.verifyOnPage(NewBookingPage)
    })
  })

  describe('Probation', () => {
    beforeEach(() => {
      cy.task('stubProbationUser')
      cy.task('stubGetUserProbationTeamPreferences')
      cy.task('stubProbationMeetingTypes')
      cy.task('stubAvailableLocations', nottinghamLocationAvailability)
      cy.task('stubGetBooking', bobSmithProbationBooking)
      cy.signIn()
    })

    it('Can create a video link booking for a probation team', () => {
      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      // Prisoner search page
      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      // Prisoner search results page
      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

      // Probation booking details entry page
      const bookingDetailsPage = Page.verifyOnPage(BookingDetailsPage)
      bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      bookingDetailsPage.enterProbationOfficerName('Alan Key')
      bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      bookingDetailsPage.selectMeetingType('Recall report')
      bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      bookingDetailsPage.selectDuration('1 hour')
      bookingDetailsPage.selectTimePeriods(['Morning', 'Afternoon'])
      bookingDetailsPage.continue().click()

      // Location choices page
      const locationAvailabilityPage = Page.verifyOnPage(LocationAvailabilityPage)
      locationAvailabilityPage.selectSlot('08:00 to 09:00')
      locationAvailabilityPage.continue().click()

      // Check booking details page
      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.bookVideoLink().click()

      // Confirmation of booking page
      Page.verifyOnPage(ConfirmationPage)
    })
  })
})
