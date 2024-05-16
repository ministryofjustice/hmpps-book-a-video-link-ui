import { groupBy } from 'lodash'
import { Dictionary } from 'express-serve-static-core'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { Court } from '../@types/bookAVideoLinkApi/types'

export type CourtsByLetter = Dictionary<Court[]>

export default class CourtsService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public async getAllEnabledCourts(user: Express.User): Promise<Court[]> {
    const courtsList = await this.bookAVideoLinkApiClient.getAllEnabledCourts(user)
    return this.sortAlphabetically(courtsList)
  }

  public async getCourtsByLetter(user: Express.User): Promise<CourtsByLetter> {
    const courts = await this.getAllEnabledCourts(user)
    return groupBy(courts, court => court.description.charAt(0).toUpperCase())
  }

  private sortAlphabetically(courts: Court[]): Court[] {
    return courts.sort((a, b) => a.description.localeCompare(b.description))
  }
}
