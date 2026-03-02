import { expect, test } from '@playwright/test'

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
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import smithSearch from '../mockApis/fixtures/prisonerSearchApi/SMITH-paged.json'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
import SelectRoomsPage from '../pages/bookAVideoLink/selectRoomsPage'
import nottinghamSelectRoomsByDateTime from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTime.json'
import CheckBookingPage from '../pages/bookAVideoLink/checkBooking'
import ConfirmationPage from '../pages/bookAVideoLink/confirmation'
import nottinghamSelectRoomsByDateTimeEmpty from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTimeEmpty.json'
import nottinghamLocationAvailability from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocationAvailability.json'
import BookingDetailsPage from '../pages/bookAVideoLink/bookingDetails'
import LocationAvailabilityPage from '../pages/bookAVideoLink/locationAvailability'
import AlternativeRoomsPage from '../pages/bookAVideoLink/alternativeRoomsPage'
import SelectAlternativeRoomsPage from '../pages/bookAVideoLink/selectAlternativeRoomsPage'

test.describe('Create a booking', () => {
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
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubGetUserCourtPreferences(),
        bookAVideoLinkApi.stubAvailableLocations(nottinghamLocationAvailability),
        bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTime),
        manageUsersApi.stubCourtUser('john smith'),
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Create a court booking', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.selectPrisoner('A0171DZ')

      const newBookingPage = await NewBookingPage.verifyOnPage(page)
      await newBookingPage.selectCourt('Aberystwyth Family')
      await newBookingPage.selectCourtHearingType('Civil')
      await newBookingPage.selectCvpKnown('No')
      await newBookingPage.selectGuestPinKnown('No')
      await newBookingPage.selectDate(new Date(2050, 0, 1))
      await newBookingPage.selectStartTime(15, 0)
      await newBookingPage.selectEndTime(16, 0)
      await newBookingPage.selectPreHearingRequired('Yes')
      await newBookingPage.selectPostHearingRequired('Yes')
      await newBookingPage.enterNotesForStaff('staff notes')
      await newBookingPage.continueButton.click()

      // Select from available rooms page - the times will all reflect the main hearing time
      // (because wiremock cannot return different, multiple responses to the same POST endpoint, one per hearing)
      const selectRoomsPage = await SelectRoomsPage.verifyOnPage(page)
      await selectRoomsPage.selectRoomForMainHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.selectRoomForPreHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.selectRoomForPostHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.continueButton.click()

      const checkBookingPage = await CheckBookingPage.verifyOnPage(page)
      await checkBookingPage.assertCourt('Aberystwyth Family')
      await checkBookingPage.assertPrison('Nottingham (HMP)')
      await checkBookingPage.assertDate('1 January 2050')
      await checkBookingPage.assertPreHearingTime('14:45 to 15:00')
      await checkBookingPage.assertHearingTime('15:00 to 16:00')
      await checkBookingPage.assertPostHearingTime('16:00 to 16:15')
      await checkBookingPage.assertHearingRoom('Closed Visits Cubicle 6 - Crown Ct')
      await checkBookingPage.assertNotesForStaff('staff notes')
      await checkBookingPage.bookVideoLinkButton.click()

      await ConfirmationPage.verifyOnPage(page)
    })

    test('Can handle alternative rooms for a court booking', async ({ page }) => {
      await bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTimeEmpty)

      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.selectPrisoner('A0171DZ')

      const newBookingPage = await NewBookingPage.verifyOnPage(page)
      await newBookingPage.selectCourt('Aberystwyth Family')
      await newBookingPage.selectCourtHearingType('Civil')
      await newBookingPage.selectCvpKnown('No')
      await newBookingPage.selectGuestPinKnown('No')
      await newBookingPage.selectDate(new Date(2050, 0, 1))
      await newBookingPage.selectStartTime(15, 15)
      await newBookingPage.selectEndTime(15, 45)
      await newBookingPage.selectPreHearingRequired('Yes')
      await newBookingPage.selectPostHearingRequired('Yes')
      await newBookingPage.enterNotesForStaff('staff notes')
      await newBookingPage.continueButton.click()

      const noSlotsAvailablePage = await AlternativeRoomsPage.verifyOnPage(page)
      await noSlotsAvailablePage.assertDate('01 January 2050')
      await noSlotsAvailablePage.assertPreHearingTime('15:00 to 15:15')
      await noSlotsAvailablePage.assertHearingTime('15:15 to 15:45')
      await noSlotsAvailablePage.assertPostHearingTime('15:45 to 16:00')
      await noSlotsAvailablePage.checkForOtherAvailabilityButton.click()

      const selectAlternativeRoomsPage = await SelectAlternativeRoomsPage.verifyOnPage(page)
      await expect(selectAlternativeRoomsPage.page.getByText('Available morning time slots')).toBeVisible()
      await expect(selectAlternativeRoomsPage.page.getByText('Available afternoon time slots')).toBeVisible()
      await expect(selectAlternativeRoomsPage.page.getByText('Available evening time slots')).not.toBeVisible()
      await expect(selectAlternativeRoomsPage.selectASuitableSlotLink.first()).not.toBeVisible()
      await selectAlternativeRoomsPage.continueButton.first().click()
      await expect(selectAlternativeRoomsPage.selectASuitableSlotLink.first()).toBeVisible()
      await selectAlternativeRoomsPage.selectSlot('08:00 to 09:00')
      await selectAlternativeRoomsPage.continueButton.first().click()
      const checkBookingPage = await CheckBookingPage.verifyOnPage(page)
      await checkBookingPage.bookVideoLinkButton.click()
      await ConfirmationPage.verifyOnPage(page)
    })

    test('Responds to change links and navigates to appropriate pages', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.selectPrisoner('A0171DZ')

      const newBookingPage = await NewBookingPage.verifyOnPage(page)
      await newBookingPage.selectCourt('Aberystwyth Family')
      await newBookingPage.selectCourtHearingType('Civil')
      await newBookingPage.selectCvpKnown('No')
      await newBookingPage.selectGuestPinKnown('No')
      await newBookingPage.selectDate(new Date(2050, 0, 1))
      await newBookingPage.selectStartTime(15, 0)
      await newBookingPage.selectEndTime(16, 0)
      await newBookingPage.selectPreHearingRequired('Yes')
      await newBookingPage.selectPostHearingRequired('Yes')
      await newBookingPage.enterNotesForStaff('staff notes')
      await newBookingPage.continueButton.click()

      // Select from available rooms page - the times will all reflect the main hearing time
      // (because wiremock cannot return different, multiple responses to the same POST endpoint, one per hearing)
      const selectRoomsPage = await SelectRoomsPage.verifyOnPage(page)
      await selectRoomsPage.selectRoomForMainHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.selectRoomForPreHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.selectRoomForPostHearing('Closed Visits Cubicle 6 - Crown Ct')
      await selectRoomsPage.continueButton.click()

      const checkBookingPage = await CheckBookingPage.verifyOnPage(page)
      await checkBookingPage.courtHearingTypeChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingDateChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingPreHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingTimeChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingCvpChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingGuestPinChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingPostHearingRoomChangeLink.click()
      await SelectRoomsPage.verifyOnPage(page)
      await page.goBack()

      await checkBookingPage.courtHearingStaffNotesChangeLink.click()
      await NewBookingPage.verifyOnPage(page)
      await page.goBack()
    })
  })

  test.describe('Probation', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubAvailabilityCheck(),
        bookAVideoLinkApi.stubAvailableLocations(nottinghamLocationAvailability),
        bookAVideoLinkApi.stubGetBooking(bobSmithProbationBooking),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        bookAVideoLinkApi.stubProbationMeetingTypes(),
        manageUsersApi.stubProbationUser('john smith'),
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Can create a video link booking for a probation team', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.selectPrisoner('A0171DZ')

      const bookingDetailsPage = await BookingDetailsPage.verifyOnPage(page)
      await bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await bookingDetailsPage.enterProbationOfficerName('Alan Key')
      await bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      await bookingDetailsPage.selectProbationMeetingType('Recall report (PRARR - parts B or C)')
      await bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      await bookingDetailsPage.selectDuration('1 hour')
      await bookingDetailsPage.selectTimePeriods(['Morning', 'Afternoon'])
      await bookingDetailsPage.enterNotesForStaff('staff notes')
      await bookingDetailsPage.continueButton.click()

      const locationAvailabilityPage = await LocationAvailabilityPage.verifyOnPage(page)
      await locationAvailabilityPage.selectSlot('08:00 to 09:00')
      await locationAvailabilityPage.continueButton.click()

      const checkBookingPage = await CheckBookingPage.verifyOnPage(page)
      await checkBookingPage.bookVideoLinkButton.click()

      await ConfirmationPage.verifyOnPage(page)
    })
  })
})
