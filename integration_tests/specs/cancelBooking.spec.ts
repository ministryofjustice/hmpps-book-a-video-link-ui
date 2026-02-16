import { expect, test } from '@playwright/test'

import { format } from 'date-fns'
import { login, makePageData, resetStubs } from '../testUtils'
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
import ViewBookingPage from '../pages/viewBooking/viewBooking'
import ConfirmCancelPage from '../pages/bookAVideoLink/confirmCancel'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import ConfirmedCancelPage from '../pages/bookAVideoLink/confirmedCancel'
import { ScheduleItem } from '../../server/@types/bookAVideoLinkApi/types'
import { toViewBookingsSearchParams } from '../../server/utils/utils'

const today = format(new Date(), 'yyyy-MM-dd')

test.describe('Cancel a booking', () => {
  test.beforeEach(async () => {
    await Promise.all([
      bookAVideoLinkApi.stubAllPrisons(),
      bookAVideoLinkApi.stubCancelBooking(),
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
        bookAVideoLinkApi.stubGetBooking(bobSmithCourtBooking),
        bookAVideoLinkApi.stubPostCourtSchedule({
          requestBody: {
            fromDate: today,
            toDate: today,
            courtCodes: ['ABERCV', 'ABERFC'],
          },
          response: {
            content: [],
            page: makePageData([]),
          },
        }),
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubGetUserCourtPreferences(),
        manageUsersApi.stubCourtUser('john smith'),
      ])
    })

    test('Can cancel a court video link booking and return to all bookings page', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectFromAndToDate(new Date(2050, 0, 1), new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await bookAVideoLinkApi.stubPostCourtSchedule({
        requestBody: {
          fromDate: '2050-01-01',
          toDate: '2050-01-01',
          courtCodes: ['ABERFC'],
        },
        response: {
          content: courtBookingsForDay as unknown as ScheduleItem[],
          page: makePageData(courtBookingsForDay),
        },
      })
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()
      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.cancelVideoLinkButton.click()
      const confirmCancelPage = await ConfirmCancelPage.verifyOnPage(page)
      await confirmCancelPage.yesCancelTheBookingButton.click()
      const confirmedCancelPage = await ConfirmedCancelPage.verifyOnPage(page)
      await confirmedCancelPage.returnToBookingsLink.click()
      const returnedToSearchBookingsPage = await SearchBookingsPage.verifyOnPage(page)

      const urlParams = toViewBookingsSearchParams({
        agencyCode: 'ABERFC',
        fromDate: '01/01/2050',
        toDate: '01/01/2050',
        page: 1,
        sort: 'AGENCY_DATE_TIME',
      })

      expect(returnedToSearchBookingsPage.page.url()).toContain(`/court/view-booking?${urlParams}`)
    })
  })

  test.describe('Probation', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubGetBooking(bobSmithProbationBooking),
        bookAVideoLinkApi.stubPostProbationTeamSchedule({
          requestBody: {
            fromDate: today,
            toDate: today,
            probationTeamCodes: ['BLKPPP', 'BURNPM'],
          },
          response: {
            content: [],
            page: makePageData([]),
          },
        }),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        manageUsersApi.stubProbationUser('john smith'),
      ])
    })

    test('Can cancel a probation team video link booking and return to all bookings page', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.selectFromAndToDate(new Date(2050, 0, 1), new Date(2050, 0, 1))
      await searchBookingsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await bookAVideoLinkApi.stubPostProbationTeamSchedule({
        requestBody: {
          fromDate: '2050-01-01',
          toDate: '2050-01-01',
          probationTeamCodes: ['BLKPPP'],
        },
        response: {
          content: probationBookingsForDay as unknown as ScheduleItem[],
          page: makePageData(probationBookingsForDay),
        },
      })
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()
      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.cancelVideoLinkButton.click()
      const confirmCancelPage = await ConfirmCancelPage.verifyOnPage(page)
      await confirmCancelPage.yesCancelTheBookingButton.click()
      const confirmedCancelPage = await ConfirmedCancelPage.verifyOnPage(page)
      await confirmedCancelPage.returnToBookingsLink.click()
      const returnedToSearchBookingsPage = await SearchBookingsPage.verifyOnPage(page)

      const urlParams = toViewBookingsSearchParams({
        agencyCode: 'BLKPPP',
        fromDate: '01/01/2050',
        toDate: '01/01/2050',
        page: 1,
        sort: 'AGENCY_DATE_TIME',
      })

      expect(returnedToSearchBookingsPage.page.url()).toContain(`/probation/view-booking?${urlParams}`)
    })
  })
})
