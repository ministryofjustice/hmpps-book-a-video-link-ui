import type { UserDetails } from '../../services/userService'

export default {}

export interface JourneyData {
  instanceUnixEpoch: number
}

export interface Journey {
  // Define journey types here
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
