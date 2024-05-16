import config from '../config'
import RestClient from './restClient'
import { Court, ProbationTeam } from '../@types/bookAVideoLinkApi/types'

export default class BookAVideoLinkApiClient extends RestClient {
  constructor() {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi)
  }

  public getAllEnabledCourts(user: Express.User): Promise<Court[]> {
    return this.get({ path: '/courts/enabled' }, user)
  }

  public getAllEnabledProbationTeams(user: Express.User): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams/enabled' }, user)
  }
}
