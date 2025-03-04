import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { Location, RoomAttributes, RoomSchedule } from '../@types/bookAVideoLinkApi/types'

export default class AdminService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  async createRoomAttributes(dpsLocationId: string, attributes: RoomAttributes, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.createRoomAttributes(dpsLocationId, attributes, user)
  }

  async amendRoomAttributes(dpsLocationId: string, attributes: RoomAttributes, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.amendRoomAttributes(dpsLocationId, attributes, user)
  }

  async deleteRoomAttributes(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomAttributes(dpsLocationId, user)
  }

  async createRoomSchedule(dpsLocationId: string, schedule: RoomSchedule, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.createRoomSchedule(dpsLocationId, schedule, user)
  }

  async amendRoomSchedule(dpsLocationId: string, schedule: RoomSchedule, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.amendRoomSchedule(dpsLocationId, schedule, user)
  }

  async deleteRoomSchedule(dpsLocationId: string, scheduleId: number, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomSchedule(dpsLocationId, scheduleId, user)
  }
}
