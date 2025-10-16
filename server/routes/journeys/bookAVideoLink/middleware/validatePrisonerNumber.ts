import type { NextFunction, Request, Response } from 'express'
import { isValidPrisonerNumber } from '../../../../utils/utils'

export default function validatePrisonerNumber() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Splits on the premise the prisoner number is the second element in the URL.
    const prisonerNumber = req.url.split('/')[1]

    if (isValidPrisonerNumber(prisonerNumber)) {
      return next()
    }

    // Redirect to the home page if the prisoner number is not valid
    return res.redirect('/')
  }
}
