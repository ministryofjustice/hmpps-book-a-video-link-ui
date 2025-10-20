import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'

export default class ConfirmationHandler implements PageHandler {
  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
  ) {}

  public PAGE_NAME = Page.USER_PREFERENCES_CONFIRMATION_PAGE

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { type } = req.routeContext

    const selectedPreferences =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    res.render('pages/userPreferences/confirmation', { selectedPreferences })
  }
}
