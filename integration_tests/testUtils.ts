import { Page } from '@playwright/test'
import tokenVerification from './mockApis/tokenVerification'
import hmppsAuth, { type UserToken } from './mockApis/hmppsAuth'
import { resetStubs } from './mockApis/wiremock'

export { resetStubs }

const DEFAULT_ROLES = ['ROLE_PRISON', 'ROLE_VIDEO_LINK_COURT_USER']

export const attemptHmppsAuthLogin = async (page: Page) => {
  await page.goto('/')
  page.locator('h1', { hasText: 'Sign in' })
  const url = await hmppsAuth.getSignInUrl()
  await page.goto(url)
}

export const login = async (
  page: Page,
  {
    name = 'john smith',
    roles = DEFAULT_ROLES,
    active = true,
    authSource = 'auth',
  }: UserToken & { active?: boolean } = {},
) => {
  await Promise.all([
    hmppsAuth.favicon(),
    hmppsAuth.stubSignInPage(),
    hmppsAuth.stubSignOutPage(),
    hmppsAuth.token({ name, roles, authSource }),
    tokenVerification.stubVerifyToken(active),
  ])
  await attemptHmppsAuthLogin(page)
}

export const makePageData = (mockData: object[]) => ({
  number: 0,
  size: 10,
  totalElements: mockData.length,
  totalPages: Math.ceil(mockData.length / 10),
})
