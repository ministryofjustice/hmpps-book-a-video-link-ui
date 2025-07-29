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
    const enabledMinusGreyReleasePrisons = config.featureToggles.greyReleasePrisons
      ? allEnabledPrisons.filter(prison => !config.featureToggles.greyReleasePrisons?.split(',').includes(prison.code))
      : allEnabledPrisons

    let enabledPrisons

    // Filter any court-only prisons from the list if the current journey is a probation booking for a probation user
    if (res.locals.user.isProbationUser && req.params.type === 'probation') {
      enabledPrisons = config.featureToggles.courtOnlyPrisons
        ? enabledMinusGreyReleasePrisons.filter(
            prison => !config.featureToggles.courtOnlyPrisons?.split(',').includes(prison.code),
          )
        : enabledMinusGreyReleasePrisons
    }

    // Filter any probation-only prisons from the list if the current journey is a court booking for a court user
    if (res.locals.user.isCourtUser && req.params.type === 'court') {
      enabledPrisons = config.featureToggles.probationOnlyPrisons
        ? enabledMinusGreyReleasePrisons.filter(
            prison => !config.featureToggles.probationOnlyPrisons?.split(',').includes(prison.code),
          )
        : enabledMinusGreyReleasePrisons
    }

    res.render('pages/bookAVideoLink/prisonerSearch/prisonerSearchResults', { results, enabledPrisons })
  }
}
