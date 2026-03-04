export type BookACourtHearingJourney = {
  bookingId?: number
  preHearingAppointmentId?: number
  mainHearingAppointmentId?: number
  postHearingAppointmentId?: number
  bookingStatus?: string
  prisoner?: {
    firstName: string
    lastName: string
    prisonerNumber?: string
    dateOfBirth: string
    prisonId: string
    prisonName: string
  }
  courtCode?: string
  hearingTypeCode?: string
  date?: string
  startTime?: string
  endTime?: string
  preHearingStartTime?: string
  preHearingEndTime?: string
  postHearingStartTime?: string
  postHearingEndTime?: string
  locationCode?: string
  preLocationCode?: string
  postLocationCode?: string
  notesForStaff?: string
  cvpRequired?: boolean
  videoLinkUrl?: string
  hmctsNumber?: string
  guestPinRequired?: boolean
  guestPin?: string
  originalBookingDate?: string
  // Record initial values so can be used in alternative flows e.g. alternative court room flow.
  initialPreHearingStartTime?: string
  initialPreHearingEndTime?: string
  initialStartTime?: string
  initialEndTime?: string
  initialPostHearingStartTime?: string
  initialPostHearingEndTime?: string
}
