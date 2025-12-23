import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class BookingRequestedPage extends AbstractPage {
  private readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `The video link has been requested` })
  }

  static async verifyOnPage(page: Page): Promise<BookingRequestedPage> {
    const bookingRequestedPage = new BookingRequestedPage(page)
    await expect(bookingRequestedPage.header).toBeVisible()
    await bookingRequestedPage.verifyNoAccessViolationsOnPage()
    return bookingRequestedPage
  }
}
