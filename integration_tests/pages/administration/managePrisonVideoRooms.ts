import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ManagePrisonVideoRoomsPage extends AbstractPage {
  private readonly header: Locator

  readonly manageRoomsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Manage a prison's video link rooms` })
    this.manageRoomsLink = page.getByRole('link', { name: 'Manage rooms' })
  }

  static async verifyOnPage(page: Page): Promise<ManagePrisonVideoRoomsPage> {
    const managePrisonVideoRoomsPage = new ManagePrisonVideoRoomsPage(page)
    await expect(managePrisonVideoRoomsPage.header).toBeVisible()
    await managePrisonVideoRoomsPage.verifyNoAccessViolationsOnPage()
    return managePrisonVideoRoomsPage
  }
}
