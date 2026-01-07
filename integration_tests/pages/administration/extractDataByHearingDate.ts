import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class ExtractDataByHearingDatePage extends AbstractPage {
  private readonly header: Locator

  private readonly startDate: Locator

  private readonly numberOfDays: Locator

  readonly extractDataButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Extract summary data by hearing date' })
    this.startDate = page.locator('#startDate')
    this.numberOfDays = page.getByLabel('Enter a number of days from the start date')
    this.extractDataButton = page.getByRole('button', { name: 'Extract data' })
  }

  static async verifyOnPage(page: Page): Promise<ExtractDataByHearingDatePage> {
    const extractDataByHearingDatePage = new ExtractDataByHearingDatePage(page)
    await expect(extractDataByHearingDatePage.header).toBeVisible()
    await extractDataByHearingDatePage.verifyNoAccessViolationsOnPage()
    return extractDataByHearingDatePage
  }

  selectCourt = () => this.page.getByLabel('Court').click()

  selectProbation = () => this.page.getByLabel('Probation').click()

  selectDate = (date: Date) => this.startDate.fill(formatDate(date, 'dd/MM/yyyy') as string)

  enterNumberOfDays = (numberOfDays: number) => this.numberOfDays.fill(numberOfDays.toString())
}
