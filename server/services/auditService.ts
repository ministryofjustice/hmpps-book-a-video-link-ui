import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  HOME_PAGE = 'HOME_PAGE',
  USER_PREFERENCES_PAGE = 'USER_PREFERENCES_PAGE',
  USER_PREFERENCES_CONFIRMATION_PAGE = 'USER_PREFERENCES_CONFIRMATION_PAGE',
  PRISONER_SEARCH_PAGE = 'PRISONER_SEARCH_PAGE',
  PRISONER_NOT_LISTED_PAGE = 'PRISONER_NOT_LISTED_PAGE',
  UNKNOWN_PRISONER_DETAILS_PAGE = 'UNKNOWN_PRISONER_DETAILS_PAGE',
  PRISONER_SEARCH_RESULTS_PAGE = 'PRISONER_SEARCH_RESULTS_PAGE',
  BOOKING_DETAILS_PAGE = 'BOOKING_DETAILS_PAGE',
  SELECT_ROOMS_PAGE = 'SELECT_ROOMS_PAGE',
  CHECK_BOOKING_PAGE = 'CHECK_BOOKING_PAGE',
  COMMENTS_PAGE = 'COMMENTS_PAGE',
  BOOKING_AVAILABILITY_PAGE = 'BOOKING_AVAILABILITY_PAGE',
  BOOKING_NOT_AVAILABLE_PAGE = 'BOOKING_NOT_AVAILABLE_PAGE',
  BOOKING_CONFIRMATION_PAGE = 'BOOKING_CONFIRMATION_PAGE',
  BOOKING_REQUESTED_PAGE = 'BOOKING_REQUESTED_PAGE',
  CONFIRM_CANCEL_PAGE = 'CONFIRM_CANCEL_PAGE',
  BOOKING_CANCELLED_PAGE = 'BOOKING_CANCELLED_PAGE',
  VIEW_DAILY_BOOKINGS_PAGE = 'VIEW_DAILY_BOOKINGS_PAGE',
  VIEW_BOOKING_PAGE = 'VIEW_BOOKING_PAGE',
  ADMIN_PAGE = 'ADMIN_PAGE',
  EXTRACT_BY_BOOKING_PAGE = 'EXTRACT_BY_BOOKING_PAGE',
  EXTRACT_BY_HEARING_PAGE = 'EXTRACT_BY_HEARING_PAGE',
  VIEW_PRISON_LIST_PAGE = 'VIEW_PRISON_LIST_PAGE',
  PRISON_LOCATIONS_PAGE = 'PRISON_LOCATIONS_PAGE',
  VIEW_PRISON_ROOM_PAGE = 'VIEW_PRISON_ROOM_PAGE',
  DELETE_ROOM_SCHEDULE_PAGE = 'DELETE_ROOM_SCHEDULE_PAGE',
  ADD_ROOM_SCHEDULE_PAGE = 'ADD_ROOM_SCHEDULE_PAGE',
  EDIT_ROOM_SCHEDULE_PAGE = 'EDIT_ROOM_SCHEDULE_PAGE',
  DOWNLOAD_BOOKINGS_PAGE = 'DOWNLOAD_BOOKINGS_PAGE',
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
