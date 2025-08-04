import { Request, Response } from 'express'
import { PageHandler } from '../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import VideoLinkService from '../../../../services/videoLinkService'

export default class ExtractPrisonRoomConfigHandler implements PageHandler {
  PAGE_NAME: Page.EXTRACT_PRISON_ROOM_CONFIG_PAGE

  constructor(private readonly videoLinkService: VideoLinkService) {}

  GET = async (req: Request, res: Response) => res.render('pages/admin/extractPrisonRoomConfig')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    return this.videoLinkService.downloadPrisonRoomConfigurationData(res, user)
  }
}
