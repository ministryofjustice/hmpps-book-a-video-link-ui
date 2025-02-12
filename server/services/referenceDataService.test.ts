import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { ReferenceCode } from '../@types/bookAVideoLinkApi/types'
import ReferenceDataService from './referenceDataService'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Reference data service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let referenceDataService: ReferenceDataService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    referenceDataService = new ReferenceDataService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getCourtHearingTypes', () => {
    it('Retrieves court hearing types', async () => {
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([
        { code: 'code', description: 'description' },
      ] as ReferenceCode[])
      const result = await referenceDataService.getCourtHearingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('COURT_HEARING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })

  describe('getProbationMeetingTypes', () => {
    it('Retrieves probation meeting types', async () => {
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([
        { code: 'code', description: 'description' },
      ] as ReferenceCode[])
      const result = await referenceDataService.getProbationMeetingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('PROBATION_MEETING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })
})
