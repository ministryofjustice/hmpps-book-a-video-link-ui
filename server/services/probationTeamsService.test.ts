import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import ProbationTeamsService from './probationTeamsService'
import { ProbationTeam } from '../@types/bookAVideoLinkApi/types'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Probation teams service', () => {
  let bookAVideoLinkApiClient: jest.Mocked<BookAVideoLinkApiClient>
  let probationTeamsService: ProbationTeamsService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    probationTeamsService = new ProbationTeamsService(bookAVideoLinkApiClient)

    bookAVideoLinkApiClient.getAllEnabledProbationTeams.mockResolvedValue([
      { code: 'HARROW', description: 'Harrow' },
      { code: 'CROYCC', description: 'Croydon MC' },
      { code: 'LANCCE', description: 'Central Lancashire' },
      { code: 'PPOCFD', description: 'Redbridge' },
    ] as unknown as ProbationTeam[])
  })

  describe('getAllEnabledProbationTeams', () => {
    it('Retrieves all probation teams sorted alphabetically', async () => {
      const result = await probationTeamsService.getAllEnabledProbationTeams(user)

      expect(result).toStrictEqual([
        { code: 'LANCCE', description: 'Central Lancashire' },
        { code: 'CROYCC', description: 'Croydon MC' },
        { code: 'HARROW', description: 'Harrow' },
        { code: 'PPOCFD', description: 'Redbridge' },
      ])
    })
  })

  describe('getProbationTeamsByLetter', () => {
    it('Retrieves all probation teams grouped first letter', async () => {
      const result = await probationTeamsService.getProbationTeamsByLetter(user)

      expect(result).toStrictEqual({
        C: [
          {
            code: 'LANCCE',
            description: 'Central Lancashire',
          },
          {
            code: 'CROYCC',
            description: 'Croydon MC',
          },
        ],
        H: [
          {
            code: 'HARROW',
            description: 'Harrow',
          },
        ],
        R: [
          {
            code: 'PPOCFD',
            description: 'Redbridge',
          },
        ],
      })
    })
  })

  describe('getUserPreferences', () => {
    it('Retrieves the user preferences sorted alphabetically', async () => {
      bookAVideoLinkApiClient.getUserProbationTeamPreferences.mockResolvedValue([
        { code: 'LANCCE', description: 'Central Lancashire' },
      ] as unknown as ProbationTeam[])

      const result = await probationTeamsService.getUserPreferences(user)

      expect(result).toStrictEqual([{ code: 'LANCCE', description: 'Central Lancashire' }])
    })
  })
})
