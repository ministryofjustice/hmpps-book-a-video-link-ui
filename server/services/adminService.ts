import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import {
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  AmendDecoratedRoomRequest,
  Location,
  AmendRoomScheduleRequest,
  RoomSchedule,
  AmendPrisonRequest,
  Prison,
} from '../@types/bookAVideoLinkApi/types'

export default class AdminService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  async getLocationByDpsLocationId(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.getLocationByDpsLocationId(dpsLocationId, user)
  }

  async createRoomAttributes(
    dpsLocationId: string,
    request: CreateDecoratedRoomRequest,
    user: Express.User,
  ): Promise<Location> {
    return this.bookAVideoLinkApiClient.createRoomAttributes(dpsLocationId, request, user)
  }

  async amendRoomAttributes(
    dpsLocationId: string,
    request: AmendDecoratedRoomRequest,
    user: Express.User,
  ): Promise<Location> {
    return this.bookAVideoLinkApiClient.amendRoomAttributes(dpsLocationId, request, user)
  }

  async deleteRoomAttributes(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomAttributesAndSchedules(dpsLocationId, user)
  }

  async createRoomSchedule(
    dpsLocationId: string,
    request: CreateRoomScheduleRequest,
    user: Express.User,
  ): Promise<RoomSchedule> {
    return this.bookAVideoLinkApiClient.createRoomSchedule(dpsLocationId, request, user)
  }

  async amendRoomSchedule(
    dpsLocationId: string,
    scheduleId: number,
    request: AmendRoomScheduleRequest,
    user: Express.User,
  ): Promise<RoomSchedule> {
    return this.bookAVideoLinkApiClient.amendRoomSchedule(dpsLocationId, scheduleId, request, user)
  }

  async amendPrison(prisonCode: string, request: AmendPrisonRequest, user: Express.User): Promise<Prison> {
    return this.bookAVideoLinkApiClient.amendPrison(prisonCode, request, user)
  }

  async deleteRoomSchedule(dpsLocationId: string, scheduleId: number, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomSchedule(dpsLocationId, scheduleId, user)
  }
}
