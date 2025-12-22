import { stubGet, stubPost } from './wiremock'

export default {
  stubPing: () => stubGet('/prisoner-search-api/health/ping'),
  stubAttributeSearch: (response: string | undefined) =>
    stubPost('/prisoner-search-api/attribute-search\\?(.)*', response),
  stubPrisoner: (response: object) => stubGet(`/prisoner-search-api/prisoner/(.)*`, response),
  stubPrisonerList: (response: object) => stubPost(`/prisoner-search-api/prisoner-search/prisoner-numbers`, response),
}
