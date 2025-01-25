import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import logger from '../../../../../logger'

export default class ViewPrisonLocationsHandler implements PageHandler {
  public PAGE_NAME = Page.PRISON_LOCATIONS_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonCode } = req.query

    const [prison, locationList] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode as string, user),
      this.prisonService.getDecoratedAppointmentLocations(prisonCode as string, true, true, user),
    ])

    logger.info(`Locations are ${JSON.stringify(locationList)}`)

    res.render('pages/admin/viewPrisonLocations', { prison, locationList })
  }
}
