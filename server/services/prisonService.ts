import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { Location, Prison } from '../@types/bookAVideoLinkApi/types'

export default class PrisonService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public async getAppointmentLocations(prisonCode: string, user: Express.User): Promise<Location[]> {
    return this.bookAVideoLinkApiClient.getAppointmentLocations(prisonCode, user)
  }

  public async getPrisons(enabledOnly: boolean, user: Express.User): Promise<Prison[]> {
    return this.bookAVideoLinkApiClient.getPrisons(enabledOnly, user)
  }
}
