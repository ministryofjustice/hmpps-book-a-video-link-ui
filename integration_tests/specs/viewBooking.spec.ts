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
import bobSmithCourtBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithCourtBooking.json'
import nottinghamLocations from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamLocations.json'
import smithSearch from '../mockApis/fixtures/prisonerSearchApi/SMITH-paged.json'
import nottinghamSelectRoomsByDateTime from '../mockApis/fixtures/bookAVideoLinkApi/nottinghamSelectRoomsByDateTime.json'
import courtBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/courtBookingsForDay.json'
import SearchBookingsPage from '../pages/bookAVideoLink/searchBookings'
import ViewBookingPage from '../pages/viewBooking/viewBooking'
import probationBookingsForDay from '../mockApis/fixtures/bookAVideoLinkApi/probationBookingsForDay.json'
import bobSmithProbationBooking from '../mockApis/fixtures/bookAVideoLinkApi/bobSmithProbationBooking.json'
import { ScheduleItem } from '../../server/@types/bookAVideoLinkApi/types'
import { toViewBookingsSearchParams } from '../../server/utils/utils'

const today = format(new Date(), 'yyyy-MM-dd')

test.describe('View booking', () => {
  test.beforeEach(async () => {
    await Promise.all([
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
        bookAVideoLinkApi.stubCourtHearingTypes(),
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
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Can return to the view all bookings page to previously selected bookings from view booking page', async ({
      page,
    }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      await homePage.verifyPageHasText('There are no video link bookings for this date')
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
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.verifySelectedAgencyCode('ALL')
      await searchBookingsPage.selectFromAndToDate(new Date(2050, 0, 1), new Date(2050, 0, 1))
      await searchBookingsPage.selectCourt('Aberystwyth Family')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.returnToViewBookingsLink.click()

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
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubProbationMeetingTypes(),
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
        bookAVideoLinkApi.stubGetUserProbationTeamPreferences(),
        bookAVideoLinkApi.stubPostRoomsByDateAndTime(nottinghamSelectRoomsByDateTime),
        bookAVideoLinkApi.stubUpdateBooking(),
        manageUsersApi.stubProbationUser('john smith'),
        prisonerSearchApi.stubAttributeSearch(smithSearch),
      ])
    })

    test('Can return to the view all bookings page to previously selected bookings from view booking page', async ({
      page,
    }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.viewAndChangeVideoLinks.click()
      await homePage.verifyPageHasText('There are no video link bookings for this date')
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
      const searchBookingsPage = await SearchBookingsPage.verifyOnPage(page)
      await searchBookingsPage.verifySelectedAgencyCode('ALL')
      await searchBookingsPage.selectFromAndToDate(new Date(2050, 0, 1), new Date(2050, 0, 1))
      await searchBookingsPage.selectProbationTeam('Blackpool MC (PPOC)')
      await searchBookingsPage.updateResultsButton.click()
      await searchBookingsPage.viewOrEditLink.click()

      const viewBookingPage = await ViewBookingPage.verifyOnPage(page)
      await viewBookingPage.returnToViewBookingsLink.click()

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
