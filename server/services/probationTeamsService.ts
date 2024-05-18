import { groupBy } from 'lodash'
import { Dictionary } from 'express-serve-static-core'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ProbationTeam } from '../@types/bookAVideoLinkApi/types'

export type ProbationTeamsByLetter = Dictionary<ProbationTeam[]>

export default class ProbationTeamsService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public async getAllEnabledProbationTeams(user: Express.User): Promise<ProbationTeam[]> {
    const probationTeamsList = await this.bookAVideoLinkApiClient.getAllEnabledProbationTeams(user)
    return this.sortAlphabetically(probationTeamsList)
  }

  public async getUserPreferences(user: Express.User): Promise<ProbationTeam[]> {
    const probationTeamsList = await this.bookAVideoLinkApiClient.getUserProbationTeamPreferences(user)
    return this.sortAlphabetically(probationTeamsList)
  }

  public setUserPreferences(probationTeamCodes: string[], user: Express.User): Promise<void> {
    return this.bookAVideoLinkApiClient.setUserProbationTeamPreferences(probationTeamCodes, user)
  }

  public async getProbationTeamsByLetter(user: Express.User): Promise<ProbationTeamsByLetter> {
    const probationTeams = await this.getAllEnabledProbationTeams(user)
    return groupBy(probationTeams, probationTeam => probationTeam.description.charAt(0).toUpperCase())
  }

  private sortAlphabetically(probationTeams: ProbationTeam[]): ProbationTeam[] {
    return probationTeams.sort((a, b) => a.description.localeCompare(b.description))
  }
}
