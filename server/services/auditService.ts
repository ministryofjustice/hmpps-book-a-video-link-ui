import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  HOME_PAGE = 'HOME_PAGE',
  MANAGE_COURTS_PAGE = 'MANAGE_COURTS_PAGE',
  MANAGE_COURTS_CONFIRMATION_PAGE = 'MANAGE_COURTS_CONFIRMATION_PAGE',
  MANAGE_PROBATION_TEAMS_PAGE = 'MANAGE_PROBATION_TEAMS_PAGE',
  MANAGE_PROBATION_TEAMS_CONFIRMATION_PAGE = 'MANAGE_PROBATION_TEAMS_CONFIRMATION_PAGE',
  PRISONER_SEARCH_PAGE = 'PRISONER_SEARCH_PAGE',
  PRISONER_SEARCH_RESULTS_PAGE = 'PRISONER_SEARCH_RESULTS_PAGE',
  BOOKING_DETAILS_PAGE = 'BOOKING_DETAILS_PAGE',
  CHECK_BOOKING_PAGE = 'CHECK_BOOKING_PAGE',
  BOOKING_NOT_AVAILABLE_PAGE = 'BOOKING_NOT_AVAILABLE_PAGE',
  BOOKING_CONFIRMATION_PAGE = 'BOOKING_CONFIRMATION_PAGE',
  VIEW_DAILY_BOOKINGS_PAGE = 'VIEW_DAILY_BOOKINGS_PAGE',
}

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
