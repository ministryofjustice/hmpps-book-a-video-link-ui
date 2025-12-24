import { expect, type Locator, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export default class AbstractPage {
  readonly page: Page

  /** username that appears in the header */
  readonly usersName: Locator

  /** phase banner that appears in the header */
  readonly phaseBanner: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** link to manage user details */
  readonly manageUserDetails: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.usersName = page.getByTestId('header-user-name')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')
  }

  async verifyNoAccessViolationsOnPage(disabledRules: string[] = []): Promise<void> {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(disabledRules)
      .analyze()

    expect(accessibilityScanResults.violations).toHaveLength(0)
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async selectCheckbox(text: string) {
    await this.page.getByRole('checkbox', { name: text, exact: true }).check()
  }

  async selectTime(idPrefix: string, hour: number, minute: number) {
    await this.page.locator(`#${idPrefix}Time`).selectOption(hour.toString().padStart(2, '0'))
    await this.page.locator(`#${idPrefix}Time-minute`).selectOption(minute.toString().padStart(2, '0'))
  }

  async assertSummaryListValue(listIdentifier: string, heading: string, expectedValue: string) {
    const key = this.page
      .locator(`[data-qa="${listIdentifier}"] > .govuk-summary-list__row > .govuk-summary-list__key`)
      .getByText(heading, { exact: true })
    const value = key.locator('..').locator('.govuk-summary-list__value')
    await expect(value).toContainText(expectedValue)
  }
}
