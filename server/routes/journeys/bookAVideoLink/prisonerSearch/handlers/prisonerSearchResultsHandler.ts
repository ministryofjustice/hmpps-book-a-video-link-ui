import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerService from '../../../../../services/prisonerService'
import PrisonService from '../../../../../services/prisonService'

export default class PrisonerSearchResultsHandler implements PageHandler {
  public PAGE_NAME = Page.PRISONER_SEARCH_RESULTS_PAGE

  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly prisonService: PrisonService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const page = Number(req.query.page as unknown) || 0

    const { prisonerSearch } = req.session.journey
    const results = await this.prisonerService.searchPrisonersByCriteria(prisonerSearch, { page, size: 10 }, user)
    const enabledPrisons = await this.prisonService.getPrisons(true, user)

    res.render('pages/bookAVideoLink/prisonerSearch/prisonerSearchResults', { results, enabledPrisons })
  }
}
