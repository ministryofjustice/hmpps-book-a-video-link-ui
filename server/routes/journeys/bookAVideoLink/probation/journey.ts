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
  officerFullName?: string
  officerEmail?: string
  officerTelephone?: string
  meetingTypeCode?: string
  date?: string
  duration?: number
  timePeriods?: string[]
  startTime?: string
  endTime?: string
  locationCode?: string
  comments?: string
  videoLinkUrl?: string
}
