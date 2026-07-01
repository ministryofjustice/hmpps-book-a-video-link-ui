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
  probationOfficerDetailsKnown?: boolean
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
  locationId?: string
  notesForStaff?: string
  originalBookingDate?: string
}
