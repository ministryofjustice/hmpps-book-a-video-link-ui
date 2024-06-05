export type BookAVideoLinkJourney = {
  search?: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    prison?: string
    prisonerNumber?: string
    pncNumber?: string
  }
  type?: string
  prisoner?: {
    name: string
    prisonerNumber: string
    prisonId: string
    prisonName: string
  }
  agencyCode?: string
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
  comments?: string
  videoLinkUrl?: string
}
