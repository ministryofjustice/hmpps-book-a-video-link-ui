import { expect, test } from '@playwright/test'
import { format, startOfToday } from 'date-fns'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import AdministrationPage from '../pages/administration/administration'
import ExtractDataByBookingDatePage from '../pages/administration/extractDataByBookingDate'
import manageUsersApi from '../mockApis/manageUsersApi'
import bookAVideoLinkApi from '../mockApis/bookAVideoLinkApi'
import ExtractDataByHearingDatePage from '../pages/administration/extractDataByHearingDate'
import berwynLocations from '../mockApis/fixtures/bookAVideoLinkApi/berwynLocations.json'
import ManagePrisonVideoRoomsPage from '../pages/administration/managePrisonVideoRooms'
import ViewRoomsPage from '../pages/administration/viewRooms'
import EditRoomPage from '../pages/administration/editRoom'
import ManagePrisonDetailsPage from '../pages/administration/managePrisonDetails'
import EditPrisonDetailsPage from '../pages/administration/editPrisonDetails'

test.describe('Administration', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('CSV download', () => {
    test.beforeEach(async () => {
      await Promise.all([hmppsAuth.stubSignInPage(), manageUsersApi.stubAdminUser()])
    })

    test('Admin user can download a CSV of court booking events by date of booking', async ({ page }) => {
      await bookAVideoLinkApi.stubCourtDataExtractByBookingDate()
      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.extractDataByBookingDateLink.click()
      const extractByBookingDatePage = await ExtractDataByBookingDatePage.verifyOnPage(page)
      await extractByBookingDatePage.selectCourt()
      await extractByBookingDatePage.selectDate(startOfToday())
      await extractByBookingDatePage.enterNumberOfDays(7)
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        extractByBookingDatePage.extractDataButton.click(),
      ])
      expect(download).toBeTruthy()
      expect(download.suggestedFilename()).toBe('courtDataExtractByBookingDate.csv')
    })

    test('Admin user can download a CSV of probation booking events by date of booking', async ({ page }) => {
      await bookAVideoLinkApi.stubProbationDataExtractByBookingDate()
      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.extractDataByBookingDateLink.click()
      const extractByBookingDatePage = await ExtractDataByBookingDatePage.verifyOnPage(page)
      await extractByBookingDatePage.selectProbation()
      await extractByBookingDatePage.selectDate(startOfToday())
      await extractByBookingDatePage.enterNumberOfDays(7)
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        extractByBookingDatePage.extractDataButton.click(),
      ])
      expect(download).toBeTruthy()
      expect(download.suggestedFilename()).toBe('probationDataExtractByBookingDate.csv')
    })

    test('Admin user can download a CSV of court booking events by date of hearing', async ({ page }) => {
      await bookAVideoLinkApi.stubCourtDataExtractByHearingDate()
      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.extractDataByHearingDateLink.click()
      const extractDataByHearingDatePage = await ExtractDataByHearingDatePage.verifyOnPage(page)
      await extractDataByHearingDatePage.selectCourt()
      await extractDataByHearingDatePage.selectDate(startOfToday())
      await extractDataByHearingDatePage.enterNumberOfDays(7)
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        extractDataByHearingDatePage.extractDataButton.click(),
      ])
      expect(download).toBeTruthy()
      expect(download.suggestedFilename()).toBe('courtDataExtractByHearingDate.csv')
    })

    test('Admin user can download a CSV of probation booking events by date of meeting', async ({ page }) => {
      await bookAVideoLinkApi.stubProbationDataExtractByMeetingDate()
      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.extractDataByHearingDateLink.click()
      const extractDataByHearingDatePage = await ExtractDataByHearingDatePage.verifyOnPage(page)
      await extractDataByHearingDatePage.selectProbation()
      await extractDataByHearingDatePage.selectDate(startOfToday())
      await extractDataByHearingDatePage.enterNumberOfDays(7)
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        extractDataByHearingDatePage.extractDataButton.click(),
      ])
      expect(download).toBeTruthy()
      expect(download.suggestedFilename()).toBe('probationDataExtractByMeetingDate.csv')
    })
  })

  test.describe('Room administration', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubSignInPage(),
        manageUsersApi.stubAdminUser(),
        bookAVideoLinkApi.stubAllPrisons(),
        bookAVideoLinkApi.stubEnabledPrisons(),
        bookAVideoLinkApi.stubPrisonLocations(berwynLocations),
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
      ])
    })

    test('Admin user can manage a room', async ({ page }) => {
      await Promise.all([
        bookAVideoLinkApi.stubGetRoomDetails({
          key: 'BWI-VIDEOLINK-VCC-01',
          prisonCode: 'BWI',
          description: 'Video Room 01',
          enabled: true,
          dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
          extraAttributes: {
            attributeId: 56,
            locationStatus: 'INACTIVE',
            locationUsage: 'COURT',
            allowedParties: ['ABERCV'],
            prisonVideoUrl: null,
            notes: null,
            schedule: [
              {
                scheduleId: 54,
                startDayOfWeek: 'MONDAY',
                endDayOfWeek: 'MONDAY',
                startTime: '08:00',
                endTime: '18:00',
                locationUsage: 'COURT',
                allowedParties: ['ABERCV'],
              },
            ],
          },
        }),
        bookAVideoLinkApi.stubGetPrison('BWI', {
          prisonId: 83,
          code: 'BWI',
          name: 'Berwyn (HMP & YOI)',
          enabled: true,
          notes: null,
        }),
      ])

      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.managePrisonVideoRoomsLink.click()
      const managePrisonRoomPage = await ManagePrisonVideoRoomsPage.verifyOnPage(page)
      await managePrisonRoomPage.manageRoomsLink.first().click()
      const viewRoomsPage = await ViewRoomsPage.verifyOnPage(page)
      await viewRoomsPage.viewOrEditLink('f1c78dca-733b-43cc-b03f-6c870941a2c7').click()
      const editRoomPage = await EditRoomPage.verifyOnPage(page)
      await editRoomPage.assertSelectedRoomStatus('inactive')
      await editRoomPage.assertRoomLink('')
      await editRoomPage.assertSelectedRoomPermission('court')
      await editRoomPage.selectRoomStatus('active')
      await editRoomPage.enterRoomLink('https://prison-room-link')
      await editRoomPage.enterComments('This is a comment')

      await bookAVideoLinkApi.stubUpdateRoomDetails()
      await bookAVideoLinkApi.stubGetRoomDetails({
        key: 'BWI-VIDEOLINK-VCC-01',
        prisonCode: 'BWI',
        description: 'Video Room 01',
        enabled: true,
        dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
        extraAttributes: {
          attributeId: 56,
          locationStatus: 'ACTIVE',
          locationUsage: 'COURT',
          allowedParties: ['ABERCV'],
          prisonVideoUrl: 'https://prison-room-link',
          notes: 'This is a comment',
          schedule: [
            {
              scheduleId: 54,
              startDayOfWeek: 'MONDAY',
              endDayOfWeek: 'MONDAY',
              startTime: '08:00',
              endTime: '18:00',
              locationUsage: 'COURT',
              allowedParties: ['ABERCV'],
            },
          ],
        },
      })

      await editRoomPage.saveButton.click()
      await editRoomPage.assertRoomChangesSaved()
      await editRoomPage.assertSelectedRoomStatus('active')
      await editRoomPage.assertRoomLink('https://prison-room-link')
      await editRoomPage.assertSelectedRoomPermission('court')
    })

    test('Admin user can make a room temporarily unavailable', async ({ page }) => {
      await Promise.all([
        bookAVideoLinkApi.stubGetRoomDetails({
          key: 'BWI-VIDEOLINK-VCC-01',
          prisonCode: 'BWI',
          description: 'Video Room 01',
          enabled: true,
          dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
          extraAttributes: null,
        }),
        bookAVideoLinkApi.stubGetPrison('BWI', {
          prisonId: 83,
          code: 'BWI',
          name: 'Berwyn (HMP & YOI)',
          enabled: true,
          notes: null,
        }),
      ])

      await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.administrationLink.click()
      const administrationPage = await AdministrationPage.verifyOnPage(page)
      await administrationPage.managePrisonVideoRoomsLink.click()
      const managePrisonRoomPage = await ManagePrisonVideoRoomsPage.verifyOnPage(page)
      await managePrisonRoomPage.manageRoomsLink.first().click()
      const viewRoomsPage = await ViewRoomsPage.verifyOnPage(page)
      await viewRoomsPage.viewOrEditLink('f1c78dca-733b-43cc-b03f-6c870941a2c7').click()
      const editRoomPage = await EditRoomPage.verifyOnPage(page)
      await editRoomPage.assertSelectedRoomStatus('active')
      await editRoomPage.selectRoomStatus('temporarily_blocked')
      await editRoomPage.selectBlockedFromDate(new Date())
      await editRoomPage.selectBlockedToDate(new Date())

      await bookAVideoLinkApi.stubUpdateRoomDetails()
      await bookAVideoLinkApi.stubGetRoomDetails({
        key: 'BWI-VIDEOLINK-VCC-01',
        prisonCode: 'BWI',
        description: 'Video Room 01',
        enabled: true,
        dpsLocationId: 'f1c78dca-733b-43cc-b03f-6c870941a2c7',
        extraAttributes: {
          attributeId: 56,
          locationStatus: 'TEMPORARILY_BLOCKED',
          blockedFrom: format(new Date(), 'yyyy-MM-dd'),
          blockedTo: format(new Date(), 'yyyy-MM-dd'),
          locationUsage: 'SHARED',
          allowedParties: [],
          prisonVideoUrl: null,
          notes: null,
          schedule: [],
        },
      })

      await editRoomPage.saveButton.click()
      await editRoomPage.assertRoomChangesSaved()
      await editRoomPage.assertSelectedRoomStatus('temporarily_blocked')
      await editRoomPage.assertSelectedRoomPermission('shared')
      await editRoomPage.assertBlockedFromDate(new Date())
      await editRoomPage.assertBlockedToDate(new Date())
    })
  })
})

