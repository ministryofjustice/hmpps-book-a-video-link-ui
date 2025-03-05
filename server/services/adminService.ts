import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { dayOfWeekArray } from '../utils/utils'
import {
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  AmendDecoratedRoomRequest,
  Location,
  RoomAttributes,
  RoomSchedule,
} from '../@types/bookAVideoLinkApi/types'

export default class AdminService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  async createRoomAttributes(dpsLocationId: string, attributes: RoomAttributes, user: Express.User): Promise<Location> {
    const request = {
      locationStatus: attributes.locationStatus,
      locationUsage: attributes.locationUsage,
      prisonVideoUrl: attributes.prisonVideoUrl,
      allowedParties: attributes.allowedParties,
      comments: attributes.notes,
    } as CreateDecoratedRoomRequest
    return this.bookAVideoLinkApiClient.createRoomAttributes(dpsLocationId, request, user)
  }

  async amendRoomAttributes(dpsLocationId: string, attributes: RoomAttributes, user: Express.User): Promise<Location> {
    const request = {
      locationStatus: attributes.locationStatus,
      locationUsage: attributes.locationUsage,
      allowedParties: attributes.allowedParties,
      prisonVideoUrl: attributes.prisonVideoUrl,
      comments: attributes.notes,
    } as AmendDecoratedRoomRequest
    return this.bookAVideoLinkApiClient.amendRoomAttributes(dpsLocationId, request, user)
  }

  async deleteRoomAttributes(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomAttributes(dpsLocationId, user)
  }

  async createRoomSchedule(dpsLocationId: string, schedule: RoomSchedule, user: Express.User): Promise<Location> {
    const request = {
      startDayOfWeek: dayOfWeekArray().indexOf(schedule.startDayOfWeek) + 1,
      endDayOfWeek: dayOfWeekArray().indexOf(schedule.endDayOfWeek) + 1,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      locationUsage: schedule.locationUsage,
      allowedParties: schedule.allowedParties,
    } as CreateRoomScheduleRequest
    return this.bookAVideoLinkApiClient.createRoomSchedule(dpsLocationId, request, user)
  }

  async amendRoomSchedule(dpsLocationId: string, schedule: RoomSchedule, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.amendRoomSchedule(dpsLocationId, schedule, user)
  }

  async deleteRoomSchedule(dpsLocationId: string, scheduleId: number, user: Express.User): Promise<Location> {
    return this.bookAVideoLinkApiClient.deleteRoomSchedule(dpsLocationId, scheduleId, user)
  }
}
