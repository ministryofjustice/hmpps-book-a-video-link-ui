import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { Matches, ValidateIf } from 'class-validator'
import { startOfToday } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import Validator from '../../../validators/validator'
import { simpleDateToDate } from '../../../../utils/utils'
import IsValidDate from '../../../validators/isValidDate'

class Body {
  @Expose()
  firstName: string

  @Expose()
  @Validator((lastName, { prisonerNumber, pncNumber }) => lastName || prisonerNumber || pncNumber, {
    message: "You must search using either the prisoner's last name, prison number or PNC Number",
  })
  lastName: string

  @Expose()
  @Transform(({ value }) => simpleDateToDate(value))
  @ValidateIf((_, v) => v)
  @Validator(date => date < startOfToday(), { message: 'Enter a date in the past' })
  @IsValidDate({ message: 'Enter a valid date' })
  dateOfBirth: Date

  @Expose()
  prison: string

  @Expose()
  @ValidateIf(({ prisonerNumber }) => prisonerNumber)
  @Matches(/^[a-zA-Z](\d){4}[a-zA-Z]{2}$/, { message: 'Enter a prison number in the format A1234AA' })
  prisonerNumber: string

  @Expose()
  @ValidateIf(({ pncNumber }) => pncNumber)
  @Matches(/^([0-9]{2}|[0-9]{4})\/[0-9]+[a-zA-Z]/, {
    message: 'Enter a PNC number in the format 01/23456A or 2001/23456A',
  })
  pncNumber: string
}

export default class PrisonerSearchHandler implements PageHandler {
  public PAGE_NAME = Page.PRISONER_SEARCH_PAGE
  public BODY = Body

  public GET = async (req: Request, res: Response) => {
    const prisons = [{ prisonId: 'MDI', prisonName: 'Moorland' }]
    res.render('pages/bookAVideoLink/prisonerSearch', { prisons })
  }

  public POST = async (req: Request, res: Response) => {
    const { body } = req
    req.session.journey.bookAVideoLink = {
      type: req.params.type.toUpperCase(),
      search: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth?.toISOString(),
        prison: body.prison,
        prisonerNumber: body.prisonerNumber,
        pncNumber: body.pncNumber,
      },
    }

    res.redirect('prisoner-search/results')
  }
}
