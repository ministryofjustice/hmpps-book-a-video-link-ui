import { flashProvider } from './appSetup'
import { FieldValidationError } from '../../middleware/validationMiddleware'

export default function expectErrorMessages(errorMessages: FieldValidationError[]) {
  expect(flashProvider).toHaveBeenNthCalledWith(1, 'validationErrors', JSON.stringify(errorMessages))
}
