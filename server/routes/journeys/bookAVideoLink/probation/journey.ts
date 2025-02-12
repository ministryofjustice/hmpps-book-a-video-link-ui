export type BookAProbationMeetingJourney = {
  bookingId?: number
  bookingStatus?: string
  prisoner?: {
    firstName: string
    lastName: string
    prisonerNumber?: string
    dateOfBirth: string
    prisonId: string
    prisonName: string
  }
  probationTeamCode?: string
  meetingTypeCode?: string
  date?: string
  startTime?: string
  endTime?: string
  locationCode?: string
  comments?: string
  videoLinkUrl?: string
}
