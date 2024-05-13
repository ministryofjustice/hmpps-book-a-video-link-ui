import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { ArrayNotEmpty, IsDefined } from 'class-validator'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

class Body {
  @Expose()
  @IsDefined({ message: 'must be defined' })
  @ArrayNotEmpty({ message: 'must not be empty' })
  courts: string[]
  @Expose()
  @IsDefined({ message: 'must be defined' })
  @ArrayNotEmpty({ message: 'must not be empty' })
  test: string[]
}

export default class ManageProbationAreasHandler implements PageHandler {
  public PAGE_NAME = Page.MANAGE_PROBATION_AREAS_PAGE
  public BODY = Body

  async GET(req: Request, res: Response) {
    res.render('pages/manageProbationAreas/list')
  }

  async POST(req: Request, res: Response) {
    req.flash('successMessage', JSON.stringify({ heading: 'successHeading', message: 'test' }))
    res.redirect('/')
  }
}
