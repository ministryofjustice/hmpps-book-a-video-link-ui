import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class HomePage extends AbstractPage {
  private readonly header: Locator

  readonly manageYourListOfCourtsLink: Locator

  readonly manageYourListProbationTeamsLink: Locator

  readonly viewAndChangeVideoLinks: Locator

  readonly bookNewVideoBookingLink: Locator

  readonly administrationLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Book a video link with a prison' })
    this.manageYourListOfCourtsLink = page.getByRole('link', { name: 'Manage your list of courts' })
    this.manageYourListProbationTeamsLink = page.getByRole('link', { name: 'Manage your list of probation teams' })
    this.viewAndChangeVideoLinks = page.getByRole('link', { name: 'View and change video links' })
    this.bookNewVideoBookingLink = page.getByRole('link', { name: 'Book a new video link' })
    this.administrationLink = page.getByRole('link', { name: 'Administration area' })
  }

  static async verifyOnPage(page: Page): Promise<HomePage> {
    const homePage = new HomePage(page)
    await expect(homePage.header).toBeVisible()
    await homePage.verifyNoAccessViolationsOnPage()
    return homePage
  }
}
