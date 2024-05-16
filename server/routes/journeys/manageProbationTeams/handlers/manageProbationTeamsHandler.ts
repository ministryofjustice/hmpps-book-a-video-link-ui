import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ArrayNotEmpty } from 'class-validator'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../services/probationTeamsService'

class Body {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  @ArrayNotEmpty({ message: 'You need to select at least one probation team' })
  probationTeams: string[]
}

export default class ManageProbationTeamsHandler implements PageHandler {
  constructor(private readonly probationTeamsService: ProbationTeamsService) {}

  public PAGE_NAME = Page.MANAGE_PROBATION_TEAMS_PAGE
  public BODY = Body

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const probationTeams = await this.probationTeamsService.getProbationTeamsByLetter(user)

    res.render('pages/manageProbationTeams/list', { probationTeams })
  }

  public POST = async (req: Request, res: Response) => {
    req.flash('successMessage', JSON.stringify({ heading: 'successHeading', message: 'test' }))
    res.redirect('/')
  }
}
