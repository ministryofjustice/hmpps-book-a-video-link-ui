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

  public getUserCourtPreferences(user: Express.User): Promise<Court[]> {
    return this.get({ path: `/courts/user-preferences/${user.username}` }, user)
  }

  public setUserCourtPreferences(courtCodes: string[], user: Express.User): Promise<void> {
    return this.post(
      {
        path: `/courts/user-preferences/set`,
        data: {
          courtCodes,
        },
      },
      user,
    )
  }

  public getAllEnabledProbationTeams(user: Express.User): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams/enabled' }, user)
  }

  public getUserProbationTeamPreferences(user: Express.User): Promise<ProbationTeam[]> {
    return this.get({ path: `/probation-teams/user-preferences/${user.username}` }, user)
  }

  public setUserProbationTeamPreferences(probationTeamCodes: string[], user: Express.User): Promise<void> {
    return this.post(
      {
        path: `/probation-teams/user-preferences/set`,
        data: {
          probationTeamCodes,
        },
      },
      user,
    )
  }
}
