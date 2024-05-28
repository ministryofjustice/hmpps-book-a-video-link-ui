import type { UserDetails } from '../../services/userService'
import { BookAVideoLinkJourney } from '../../routes/journeys/bookAVideoLink/journey'

export default {}

export interface JourneyData {
  instanceUnixEpoch: number
}

export interface Journey {
  bookAVideoLink?: BookAVideoLinkJourney
}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    journey: Journey
    journeyData: Map<string, JourneyData>
  }
}

declare module 'express-serve-static-core' {
  interface Response {
    addSuccessMessage?(heading: string, message?: string): void
    addValidationError?(field: string, message: string): void
    validationFailed?(field?: string, message?: string): void
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
