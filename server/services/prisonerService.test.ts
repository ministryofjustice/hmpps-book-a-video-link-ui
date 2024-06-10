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

  describe('searchPrisonersByCriteria', () => {
    const pagination = { page: 1, size: 10 }

    it('should create correct search query for given criteria', async () => {
      const criteria = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        prison: 'XYZ',
        prisonerNumber: 'A12345',
        pncNumber: 'PNC123',
      }

      await prisonerService.searchPrisonersByCriteria(criteria, pagination, user)

      expect(prisonerOffenderSearchApiClient.getByAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          joinType: 'AND',
          queries: [
            { matchers: [{ attribute: 'inOutStatus', condition: 'IS', searchTerm: 'IN', type: 'String' }] },
            {
              joinType: 'OR',
              subQueries: [
                {
                  joinType: 'AND',
                  matchers: [
                    { attribute: 'firstName', condition: 'CONTAINS', searchTerm: 'John', type: 'String' },
                    { attribute: 'lastName', condition: 'CONTAINS', searchTerm: 'Doe', type: 'String' },
                    { attribute: 'dateOfBirth', maxValue: '1990-01-01', minValue: '1990-01-01', type: 'Date' },
                    { attribute: 'prisonId', condition: 'IS', searchTerm: 'XYZ', type: 'String' },
                  ],
                },
                {
                  joinType: 'AND',
                  matchers: [
                    { attribute: 'prisonerNumber', condition: 'IS', searchTerm: 'A12345', type: 'String' },
                    { pncNumber: 'PNC123', type: 'PNC' },
                  ],
                },
              ],
            },
          ],
        }),
        user,
        pagination,
        { attribute: 'firstName', order: 'ASC' },
      )
    })

    it('should handle missing optional fields', async () => {
      const criteria = {
        firstName: 'Jane',
        lastName: '',
        dateOfBirth: '',
        prison: '',
        prisonerNumber: '',
        pncNumber: '',
      }

      await prisonerService.searchPrisonersByCriteria(criteria, pagination, user)

      expect(prisonerOffenderSearchApiClient.getByAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          joinType: 'AND',
          queries: [
            { matchers: [{ attribute: 'inOutStatus', condition: 'IS', searchTerm: 'IN', type: 'String' }] },
            {
              joinType: 'OR',
              subQueries: [
                {
                  joinType: 'AND',
                  matchers: [{ attribute: 'firstName', condition: 'CONTAINS', searchTerm: 'Jane', type: 'String' }],
                },
              ],
            },
          ],
        }),
        user,
        pagination,
        { attribute: 'firstName', order: 'ASC' },
      )
    })

    it('should call API with correct pagination', async () => {
      const criteria = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        prison: 'XYZ',
        prisonerNumber: '',
        pncNumber: '',
      }

      await prisonerService.searchPrisonersByCriteria(criteria, pagination, user)

      expect(prisonerOffenderSearchApiClient.getByAttributes).toHaveBeenCalledWith(
        expect.any(Object),
        user,
        pagination,
        { attribute: 'firstName', order: 'ASC' },
      )
    })
  })
})
