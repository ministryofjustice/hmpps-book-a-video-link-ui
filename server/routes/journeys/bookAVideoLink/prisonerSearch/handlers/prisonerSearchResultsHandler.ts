import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerService from '../../../../../services/prisonerService'
import PrisonService from '../../../../../services/prisonService'
import config from '../../../../../config'

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
    const allEnabledPrisons = await this.prisonService.getPrisons(true, user)

    // Filter any grey release prisons from the enabled list to disallow booking links for them
    const enabledPrisons = config.featureToggles.greyReleasePrisons
      ? allEnabledPrisons.filter(prison => !config.featureToggles.greyReleasePrisons?.split(',').includes(prison.code))
      : allEnabledPrisons

    res.render('pages/bookAVideoLink/prisonerSearch/prisonerSearchResults', { results, enabledPrisons })
  }
}
