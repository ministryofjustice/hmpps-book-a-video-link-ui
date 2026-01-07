import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ChangeVideoLinkBookingPage extends AbstractPage {
  private readonly header: Locator

  private readonly courtHearingType: Locator

  private readonly hearingLink: Locator

  private readonly fullWebAddress: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Change' })
    this.courtHearingType = page.getByLabel('Select the court hearing type')
    this.hearingLink = page.getByLabel('Enter number from CVP address')
    this.fullWebAddress = page.getByLabel('Enter full web address (URL)')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<ChangeVideoLinkBookingPage> {
    const changeVideoLinkBookingPage = new ChangeVideoLinkBookingPage(page)
    await expect(changeVideoLinkBookingPage.header).toBeVisible()
    // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    await changeVideoLinkBookingPage.verifyNoAccessViolationsOnPage(['aria-allowed-attr'])
    return changeVideoLinkBookingPage
  }

  async selectCourtHearingType(courtHearingType: string) {
    await this.courtHearingType.selectOption(courtHearingType)
  }

  async selectCvpKnown(yesOrNo: string) {
    if (yesOrNo === 'Yes') {
      await this.page.locator('#cvpRequired').check()
    }

    if (yesOrNo === 'No') {
      await this.page.locator('#cvpRequired-2').check()
    }
  }

  enterHearingLink = (link: string) => this.hearingLink.fill(link)

  enterFullWebAddress = (link: string) => this.fullWebAddress.fill(link)

  clearFullWebAddress = () => this.fullWebAddress.clear()
}
