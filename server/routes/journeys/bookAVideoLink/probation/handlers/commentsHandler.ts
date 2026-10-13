import { Request, Response } from 'express'
import Page from '../../../../enumerator/page'
import { PageHandler } from '../../../../interfaces/pageHandler'

export default class CommentsHandler implements PageHandler {
  public PAGE_NAME = Page.COMMENTS_PAGE

  public GET = async (req: Request, res: Response) => {
    res.render('pages/bookAVideoLink/probation/notesForStaff')
  }
}
