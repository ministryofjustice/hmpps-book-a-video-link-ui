import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import config from '../../../../../config'

export default class CommentsHandler implements PageHandler {
  public PAGE_NAME = Page.COMMENTS_PAGE

  public GET = async (req: Request, res: Response) => {
    if (config.featureToggles.masterPublicPrivateNotes) {
      res.render('pages/bookAVideoLink/probation/notesForStaff')
    } else {
      res.render('pages/bookAVideoLink/probation/comments')
    }
  }
}
