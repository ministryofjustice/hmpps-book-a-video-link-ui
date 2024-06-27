import { stubGet, stubPost } from './wiremock'

export default {
  stubPrisonerSearchPing: () => stubGet('/prisoner-search-api/health/ping'),
  stubAttributeSearch: response => stubPost('/prisoner-search-api/attribute-search\\?(.)*', response),
  stubPrisoner: response => stubGet(`/prisoner-search-api/prisoner/(.)*`, response),
}
