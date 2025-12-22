import { type Locator, type Page, expect } from '@playwright/test'
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

  async verifyNoAccessViolationsOnPage(): Promise<void> {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toHaveLength(0)
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async selectCheckbox(text: string) {
    await this.page.getByRole('checkbox', { name: text, exact: true }).check()
  }
}
