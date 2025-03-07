import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import AdminService from './adminService'
import { Location, RoomAttributes, RoomSchedule } from '../@types/bookAVideoLinkApi/types'

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
      // TODO
    })

    it('should update the room attributes', async () => {
      // TODO
    })

    it('should remove the room attributes', async () => {
      // TODO
    })

    it('should create a schedule', async () => {
      // TODO
    })

    it('should update a schedule', async () => {
      // TODO
    })

    it('should remove a schedule', async () => {
      // TODO
    })
  })
})

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
