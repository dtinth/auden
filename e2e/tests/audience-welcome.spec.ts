import { test } from '@playwright/test'
import { AppTester } from '../lib/AppTester'

test('audience user sees welcome message when no active scenes', async ({
  browser,
}) => {
  const app = new AppTester(browser)

  const audience = await app.createAudience('test-user-1')
  await audience.navigateToAudience()
  await audience.authenticateAs('Test User')
  await audience.expectWelcomeMessage()
})
