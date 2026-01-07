import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectRoomsPage extends AbstractPage {
  private readonly header: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select rooms for' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<SelectRoomsPage> {
    const selectRoomsPage = new SelectRoomsPage(page)
    await expect(selectRoomsPage.header).toBeVisible()
    await selectRoomsPage.verifyNoAccessViolationsOnPage()
    return selectRoomsPage
  }

  async selectRoomForPreHearing(room: string) {
    await this.page.getByLabel('Select room for pre-court hearing briefing').selectOption(room)
  }

  async selectRoomForMainHearing(room: string) {
    await this.page.getByLabel('Select room for court hearing').selectOption(room)
  }

  async selectRoomForPostHearing(room: string) {
    await this.page.getByLabel('Select room for post-court hearing briefing').selectOption(room)
  }
}
