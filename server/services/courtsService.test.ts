import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import CourtsService from './courtsService'
import { Court } from '../@types/bookAVideoLinkApi/types'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Courts service', () => {
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>
  let courtsService: CourtsService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    courtsService = new CourtsService(bookAVideoLinkApiClient)

    bookAVideoLinkApiClient.getAllEnabledCourts.mockResolvedValue([
      { code: 'GTSHMC', description: 'Gateshead Magistrates' },
      { code: 'AYLSCC', description: 'Aylesbury Crown' },
      { code: 'ABERCV', description: 'Aberystwyth Civil' },
      { code: 'NEWPCC', description: 'Newport Crown' },
    ] as unknown as Court[])
  })

  describe('getAllEnabledCourts', () => {
    it('Retrieves all courts sorted alphabetically', async () => {
      const result = await courtsService.getAllEnabledCourts(user)

      expect(result).toStrictEqual([
        { code: 'ABERCV', description: 'Aberystwyth Civil' },
        { code: 'AYLSCC', description: 'Aylesbury Crown' },
        { code: 'GTSHMC', description: 'Gateshead Magistrates' },
        { code: 'NEWPCC', description: 'Newport Crown' },
      ])
    })
  })

  describe('getCourtsByLetter', () => {
    it('Retrieves all courts grouped first letter', async () => {
      const result = await courtsService.getCourtsByLetter(user)

      expect(result).toStrictEqual({
        A: [
          {
            code: 'ABERCV',
            description: 'Aberystwyth Civil',
          },
          {
            code: 'AYLSCC',
            description: 'Aylesbury Crown',
          },
        ],
        G: [
          {
            code: 'GTSHMC',
            description: 'Gateshead Magistrates',
          },
        ],
        N: [
          {
            code: 'NEWPCC',
            description: 'Newport Crown',
          },
        ],
      })
    })
  })
})
