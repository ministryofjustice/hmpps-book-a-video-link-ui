import { isNotEmpty, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isEmpty } from 'lodash'
// import logger from '../../logger'

export default function CustomOneOrTheOther(
  property: string,
  otherProperty: string,
  checkProperty: string,
  featureToggle: boolean,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'customOneOrTheOther',
      target: object.constructor,
      propertyName,
      constraints: [property, otherProperty, checkProperty, featureToggle],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const thisProperty: string = args.constraints[0]
          const thatProperty: string = args.constraints[1]
          const checkReqProperty: boolean = args.constraints[2]
          const feature: boolean = args.constraints[3]

          if (args.object[checkReqProperty as keyof object] !== 'yes') {
            // logger.info(`Pass: value of check ${args.object[checkReqProperty as keyof object]}`)
            return true
          }

          if (feature) {
            // logger.info(`Feature is ON on - pass if one or other`)
            // logger.info(`This property ${args.object[thisProperty as keyof object]}`)
            // logger.info(`That property ${args.object[thatProperty as keyof object]}`)
            return (
              (isNotEmpty(args.object[thisProperty as keyof object]) &&
                isEmpty(args.object[thatProperty as keyof object])) ||
              (isNotEmpty(args.object[thatProperty as keyof object]) &&
                isEmpty(args.object[thisProperty as keyof object]))
            )
          }

          // logger.info(`Feature is OFF - Pass if this is not empty ${args.object[thisProperty as keyof object]}`)
          return isNotEmpty(args.object[thisProperty as keyof object])
        },
      },
    })
  }
}
