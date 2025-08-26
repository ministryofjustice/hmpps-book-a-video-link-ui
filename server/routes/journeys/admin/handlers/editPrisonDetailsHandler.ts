// eslint-disable-next-line max-classes-per-file
import { NextFunction, Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { IsEnum, IsInt, IsNotEmpty, Max, Min, ValidateIf } from 'class-validator'
import { Expose, Transform } from 'class-transformer'
import { PageHandler } from '../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import PrisonService from '../../../../services/prisonService'
import AdminService from '../../../../services/adminService'
import OnOff from '../../../enumerator/onOff'

class Body {
  @Expose()
  @IsEnum(OnOff, { message: 'Select if pick-up times should be displayed on Video Link Daily Schedule' })
  pickUpTimeOnOff: OnOff

  @Expose()
  @ValidateIf(o => o.pickUpTimeOnOff === OnOff.ON)
  @IsNotEmpty({ message: 'Select a time period' })
  pickUpTime: string

  @Expose()
  @ValidateIf(o => o.pickUpTimeOnOff === OnOff.ON && o.pickUpTime && o.pickUpTime === 'custom')
  @Transform(({ value }) => +value)
  @Min(1, { message: 'Number of minutes should be between 1 and 60, without decimals' })
  @Max(60, { message: 'Number of minutes should be between 1 and 60, without decimals' })
  @IsInt({ message: 'Number of minutes should be between 1 and 60, without decimals' })
  customPickUpTime: number
}

export default class EditPrisonDetailsHandler implements PageHandler {
  public PAGE_NAME = Page.EDIT_PRISON_DETAILS_PAGE

  public BODY = Body

  constructor(
    private readonly prisonService: PrisonService,
    private readonly adminService: AdminService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode } = req.params
    const prison = await this.prisonService.getPrisonByCode(prisonCode, user)

    if (prison) {
      res.render('pages/admin/editPrisonDetails', { prison })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode } = req.params
    const { pickUpTimeOnOff, pickUpTime, customPickUpTime } = req.body
    const prison = await this.prisonService.getPrisonByCode(prisonCode, user)

    if (prison) {
      let amendedPickUpTime: number = null

      if (pickUpTimeOnOff === OnOff.ON) {
        switch (pickUpTime) {
          case 'custom':
            amendedPickUpTime = customPickUpTime
            break
          case '15':
            amendedPickUpTime = 15
            break
          case '30':
            amendedPickUpTime = 30
            break
          case '45':
            amendedPickUpTime = 45
            break
          default:
            amendedPickUpTime = null
        }
      }

      if (prison.pickUpTime !== amendedPickUpTime) {
        await this.adminService.amendPrison(prison.code, { pickUpTime: amendedPickUpTime }, user)
        res.addSuccessMessage('Changes have been saved')
      }

      res.redirect(`/admin/edit-prison-details/${prisonCode}`)
    } else {
      next(new NotFound())
    }
  }
}
