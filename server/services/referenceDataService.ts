import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'

export default class ReferenceDataService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public getCourtHearingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public getProbationMeetingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
  }
}
