import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import PrisonService from './prisonService'
import { Location, Prison } from '../@types/bookAVideoLinkApi/types'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Prison service', () => {
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>
  let prisonService: PrisonService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    prisonService = new PrisonService(bookAVideoLinkApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAppointmentLocations', () => {
    it('Retrieves all appointment locations', async () => {
      bookAVideoLinkApiClient.getAppointmentLocations.mockResolvedValue([
        { key: 'key', description: 'description' },
      ] as Location[])
      const result = await prisonService.getAppointmentLocations('MDI', true, user)
      expect(bookAVideoLinkApiClient.getAppointmentLocations).toHaveBeenCalledWith('MDI', true, user)
      expect(result).toEqual([{ key: 'key', description: 'description' }])
    })
  })

  describe('getPrisons', () => {
    it('Retrieves all prisons with an enabledOnly flag', async () => {
      bookAVideoLinkApiClient.getPrisons.mockResolvedValue([{ code: 'code', name: 'description' }] as Prison[])
      const result = await prisonService.getPrisons(true, user)
      expect(bookAVideoLinkApiClient.getPrisons).toHaveBeenCalledWith(true, user)
      expect(result).toEqual([{ code: 'code', name: 'description' }])
    })
  })
})
