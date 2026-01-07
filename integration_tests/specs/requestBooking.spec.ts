import { test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import bookAVideoLinkApi from '../mockApis/bookAVideoLinkApi'
import SearchPrisonerPage from '../pages/bookAVideoLink/searchPrisoner'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import emptySearch from '../mockApis/fixtures/prisonerSearchApi/empty-paged.json'
import SearchPrisonerResultsPage from '../pages/bookAVideoLink/searchPrisonerResults'
import PrisonerNotListedPage from '../pages/bookAVideoLink/prisonerNotListed'
import PrisonerDetailsPage from '../pages/bookAVideoLink/prisonerDetails'
import NewBookingPage from '../pages/bookAVideoLink/newBooking'
import CheckRequestPage from '../pages/bookAVideoLink/checkRequest'
import BookingRequestedPage from '../pages/bookAVideoLink/bookingRequested'
import BookingDetailsPage from '../pages/bookAVideoLink/bookingDetails'

test.describe('Request a booking', () => {
  test.beforeEach(async () => {
    await Promise.all([
      bookAVideoLinkApi.stubAllPrisons(),
      bookAVideoLinkApi.stubEnabledPrisons(),
      bookAVideoLinkApi.stubPrisonLocations(nottinghamLocations),
      bookAVideoLinkApi.stubRequestBooking(),
      hmppsAuth.stubSignInPage(),
      prisonerSearchApi.stubAttributeSearch(emptySearch),
    ])
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('Court', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubGetUserCourtPreferences(),
        bookAVideoLinkApi.stubCourtHearingTypes(),
        manageUsersApi.stubCourtUser(),
      ])
    })

    test('Can request a video link booking for a court', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.prisonerNotListedLink.click()

      const prisonerNotListedPage = await PrisonerNotListedPage.verifyOnPage(page)
      await prisonerNotListedPage.continueButton.click()

      const prisonerDetailsPage = await PrisonerDetailsPage.verifyOnPage(page)
      await prisonerDetailsPage.enterFirstName('John')
      await prisonerDetailsPage.enterLastName('Smith')
      await prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      await prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      await prisonerDetailsPage.continueButton.click()

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
      await newBookingPage.continueButton.click()

      const checkRequestPage = await CheckRequestPage.verifyOnPage(page)
      await checkRequestPage.requestVideoLinkButton.click()
      await BookingRequestedPage.verifyOnPage(page)
    })
  })

  test.describe('Probation', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        bookAVideoLinkApi.stubProbationMeetingTypes(),
        manageUsersApi.stubProbationUser(),
      ])
    })

    test('Can request a video link booking for a probation team', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.bookNewVideoBookingLink.click()

      const searchPrisonerPage = await SearchPrisonerPage.verifyOnPage(page)
      await searchPrisonerPage.enterLastName('Smith')
      await searchPrisonerPage.searchButton.click()

      const searchPrisonerResultsPage = await SearchPrisonerResultsPage.verifyOnPage(page)
      await searchPrisonerResultsPage.prisonerNotListedLink.click()

      const prisonerNotListedPage = await PrisonerNotListedPage.verifyOnPage(page)
      await prisonerNotListedPage.continueButton.click()

      const prisonerDetailsPage = await PrisonerDetailsPage.verifyOnPage(page)
      await prisonerDetailsPage.enterFirstName('John')
      await prisonerDetailsPage.enterLastName('Smith')
      await prisonerDetailsPage.enterDateOfBirth('16', '02', '1969')
      await prisonerDetailsPage.selectPrison('Nottingham (HMP & YOI)')
      await prisonerDetailsPage.continueButton.click()

      const bookingDetailsPage = await BookingDetailsPage.verifyOnPage(page)

      await bookingDetailsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await bookingDetailsPage.enterProbationOfficerName('Alan Key')
      await bookingDetailsPage.enterProbationOfficerEmail('akey@justice.gov.uk')
      await bookingDetailsPage.selectProbationMeetingType('Recall report (PRARR - parts B or C)')
      await bookingDetailsPage.selectDate(new Date(2050, 0, 1))
      await bookingDetailsPage.selectStartTime(15, 0)
      await bookingDetailsPage.selectEndTime(16, 0)
      await bookingDetailsPage.continueButton.click()

      const checkRequestPage = await CheckRequestPage.verifyOnPage(page)
      await checkRequestPage.requestVideoLinkButton.click()
      await BookingRequestedPage.verifyOnPage(page)
    })
  })
})
