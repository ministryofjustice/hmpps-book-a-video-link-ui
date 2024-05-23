import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ArrayNotEmpty } from 'class-validator'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import CourtsService from '../../../../services/courtsService'

class Body {
  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  @ArrayNotEmpty({ message: 'You need to select at least one court' })
  courts: string[]
}

export default class ManageCourtsHandler implements PageHandler {
  constructor(private readonly courtsService: CourtsService) {}

  public PAGE_NAME = Page.MANAGE_COURTS_PAGE
  public BODY = Body

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals

    const [courts, selectedCourts] = await Promise.all([
      this.courtsService.getCourtsByLetter(user),
      this.courtsService.getUserPreferences(user),
    ])

    res.render('pages/manageCourts/list', { courts, selectedCourts })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { courts } = req.body

    await this.courtsService.setUserPreferences(courts, user)

    res.redirect('/manage-courts/confirmation')
  }
}
