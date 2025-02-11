import type { UserDetails } from '../../services/userService'
import { BookAVideoLinkJourney } from '../../routes/journeys/bookAVideoLink/journey'
import { PrisonerSearchJourney } from '../../routes/journeys/bookAVideoLink/prisonerSearch/journey'

export default {}

export interface JourneyData extends Journey {
  instanceUnixEpoch: number
}

export interface Journey {
  bookAVideoLink?: BookAVideoLinkJourney
  prisonerSearch?: PrisonerSearchJourney
}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    journey: Journey
    journeyData: Record<string, JourneyData>
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    rawBody: object
  }

  interface Response {
    addSuccessMessage?(heading: string, message?: string): void
    addValidationError?(message: string, field?: string): void
    validationFailed?(message?: string, field?: string): void
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
    }
  }
}
