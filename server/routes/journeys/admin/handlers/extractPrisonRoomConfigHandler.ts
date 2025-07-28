import { Request, Response } from 'express'
import { PageHandler } from '../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'

class ExtractPrisonRoomConfigHandler implements PageHandler {
  PAGE_NAME: Page.EXTRACT_PRISON_ROOM_CONFIG_PAGE

  GET = async (req: Request, res: Response) => res.render('pages/admin/extractPrisonRoomConfig')
}
