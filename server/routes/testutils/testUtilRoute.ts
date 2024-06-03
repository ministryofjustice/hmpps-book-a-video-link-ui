import { Express, Router } from 'express'
import request from 'supertest'

export function testUtilRoutes(): Router {
  const router = Router()
  router.get('/journeySession/:journey', (req, res, next) => res.send(req.session.journey[req.params.journey]))
  return router
}

export default function expectJourneySession(app: Express, journeyName: string, expectedJourney: unknown) {
  return request(app)
    .get(`/journeySession/${journeyName}`)
    .expect(res => expect((res.text && JSON.parse(res.text)) || null).toEqual(expectedJourney))
}
