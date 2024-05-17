import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../services/probationTeamsService'

export default class ConfirmationHandler implements PageHandler {
  constructor(private readonly probationTeamsService: ProbationTeamsService) {}

  public PAGE_NAME = Page.MANAGE_PROBATION_TEAMS_CONFIRMATION_PAGE

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const probationTeams = await this.probationTeamsService.getUserPreferences(user)

    res.render('pages/manageProbationTeams/confirmation', { probationTeams })
  }
}
