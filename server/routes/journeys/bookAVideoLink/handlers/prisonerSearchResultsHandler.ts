import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class PrisonerSearchResultsHandler implements PageHandler {
  public PAGE_NAME = Page.PRISONER_SEARCH_RESULTS_PAGE

  public GET = async (req: Request, res: Response) => {
    // TODO: Search prisoners on attributes

    const results = [
      {
        name: 'Boba Smith',
        prisonerNumber: 'G5662GI',
        dateOfBirth: '1970-06-01',
        prisonName: 'HMP Birmingham',
        pncNumber: '05/213362Q',
      },
    ]

    res.render('pages/bookAVideoLink/prisonerSearchResults', { results })
  }
}
