import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const staticResourcesConfig = { maxAge: config.staticResourceCacheDuration, redirect: false }

  router.use('/assets', express.static(path.join(process.cwd(), '/assets'), staticResourcesConfig))

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
