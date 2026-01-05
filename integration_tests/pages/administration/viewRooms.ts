import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ViewRoomsPage extends AbstractPage {
  private readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Edit video link rooms at` })
  }

  static async verifyOnPage(page: Page): Promise<ViewRoomsPage> {
    const viewRoomsPage = new ViewRoomsPage(page)
    await expect(viewRoomsPage.header).toBeVisible()
    await viewRoomsPage.verifyNoAccessViolationsOnPage()
    return viewRoomsPage
  }

  viewOrEditLink = (locationId: string) => this.page.getByTestId(`view-edit-${locationId}`)
}
