import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ViewBookingPage extends AbstractPage {
  readonly header: Locator

  readonly cancelVideoLinkButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Bob Smith’s video link details' })
    this.cancelVideoLinkButton = page.getByRole('button', { name: 'Cancel video link' })
  }

  static async verifyOnPage(page: Page): Promise<ViewBookingPage> {
    const viewBookingPage = new ViewBookingPage(page)
    await expect(viewBookingPage.header).toBeVisible()
    await viewBookingPage.verifyNoAccessViolationsOnPage()
    return viewBookingPage
  }

  //
  // addComments = (): PageElement => this.getLink('Add comments')
  //
  // changeNotes = (): PageElement => cy.get(`[data-qa="change-notes"]`)
  //
  // changeBookingDetails = (): PageElement => this.getButton('Change booking details')
  //
  // cancelVideoLink = (): PageElement => this.getButton('Cancel video link')
  //
  // changeLinkFor = (key: string): PageElement =>
  //   cy
  //     .get('.govuk-summary-list__row')
  //     .contains('.govuk-summary-list__key', key)
  //     .parent()
  //     .find('.govuk-summary-list__actions .govuk-link')
}
