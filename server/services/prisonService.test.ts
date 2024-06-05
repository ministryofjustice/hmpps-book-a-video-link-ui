import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import PrisonService from './prisonService'

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
      bookAVideoLinkApiClient.getAppointmentLocations.mockResolvedValue([{ key: 'key', description: 'description' }])
      const result = await prisonService.getAppointmentLocations('MDI', user)
      expect(bookAVideoLinkApiClient.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)
      expect(result).toEqual([{ key: 'key', description: 'description' }])
    })
  })

  describe('getPrisons', () => {
    it('Retrieves all prisons with an enabledOnly flag', async () => {
      bookAVideoLinkApiClient.getPrisons.mockResolvedValue([{ code: 'code', description: 'description' }])
      const result = await prisonService.getPrisons(true, user)
      expect(bookAVideoLinkApiClient.getPrisons).toHaveBeenCalledWith(true, user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })
})
