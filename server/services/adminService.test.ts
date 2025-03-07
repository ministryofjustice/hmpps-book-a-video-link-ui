import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import AdminService from './adminService'
import {
  CreateDecoratedRoomRequest,
  AmendDecoratedRoomRequest,
  Location,
  RoomAttributes,
  RoomSchedule,
  CreateRoomScheduleRequest,
  AmendRoomScheduleRequest,
} from '../@types/bookAVideoLinkApi/types'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Admin service', () => {
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>
  let adminService: AdminService

  const user = createUser([])
  const dpsLocationId = 'aaaa-bbbb-cccc-dddd'

  beforeEach(() => {
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    adminService = new AdminService(bookAVideoLinkApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('room administration features', () => {
    it('should get a location by dpsLocationId', async () => {
      bookAVideoLinkApiClient.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation(dpsLocationId))
      const result: Location = await adminService.getLocationByDpsLocationId(dpsLocationId, user)
      expect(bookAVideoLinkApiClient.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
      expect(result).toEqual(aDecoratedLocation(dpsLocationId))
    })

    it('should decorate a room with minimal fields', async () => {
      const request = {
        locationStatus: 'ACTIVE',
        prisonVideoUrl: 'aUrl',
        locationUsage: 'SHARED',
        comments: 'Room comments',
        allowedParties: [],
      } as CreateDecoratedRoomRequest

      bookAVideoLinkApiClient.createRoomAttributes.mockResolvedValue(aDecoratedLocation(dpsLocationId))

      const result: Location = await adminService.createRoomAttributes(dpsLocationId, request, user)

      expect(bookAVideoLinkApiClient.createRoomAttributes).toHaveBeenCalledWith(dpsLocationId, request, user)
      expect(result).toEqual(aDecoratedLocation(dpsLocationId))
    })

    it('should update the room attributes', async () => {
      const request = {
        locationStatus: 'INACTIVE',
        prisonVideoUrl: 'aUrl',
        locationUsage: 'SHARED',
        comments: 'Room comments',
        allowedParties: [],
      } as AmendDecoratedRoomRequest

      bookAVideoLinkApiClient.amendRoomAttributes.mockResolvedValue(aDecoratedLocation(dpsLocationId))

      const result: Location = await adminService.amendRoomAttributes(dpsLocationId, request, user)

      expect(bookAVideoLinkApiClient.amendRoomAttributes).toHaveBeenCalledWith(dpsLocationId, request, user)
      expect(result).toEqual(aDecoratedLocation(dpsLocationId))
    })

    it('should remove the room attributes', async () => {
      bookAVideoLinkApiClient.deleteRoomAttributesAndSchedules.mockResolvedValue(null)
      await adminService.deleteRoomAttributes(dpsLocationId, user)
      expect(bookAVideoLinkApiClient.deleteRoomAttributesAndSchedules).toHaveBeenCalledWith(dpsLocationId, user)
    })

    it('should create a room schedule', async () => {
      const request = {
        startDayOfWeek: 1,
        endDayOfWeek: 7,
        startTime: '10:00',
        endTime: '12:00',
        locationUsage: 'COURT',
        allowedParties: ['ABERFM'],
      } as CreateRoomScheduleRequest

      bookAVideoLinkApiClient.createRoomSchedule.mockResolvedValue(aRoomSchedule(1))

      const result: RoomSchedule = await adminService.createRoomSchedule(dpsLocationId, request, user)

      expect(bookAVideoLinkApiClient.createRoomSchedule).toHaveBeenCalledWith(dpsLocationId, request, user)
      expect(result).toEqual(aRoomSchedule(1))
    })

    it('should update a room schedule', async () => {
      const request = {
        startDayOfWeek: 1,
        endDayOfWeek: 7,
        startTime: '10:00',
        endTime: '12:00',
        locationUsage: 'COURT',
        allowedParties: ['ABERFM'],
      } as AmendRoomScheduleRequest

      bookAVideoLinkApiClient.amendRoomSchedule.mockResolvedValue(aRoomSchedule(1))

      const result: RoomSchedule = await adminService.amendRoomSchedule(dpsLocationId, 1, request, user)

      expect(bookAVideoLinkApiClient.amendRoomSchedule).toHaveBeenCalledWith(dpsLocationId, 1, request, user)
      expect(result).toEqual(aRoomSchedule(1))
    })

    it('should remove a schedule', async () => {
      bookAVideoLinkApiClient.deleteRoomSchedule.mockResolvedValue(null)
      await adminService.deleteRoomSchedule(dpsLocationId, 1, user)
      expect(bookAVideoLinkApiClient.deleteRoomSchedule).toHaveBeenCalledWith(dpsLocationId, 1, user)
    })
  })
})

const aRoomSchedule = (scheduleId: number) => {
  return {
    scheduleId,
    startDayOfWeek: 'MONDAY',
    endDayOfWeek: 'FRIDAY',
    startTime: '10:00',
    endTime: '12:00',
    locationUsage: 'SHARED',
    allowedParties: ['ABERFM'],
  } as RoomSchedule
}
const aDecoratedLocation = (dpsId: string): Location => {
  return {
    key: 'BMI-VIDEOLINK',
    prisonCode: 'BMI',
    description: 'VIDEO LINK',
    enabled: true,
    dpsLocationId: dpsId,
    extraAttributes: {
      attributeId: 1,
      locationStatus: 'ACTIVE',
      locationUsage: 'SCHEDULE',
      allowedParties: ['YRKMAG', 'DRBYJS'],
      prisonVideoUrl: 'link1',
      notes: 'notes',
      schedule: [
        {
          scheduleId: 345,
          startDayOfWeek: 'MONDAY',
          endDayOfWeek: 'FRIDAY',
          startTime: '10:00',
          endTime: '16:00',
          locationUsage: 'SHARED',
        } as RoomSchedule,
      ],
    } as RoomAttributes,
  } as Location
}
