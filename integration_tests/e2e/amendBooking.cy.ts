import Page from '../pages/page'
import HomePage from '../pages/home'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import ViewBookingPage from '../pages/bookAVideoLink/viewBooking'
import UpdateConfirmationPage from '../pages/bookAVideoLink/updateConfirmation'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import ChangeVideoLinkBookingPage from '../pages/bookAVideoLink/changeVideoLinkBooking'
import nottinghamSelectRoomsByDateTime from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTime.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import ChangeProbationBookingPage from '../pages/bookAVideoLink/changeProbationBooking'
import LocationAvailabilityPage from '../pages/bookAVideoLink/locationAvailability'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'
import SelectRoomsPage from '../pages/bookAVideoLink/selectRoomsPage'
import NoRoomsAvailablePage from '../pages/bookAVideoLink/noRoomsAvailablePage'
import nottinghamSelectRoomsByDateTimeEmpty from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTimeEmpty.json'
import NotesForStaffPage from '../pages/bookAVideoLink/notesForStaff'

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
      cy.task('stubPostRoomsByDateAndTime', nottinghamSelectRoomsByDateTime as unknown as JSON)
      cy.signIn()
    })

    it('Can add notes for staff to a video link booking for a court', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.changeNotes().click()

      const notesForStaffPage = Page.verifyOnPage(NotesForStaffPage)
      notesForStaffPage.enterNotesForStaff('Test notes')
      notesForStaffPage.continue().click()

      Page.verifyOnPage(UpdateConfirmationPage)
    })

    it('Can change the hearing link for a court video link booking', () => {
      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })

      // Search for existing video link bookings
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      // View the video link booking page
      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.changeBookingDetails().click()

      // Display and change the hearing link on booking details page
      const changeVideoLinkBookingPage = Page.verifyOnPage(ChangeVideoLinkBookingPage)
      changeVideoLinkBookingPage.selectCvpKnown('Yes')
      changeVideoLinkBookingPage.enterHearingLink('1234')
      changeVideoLinkBookingPage.enterFullWebAddress('https://hmcts1234.meet.video.justice.gov.uk')
      changeVideoLinkBookingPage.continue().click()

      // Error - entered both link types - so correct it
      const changeVideoLinkBookingPage2 = Page.verifyOnPage(ChangeVideoLinkBookingPage)
      changeVideoLinkBookingPage2.selectCvpKnown('Yes')
      changeVideoLinkBookingPage2.enterHearingLink('1234')
      changeVideoLinkBookingPage.clearFullWebAddress()
      changeVideoLinkBookingPage2.continue().click()

      // Confirm the same rooms
      const selectRoomsPage = Page.verifyOnPage(SelectRoomsPage)
      selectRoomsPage.continue().click()

      // Check the details of the booking page
      const checkBookingPage = Page.verifyOnPage(CheckBookingPage)
      checkBookingPage.assertCourt('Aberystwyth Family')
      checkBookingPage.assertHearingTime('15:00 to 16:00')
      checkBookingPage.assertPrison('Nottingham (HMP)')
      checkBookingPage.assertHearingType('Civil')
      checkBookingPage.assertHearingLink('HMCTS1234@meet.video.justice.gov.uk')
      checkBookingPage.updateBooking().click()

      // Confirmation page
      Page.verifyOnPage(UpdateConfirmationPage)
    })

    it('Can change rooms for a court video link booking - no rooms available', () => {
      // Stub for no rooms available
      cy.task('stubPostRoomsByDateAndTime', nottinghamSelectRoomsByDateTimeEmpty as unknown as JSON)

      // Home page
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })

      // Search for existing bookings on a date
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      // View a booking
      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)
      viewBookingPage.changeBookingDetails().click()

      // Change the booking details page
      const changeVideoLinkBookingPage = Page.verifyOnPage(ChangeVideoLinkBookingPage)
      changeVideoLinkBookingPage.continue().click()

      // No rooms available
      const noRoomsAvailablePage = Page.verifyOnPage(NoRoomsAvailablePage)
      noRoomsAvailablePage.assertCourt('Aberystwyth Family')
      noRoomsAvailablePage.assertPrison('Nottingham (HMP)')
      noRoomsAvailablePage.assertDate('01/01/2050')
      noRoomsAvailablePage.assertPreHearingTime('14:45 to 15:00')
      noRoomsAvailablePage.assertHearingTime('15:00 to 16:00')
      noRoomsAvailablePage.assertPostHearingTime('16:00 to 16:15')
    })

    it('Responds to change links and navigates to appropriate pages', () => {
      const home = Page.verifyOnPage(HomePage)
      home.viewAndChangeVideoLinks().click()

      cy.task('stubGetCourtSchedule', { courtCode: 'ABERFC', date: '2050-01-01', response: courtBookingsForDay })
      const searchBookingsPage = Page.verifyOnPage(SearchBookingsPage)
      searchBookingsPage.selectDate(new Date(2050, 0, 1))
      searchBookingsPage.selectCourt('Aberystwyth Family')
      searchBookingsPage.updateResults().click()
      searchBookingsPage.viewOrEdit().click()

      const viewBookingPage = Page.verifyOnPage(ViewBookingPage)

      const pageMappings: CourtNavigationTest[] = [
        { summaryListKey: 'Hearing type', expectedPage: ChangeVideoLinkBookingPage },
        { summaryListKey: 'Date', expectedPage: ChangeVideoLinkBookingPage },
        { summaryListKey: 'Pre-court hearing room', expectedPage: SelectRoomsPage },
        { summaryListKey: 'Court hearing time', expectedPage: ChangeVideoLinkBookingPage },
        { summaryListKey: 'Court hearing room', expectedPage: SelectRoomsPage },
        { summaryListKey: 'Court hearing link (CVP)', expectedPage: ChangeVideoLinkBookingPage },
        { summaryListKey: 'Post-court hearing room', expectedPage: SelectRoomsPage },
      ]

      pageMappings.forEach(({ summaryListKey, expectedPage }) => {
        viewBookingPage.changeLinkFor(summaryListKey).click()
        Page.verifyOnPage(expectedPage)
        cy.go('back')
      })
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

    it('Can add notes to a video link booking for a probation team', () => {
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
      viewBookingPage.changeNotes().click()

      const notesForStaffPage = Page.verifyOnPage(NotesForStaffPage)
      notesForStaffPage.enterNotesForStaff('Test notes')
      notesForStaffPage.continue().click()

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

type PageConstructor = new () => Page

interface CourtNavigationTest {
  summaryListKey: string
  expectedPage: PageConstructor
}
