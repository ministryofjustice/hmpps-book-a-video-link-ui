export type BookAVideoLinkJourney = {
  type?: string
  search?: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    prison?: string
    prisonerNumber?: string
    pncNumber?: string
  }
  prisoner?: {
    name: string
    prisonerNumber: string
    prisonId: string
    prisonName: string
  }
  agencyCode?: string
  hearingType?: string
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
  comments?: string
  videoLinkUrl?: string
}
