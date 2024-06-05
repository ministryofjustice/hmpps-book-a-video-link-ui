import { flashProvider } from './appSetup'
import { FieldValidationError } from '../../middleware/validationMiddleware'

export function expectErrorMessages(errorMessages: FieldValidationError[]) {
  expect(flashProvider).toHaveBeenNthCalledWith(1, 'validationErrors', JSON.stringify(errorMessages))
}

export function expectNoErrorMessages() {
  expect(flashProvider).not.toHaveBeenCalled()
}
