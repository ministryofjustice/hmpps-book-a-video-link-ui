import createUser from '../testutils/createUser'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import PrisonerService from './prisonerService'

jest.mock('../data/prisonerOffenderSearchApiClient')

describe('Prisoner service', () => {
  let prisonerOffenderSearchApiClient: jest.Mocked<PrisonerOffenderSearchApiClient>
  let prisonerService: PrisonerService

  const user = createUser([])

  beforeEach(() => {
    prisonerOffenderSearchApiClient =
      new PrisonerOffenderSearchApiClient() as jest.Mocked<PrisonerOffenderSearchApiClient>
    prisonerService = new PrisonerService(prisonerOffenderSearchApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonerByPrisonerNumber', () => {
    it('Retrieves prisoner by prisoner number', async () => {
      prisonerOffenderSearchApiClient.getByPrisonerNumber.mockResolvedValue({ prisonerNumber: 'ABC123' })
      const result = await prisonerService.getPrisonerByPrisonerNumber('ABC123', user)
      expect(prisonerOffenderSearchApiClient.getByPrisonerNumber).toHaveBeenCalledWith('ABC123', user)
      expect(result).toEqual({ prisonerNumber: 'ABC123' })
    })
  })
})
