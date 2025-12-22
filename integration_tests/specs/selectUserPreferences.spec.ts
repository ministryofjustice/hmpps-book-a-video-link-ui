import { test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import manageUsersApi from '../mockApis/manageUsersApi'
import bookAVideoLinkApi from '../mockApis/bookAVideoLinkApi'
import userPreferencesApi from '../mockApis/userPreferencesApi'
import SelectCourtPreferencesPage from '../pages/userPreferences/selectCourtPreferences'
import CourtPreferencesConfirmationPage from '../pages/userPreferences/courtPreferencesConfirmation'
import HomePage from '../pages/homePage'
import SelectProbationTeamPreferencesPage from '../pages/userPreferences/selectProbationTeamPreferences'
import ProbationTeamPreferencesConfirmationPage from '../pages/userPreferences/probationTeamPreferencesConfirmation'

test.describe('Select User Preferences', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('Court user', () => {
    test.beforeEach(async () => {
      await Promise.all([
        bookAVideoLinkApi.stubGetEnabledCourts(),
        bookAVideoLinkApi.stubSetUserCourtPreferences(),
        hmppsAuth.stubSignInPage(),
        manageUsersApi.stubCourtUser('john smith'),
        userPreferencesApi.stubGetUserPreferences(),
      ])
    })

    test('Court user is asked to complete preferences in first log in', async ({ page }) => {
      await bookAVideoLinkApi.stubGetUserCourtPreferences([])
      await login(page)
      const selectCourtPreferencesPage = await SelectCourtPreferencesPage.verifyOnPage(page)
      await selectCourtPreferencesPage.showAllSectionsButton.click()
      await selectCourtPreferencesPage.selectCheckbox('Aberystwyth Civil')
      await selectCourtPreferencesPage.selectCheckbox('Aberystwyth Family')
      await selectCourtPreferencesPage.confirmButton.click()
      await CourtPreferencesConfirmationPage.verifyOnPage(page)
    })

    test('Court user can update court preferences', async ({ page }) => {
      await bookAVideoLinkApi.stubGetUserCourtPreferences()
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.manageYourListOfCourtsLink.click()
      const selectCourtPreferencesPage = await SelectCourtPreferencesPage.verifyOnPage(page)
      await selectCourtPreferencesPage.showAllSectionsButton.click()
      await selectCourtPreferencesPage.selectCheckbox('Aberystwyth Civil')
      await selectCourtPreferencesPage.selectCheckbox('Aberystwyth Family')
      await selectCourtPreferencesPage.confirmButton.click()
      await CourtPreferencesConfirmationPage.verifyOnPage(page)
    })
  })

  test.describe('Probation user', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubSignInPage(),
        userPreferencesApi.stubGetUserPreferences(),
        bookAVideoLinkApi.stubGetEnabledProbationTeams(),
        bookAVideoLinkApi.stubSetUserProbationTeamPreferences(),
        manageUsersApi.stubProbationUser('john smith'),
      ])
    })

    test('Probation user is asked to complete preferences in first log in', async ({ page }) => {
      await bookAVideoLinkApi.stubGetUserProbationTeamPreferences([])
      await login(page)
      const selectProbationTeamPreferencesPage = await SelectProbationTeamPreferencesPage.verifyOnPage(page)
      await selectProbationTeamPreferencesPage.showAllSectionsButton.click()
      await selectProbationTeamPreferencesPage.selectCheckbox('Blackpool MC (PPOC)')
      await selectProbationTeamPreferencesPage.selectCheckbox('Burnley MC (PPOC)')
      await selectProbationTeamPreferencesPage.confirmButton.click()
      await ProbationTeamPreferencesConfirmationPage.verifyOnPage(page)
    })

    test('Probation user can update court preferences', async ({ page }) => {
      await bookAVideoLinkApi.stubGetUserProbationTeamPreferences()
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)
      await homePage.manageYourListProbationTeamsLink.click()
      const selectProbationTeamPreferencesPage = await SelectProbationTeamPreferencesPage.verifyOnPage(page)
      await selectProbationTeamPreferencesPage.showAllSectionsButton.click()
      await selectProbationTeamPreferencesPage.selectCheckbox('Blackpool MC (PPOC)')
      await selectProbationTeamPreferencesPage.selectCheckbox('Burnley MC (PPOC)')
      await selectProbationTeamPreferencesPage.confirmButton.click()
      await ProbationTeamPreferencesConfirmationPage.verifyOnPage(page)
    })
  })
})
