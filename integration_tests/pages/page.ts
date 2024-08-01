import * as axe from 'axe-core'
import { getDate, getMonth, getYear, parse } from 'date-fns'

export type PageElement = Cypress.Chainable

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(
    private readonly title: string,
    private readonly pauseAxeOnThisPage = false,
  ) {
    this.checkOnPage()
    this.terminalLog = this.terminalLog.bind(this)

    if (!pauseAxeOnThisPage) {
      cy.injectAxe()
      cy.configureAxe({
        // These disabled rules suppress only common upstream GOVUK Design System behaviours:
        rules: [
          // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
          // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
          { id: 'aria-allowed-attr', enabled: false },
        ],
      })
      cy.checkA11y(null, null, this.terminalLog)
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')
  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  protected getByLabel: (label: string) => PageElement = (label: string) =>
    cy
      .contains('label', label)
      .invoke('attr', 'for')
      .then(id => cy.get(`#${id}`))

  protected selectDatePickerDate = (label: string, date: Date) => {
    cy.contains('label', label)
      .invoke('attr', 'for')
      .then(id => {
        cy.get(`#${id}`)
          .closest('.moj-datepicker__wrapper')
          .within(() => {
            cy.get('.moj-datepicker__toggle').click()

            const month = getMonth(date)
            const year = getYear(date)

            cy.get('.moj-datepicker__dialog-title').then($title => {
              const [currentMonthName, currentYearStr] = $title.text().trim().split(' ')
              const currentMonth = getMonth(parse(currentMonthName, 'MMMM', new Date()))
              const currentYear = +currentYearStr

              // Navigate years
              const yearDelta = year - currentYear
              if (yearDelta !== 0) {
                const yearButtonSelector = `.moj-js-datepicker-${yearDelta > 0 ? 'next' : 'prev'}-year`
                for (let i = 0; i < Math.abs(yearDelta); i += 1) {
                  cy.get(yearButtonSelector).click()
                }
              }

              // Navigate months
              const monthDelta = month - currentMonth
              if (monthDelta !== 0) {
                const monthButtonSelector = `.moj-js-datepicker-${monthDelta > 0 ? 'next' : 'prev'}-month`
                for (let i = 0; i < Math.abs(monthDelta); i += 1) {
                  cy.get(monthButtonSelector).click()
                }
              }
            })

            // Select day
            const day = getDate(date)
            cy.get('.moj-js-datepicker-grid button:visible')
              .contains(new RegExp(`^${day}$`))
              .click()
          })
      })
  }

  protected selectTimePickerTime = (label: string, hour: number, minute: number) => {
    cy.contains('legend', label)
      .parent()
      .within(() => {
        cy.contains('label', 'Hour')
          .invoke('attr', 'for')
          .then(id => {
            cy.get(`#${id}`).select(hour.toString().padStart(2, '0'))
          })

        cy.contains('label', 'Minute')
          .invoke('attr', 'for')
          .then(id => {
            cy.get(`#${id}`).select(minute.toString().padStart(2, '0'))
          })
      })
  }

  protected getButton = (text: string): PageElement => cy.get('button, a').contains(text)
  protected getLink = (text: string): PageElement => cy.get('a').contains(text)

  private terminalLog(violations: axe.Result[]) {
    const violationData = violations.map(({ id, impact, help, helpUrl, nodes }) => ({
      id,
      impact,
      help,
      helpUrl,
      nodes: nodes.length,
    }))

    if (violationData.length > 0) {
      cy.task('log', `Violation summary for: ${this.title}`)
      cy.task('table', violationData)

      cy.task('log', 'Violation detail')
      cy.task('log', '----------------')

      violations.forEach(v => {
        v.nodes.forEach(node => {
          cy.task('log', node.failureSummary)
          cy.task('log', `Impact: ${node.impact}`)
          cy.task('log', `Target: ${node.target}`)
          cy.task('log', `HTML: ${node.html}`)
          cy.task('log', '----------------')
        })
      })
    }
  }
}
