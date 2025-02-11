// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { startOfToday } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import Validator from '../../../../validators/validator'
import { simpleDateToDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'
import PrisonService from '../../../../../services/prisonService'

class Body {
  @Expose()
  @IsNotEmpty({ message: 'Enter a first name' })
  firstName: string

  @Expose()
  @IsNotEmpty({ message: 'Enter a last name' })
  lastName: string

  @Expose()
  @Transform(({ value }) => simpleDateToDate(value))
  @Validator(date => date < startOfToday(), { message: 'Enter a date in the past' })
  @IsValidDate({ message: 'Enter a valid date of birth' })
  @IsNotEmpty({ message: 'Enter a date of birth' })
  dateOfBirth: Date

  @Expose()
  @IsNotEmpty({ message: 'Select a prison' })
  prison: string
}

export default class PrisonerDetailsHandler implements PageHandler {
  public PAGE_NAME = Page.UNKNOWN_PRISONER_DETAILS_PAGE

  public BODY = Body

  constructor(private readonly prisonService: PrisonService) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const prisons = await this.prisonService.getPrisons(true, user)
    return res.render('pages/bookAVideoLink/court/prisonerDetails', { prisons })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { firstName, lastName, dateOfBirth, prison } = req.body
    const prisons = await this.prisonService.getPrisons(true, user)

    req.session.journey.bookAVideoLink = {
      prisoner: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth.toISOString(),
        prisonId: prison,
        prisonName: prisons.find(p => p.code === prison).name,
      },
    }

    res.redirect('video-link-booking')
  }
}
