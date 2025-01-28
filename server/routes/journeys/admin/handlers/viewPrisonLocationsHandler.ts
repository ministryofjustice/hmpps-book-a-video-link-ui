import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'

export default class ViewPrisonLocationsHandler implements PageHandler {
  public PAGE_NAME = Page.PRISON_LOCATIONS_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonCode } = req.params

    const [prison, locationList] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getDecoratedAppointmentLocations(prisonCode, true, true, user),
    ])

    res.render('pages/admin/viewPrisonLocations', { prison, locationList })
  }
}
