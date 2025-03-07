import Page from '../pages/page'
import HomePage from '../pages/home'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import smithSearch from '../mockApis/fixtures/prisonerSearchApi/SMITH-paged.json'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import courtBookingNotAvailable from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingNotAvailable.json'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import ConfirmationPage from '../pages/bookAVideoLink/confirmation'
import BookingNotAvailablePage from '../pages/bookAVideoLink/bookingNotAvailable'
import BookingDetailsPage from '../pages/bookAVideoLink/bookingDetails'
import LocationAvailabilityPage from '../pages/bookAVideoLink/locationAvailability'

context('Create a booking', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', ['VIDEO_LINK_COURT_USER'])
    cy.task('stubAllPrisons')
    cy.task('stubEnabledPrisons')
    cy.task('stubAttributeSearch', smithSearch)
    cy.task('stubPrisoner', A0171DZ)
    cy.task('stubPrisonLocations', nottinghamLocations)
    cy.task('stubAvailabilityCheck')
    cy.task('stubCreateBooking')
  })

  describe('Court', () => {
    beforeEach(() => {
      cy.task('stubCourtUser')
      cy.task('stubGetUserCourtPreferences')
      cy.task('stubCourtHearingTypes')
      cy.task('stubGetBooking', bobSmithCourtBooking)
      cy.signIn()
    })

    it('Can create a video link booking for a court', () => {
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

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

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.bookVideoLink().click()

      Page.verifyOnPage(ConfirmationPage)
    })

    it('Can create a video link booking for a court with an alternative time suggested', () => {
      cy.task('stubAvailabilityCheck', courtBookingNotAvailable)

      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

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

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.bookVideoLink().click()

      Page.verifyOnPage(ConfirmationPage)
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
      const home = Page.verifyOnPage(HomePage)
      home.bookVideoLink().click()

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
      searchPrisonerPage.enterLastName('Smith')
      searchPrisonerPage.search().click()

      const searchPrisonerResultsPage = Page.verifyOnPage(SearchPrisonerResultsPage)
      searchPrisonerResultsPage.bookVideoLinkForPrisoner('A0171DZ').click()

      const bookingDetailsPage = Page.verifyOnPage(BookingDetailsPage)
      bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      bookingDetailsPage.enterProbationOfficerName('Alan Key')
      bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      bookingDetailsPage.selectMeetingType('Recall report')
      bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      bookingDetailsPage.selectDuration('1 hour')
      bookingDetailsPage.selectTimePeriods(['Morning', 'Afternoon'])
      bookingDetailsPage.continue().click()

      const locationAvailabilityPage = Page.verifyOnPage(LocationAvailabilityPage)
      locationAvailabilityPage.selectSlot('08:00 to 09:00')
      locationAvailabilityPage.continue().click()

      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.bookVideoLink().click()

      Page.verifyOnPage(ConfirmationPage)
    })
  })
})