test.describe('Prison details administration', () => {
  test.beforeEach(async () => {
    await Promise.all([
      hmppsAuth.stubSignInPage(),
      manageUsersApi.stubAdminUser(),
      bookAVideoLinkApi.stubAllPrisons(),
      bookAVideoLinkApi.stubGetPrison('AA1', {
        prisonId: 3,
        code: 'AA1',
        name: 'AA1 Prison for test',
        enabled: false,
        notes: null,
        pickUpTime: null,
      }),
      bookAVideoLinkApi.stubUpdatePrisonDetails({
        prisonCode: 'AA1',
        response: {
          prisonId: 3,
          code: 'AA1',
          name: 'AA1 Prison for test',
          enabled: false,
          notes: null,
          pickUpTime: '30',
        },
      }),
    ])
  })

  test('Admin user can manage prison details', async ({ page }) => {
    await login(page, { roles: ['ROLE_BVLS_ADMIN'] })
    const homePage = await HomePage.verifyOnPage(page)
    await homePage.administrationLink.click()
    const administrationPage = await AdministrationPage.verifyOnPage(page)
    await administrationPage.managePrisonDetailsLink.click()
    const managePrisonDetailsPage = await ManagePrisonDetailsPage.verifyOnPage(page)
    await managePrisonDetailsPage.managePrisonLink('AA1').click()
    const editPrisonDetailsPage = await EditPrisonDetailsPage.verifyOnPage(page)
    await editPrisonDetailsPage.selectPickUpTimeOn().click()
    await editPrisonDetailsPage.selectPickUpTime30().click()
    await editPrisonDetailsPage.saveButton.click()
    await editPrisonDetailsPage.assertChangesSaved()
  })
})
