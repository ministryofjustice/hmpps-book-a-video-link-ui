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
  officerDetailsNotKnown?: boolean
  officer?: {
    fullName: string
    email: string
    telephone?: string
  }
  meetingTypeCode?: string
  date?: string
  duration?: number
  timePeriods?: string[]
  startTime?: string
  endTime?: string
  locationCode?: string
  notesForStaff?: string
}
