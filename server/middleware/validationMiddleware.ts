import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { RequestHandler } from 'express'

export type FieldValidationError = {
  href: string
  text: string
}

export default function validationMiddleware(type: new () => object): RequestHandler {
  return async (req, res, next) => {
    if (!type) {
      return next()
    }

    // Build an object which is used by validators to check things against
    const requestObject = plainToInstance(type, {
      ...req.body,
      ...req.session.journey,
    })

    const errors: ValidationError[] = await validate(requestObject, {
      stopAtFirstError: true,
      forbidUnknownValues: false,
    })

    if (errors.length === 0) {
      return next()
    }

    const buildError = (
      error: ValidationError,
      constraints: {
        [type: string]: string
      },
      parent?: string,
    ): FieldValidationError => ({
      href: `#${parent ? `${parent}-` : ''}${error.property}`,
      text: Object.values(constraints)[0],
    })

    const flattenErrors = (errorList: ValidationError[], parent?: string): FieldValidationError[] => {
      // Flat pack a list of errors with child errors into a 1-dimensional list of errors.
      return errorList.flatMap(error => {
        const property = `${parent ? `${parent}-` : ''}${error.property}`

        return error.children.length > 0
          ? flattenErrors(error.children, property)
          : [buildError(error, error.constraints, parent)]
      })
    }

    req.flash('validationErrors', JSON.stringify(flattenErrors(errors)))
    req.flash('formResponses', JSON.stringify(req.body))

    return res.redirect('back')
  }
}
