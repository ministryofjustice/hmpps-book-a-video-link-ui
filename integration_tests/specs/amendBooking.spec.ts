import { test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import HomePage from '../pages/homePage'
import hmppsAuth from '../mockApis/hmppsAuth'
import bookAVideoLinkApi from '../mockApis/bookAVideoLinkApi'
import manageUsersApi from '../mockApis/manageUsersApi'
import userPreferencesApi from '../mockApis/userPreferencesApi'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import smithSearch from '../mockApis/fixtures/prisonerSearchApi/SMITH-paged.json'
import SelectRoomsPage from '../pages/bookAVideoLink/selectRoomsPage'
import nottinghamSelectRoomsByDateTime from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTime.json'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import ViewBookingPage from '../pages/bookAVideoLink/viewBooking'
import NotesForStaffPage from '../pages/bookAVideoLink/notesForStaff'
import UpdateConfirmationPage from '../pages/bookAVideoLink/updateConfirmation'
import ChangeVideoLinkBookingPage from '../pages/bookAVideoLink/changeVideoLinkBooking'
import nottinghamSelectRoomsByDateTimeEmpty from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTimeEmpty.json'
import NoRoomsAvailablePage from '../pages/bookAVideoLink/noRoomsAvailablePage'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'

test.describe('Amend a booking', () => {
  test.beforeEach(async () => {
    await Promise.all([
      bookAVideoLinkApi.stubAllPrisons(),
      bookAVideoLinkApi.stubCreateBooking(),
      bookAVideoLinkApi.stubEnabledPrisons(),
      bookAVideoLinkApi.stubPrisonLocations(nottinghamLocations),
      bookAVideoLinkApi.stubGetPrison('NMI', {
        prisonId: 106,
        code: 'NMI',
        name: 'Nottingham (HMP & YOI)',
        enabled: true,
        notes: null,
        pickUpTime: null,
      }),
      hmppsAuth.stubSignInPage(),
      prisonerSearchApi.stubPrisoner(A0171DZ),
      prisonerSearchApi.stubPrisonerList([A0171DZ]),
      userPreferencesApi.stubGetUserPreferences(),
    ])
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('Court', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubAvailabilityCheck(),
        bookAVideoLinkApi.stubGetBooking(bobSmithCourtBooking),
        bookAVideoLinkApi.stubCourtHearingTypes(),
        bookAVideoLinkApi.stubGetCourtSchedule(),
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubGetUserCourtPreferences(),
        bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTime),
        bookAVideoLinkApi.stubUpdateBooking(),
        manageUsersApi.stubCourtUser('john smith'),
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Can add notes for staff to a video link booking for a court', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()

      await bookAVideoLinkApi.stubGetCourtSchedule({
        courtCode: 'ABERFC',
        date: '2050-01-01',
        response: courtBookingsForDay,
      })
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.staffNotesChangeLink.click()

      const notesForStaffPage = await NotesForStaffPage.verifyOnPage(page)
      await notesForStaffPage.enterNotesForStaff('Test notes')
      await notesForStaffPage.continueButton.click()

      await UpdateConfirmationPage.verifyOnPage(page)
    })

    test('Can change the hearing link for a court video link booking', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()

      await bookAVideoLinkApi.stubGetCourtSchedule({
        courtCode: 'ABERFC',
        date: '2050-01-01',
        response: courtBookingsForDay,
      })
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.changeBookingDetailsButton.click()

      const changeVideoLinkBookingPage = await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await changeVideoLinkBookingPage.selectCvpKnown('Yes')
      await changeVideoLinkBookingPage.enterHearingLink('1234')
      await changeVideoLinkBookingPage.enterFullWebAddress('https://hmcts1234.meet.video.justice.gov.uk')
      await changeVideoLinkBookingPage.continueButton.click()

      // Error - entered both link types - so correct it
      const changeVideoLinkBookingPage2 = await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await changeVideoLinkBookingPage.selectCvpKnown('Yes')
      await changeVideoLinkBookingPage.enterHearingLink('1234')
      await changeVideoLinkBookingPage.clearFullWebAddress()
      await changeVideoLinkBookingPage2.continueButton.click()

      // Confirm the same rooms
      const selectRoomsPage = await SelectRoomsPage.verifyOnPage(page)
      await selectRoomsPage.continueButton.click()

      // Check the details of the booking page
      const checkBookingPage = await CheckBookingPage.verifyOnPage(page)
      await checkBookingPage.assertCourt('Aberystwyth Family')
      await checkBookingPage.assertHearingTime('15:00 to 16:00')
      await checkBookingPage.assertPrison('Nottingham (HMP)')
      await checkBookingPage.assertHearingType('Civil')
      await checkBookingPage.assertHearingLink('HMCTS1234@meet.video.justice.gov.uk')
      await checkBookingPage.updateBookingButton.click()

      await UpdateConfirmationPage.verifyOnPage(page)
    })

    test('Can change rooms for a court video link booking - no rooms available', async ({ page }) => {
      await bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTimeEmpty)

      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()

      await bookAVideoLinkApi.stubGetCourtSchedule({
        courtCode: 'ABERFC',
        date: '2050-01-01',
        response: courtBookingsForDay,
      })
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.changeBookingDetailsButton.click()

      const changeVideoLinkBookingPage = await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await changeVideoLinkBookingPage.continueButton.click()

      // No rooms available
      const noRoomsAvailablePage = await NoRoomsAvailablePage.verifyOnPage(page)
      await noRoomsAvailablePage.assertCourt('Aberystwyth Family')
      await noRoomsAvailablePage.assertPrison('Nottingham (HMP)')
      await noRoomsAvailablePage.assertDate('01/01/2050')
      await noRoomsAvailablePage.assertPreHearingTime('14:45 to 15:00')
      await noRoomsAvailablePage.assertHearingTime('15:00 to 16:00')
      await noRoomsAvailablePage.assertPostHearingTime('16:00 to 16:15')
    })

    test('Responds to change links and navigates to appropriate pages', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()

      await bookAVideoLinkApi.stubGetCourtSchedule({
        courtCode: 'ABERFC',
        date: '2050-01-01',
        response: courtBookingsForDay,
      })

      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)

      await viewBookingPage.courtHearingDateChangeLink.click()
      await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingPreHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingTimeChangeLink.click()
      await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingCvpChangeLink.click()
      await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingGuestPinChangeLink.click()
      await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.courtHearingPostHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await viewBookingPage.staffNotesChangeLink.click()
      await ChangeVideoLinkBookingPage.verifyOnPage(page)
      await page.goBack()
    })
  })

  test.describe('Probation', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubAvailabilityCheck(),
        bookAVideoLinkApi.stubEnabledPrisons(),
        bookAVideoLinkApi.stubGetBooking(bobSmithProbationBooking),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubProbationMeetingTypes(),
        bookAVideoLinkApi.stubGetProbationTeamSchedule(),
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTime),
        bookAVideoLinkApi.stubUpdateBooking(),
        manageUsersApi.stubProbationUser('john smith'),
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Can add notes to a video link booking for a probation team', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()

      await bookAVideoLinkApi.stubGetProbationTeamSchedule({
        probationTeamCode: 'BLKPPP',
        date: '2050-01-01',
        response: probationBookingsForDay,
      })
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.staffNotesChangeLink.click()

      const notesForStaffPage = await NotesForStaffPage.verifyOnPage(page)
      await notesForStaffPage.enterNotesForStaff('Test notes')
      await notesForStaffPage.continueButton.click()

      await UpdateConfirmationPage.verifyOnPage(page)
    })
  })
})
