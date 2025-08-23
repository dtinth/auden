import { test } from '@playwright/test'
import { AppTester } from '../lib/AppTester'

test('audience user sees welcome message when no active scenes', async ({
  context,
}) => {
  const app = new AppTester(context)

  const audience = await app.createAudience('alice')
  await audience.navigateToAudience()
  await audience.expectWelcomeMessage()
})
