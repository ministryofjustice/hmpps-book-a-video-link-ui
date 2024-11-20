// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ArrayNotEmpty } from 'class-validator'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'

class Body {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  @ArrayNotEmpty({
    message: args =>
      `You need to select at least one ${(args.object as { type: string }).type === BavlJourneyType.COURT ? 'court' : 'probation team'}`,
  })
  selectedAgencies: string[]
}

export default class UserPreferencesHandler implements PageHandler {
  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
  ) {}

  public PAGE_NAME = Page.USER_PREFERENCES_PAGE

  public BODY = Body

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { type } = req.params

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getCourtsByLetter(user)
        : await this.probationTeamsService.getProbationTeamsByLetter(user)

    const selectedPreferences =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    res.render('pages/userPreferences/list', { agencies, selectedPreferences })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { type } = req.params
    const { selectedAgencies } = req.body

    if (type === BavlJourneyType.COURT) {
      await this.courtsService.setUserPreferences(selectedAgencies, user)
    } else {
      await this.probationTeamsService.setUserPreferences(selectedAgencies, user)
    }

    res.redirect('user-preferences/confirmation')
  }
}
