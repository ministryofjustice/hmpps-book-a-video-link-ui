import { test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'
import A0171DZ from '../mockApis/fixtures/prisonerSearchApi/A0171DZ.json'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import HomePage from '../pages/homePage'
import hmppsAuth from '../mockApis/hmppsAuth'
import bookAVideoLinkApi from '../mockApis/bookAVideoLinkApi'
import manageUsersApi from '../mockApis/manageUsersApi'
import userPreferencesApi from '../mockApis/userPreferencesApi'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import ViewBookingPage from '../pages/bookAVideoLink/viewBooking'
import ConfirmCancelPage from '../pages/bookAVideoLink/confirmCancel'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import ConfirmedCancelPage from '../pages/bookAVideoLink/confirmedCancel'

test.describe('Cancel a booking', () => {
  test.beforeEach(async () => {
    await Promise.all([
      bookAVideoLinkApi.stubAllPrisons(),
      bookAVideoLinkApi.stubCancelBooking(),
      bookAVideoLinkApi.stubEnabledPrisons(),
      bookAVideoLinkApi.stubPrisonLocations(nottinghamLocations),
      bookAVideoLinkApi.stubGetPrison({
        prisonCode: 'NMI',
        response: {
          prisonId: 106,
          code: 'NMI',
          name: 'Nottingham (HMP & YOI)',
          enabled: true,
          notes: null,
          pickUpTime: null,
        },
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
        bookAVideoLinkApi.stubGetBooking(bobSmithCourtBooking),
        bookAVideoLinkApi.stubGetCourtSchedule(),
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubGetUserCourtPreferences(),
        manageUsersApi.stubCourtUser('john smith'),
      ])
    })

    test('Can cancel a court video link booking', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await bookAVideoLinkApi.stubGetCourtSchedule({
        courtCode: 'ABERFC',
        date: '2050-01-01',
        response: courtBookingsForDay,
      })
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()
      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.cancelVideoLinkButton.click()
      const confirmCancelPage = await ConfirmCancelPage.verifyOnPage(page)
      await confirmCancelPage.yesCancelTheBookingButton.click()
      await ConfirmedCancelPage.verifyOnPage(page)
    })
  })

  test.describe('Probation', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubGetBooking(bobSmithProbationBooking),
        bookAVideoLinkApi.stubGetProbationTeamSchedule(),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        manageUsersApi.stubProbationUser('john smith'),
      ])
    })

    test('Can cancel a probation team video link booking', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectDate(new Date(2050, 0, 1))
      await searchBookingsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await bookAVideoLinkApi.stubGetProbationTeamSchedule({
        probationTeamCode: 'BLKPPP',
        date: '2050-01-01',
        response: probationBookingsForDay,
      })
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()
      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.cancelVideoLinkButton.click()
      const confirmCancelPage = await ConfirmCancelPage.verifyOnPage(page)
      await confirmCancelPage.yesCancelTheBookingButton.click()
      await ConfirmedCancelPage.verifyOnPage(page)
    })
  })
})
