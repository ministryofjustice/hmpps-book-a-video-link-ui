export type ViewMultipleAgencyBookingsJourney = {
  agencyCode: string
  fromDate: string
  toDate: string
  firstName: string
  lastName: string
  prisonerNumber: string
  onlyMissingCourtHearingLink: boolean
  onlyMissingProbationOfficerDetails: boolean
  page: number
  sort: string
}

export type ViewBookingsBookingJourney = {
  agencyCode: string
  fromDate: string
}
