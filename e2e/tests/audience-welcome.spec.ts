import { test, expect } from '@playwright/test'

test('audience user sees welcome message when no active scenes', async ({ page }) => {
  // Set up emulator mode
  await page.addInitScript(() => {
    localStorage.setItem('USE_FIREBASE_EMULATOR', 'true')
    localStorage.setItem('FIREBASE_DB_NAMESPACE', `test-${Date.now()}`)
  })
  
  // Navigate to audience view
  await page.goto('/#/')
  
  // Wait for Firebase to initialize
  await page.waitForFunction(() => (window as any).firebase)
  
  // Create and sign in with custom token via Firebase Auth Emulator
  await page.evaluate(async () => {
    const firebase = (window as any).firebase
    
    // Create a simple custom token (emulator is more permissive with minimal tokens)
    const customToken = JSON.stringify({
      uid: 'test-user-123',
      name: 'Test User'
    })
    
    const userCredential = await firebase.auth().signInWithCustomToken(customToken)
    
    // Update the user's displayName since custom tokens don't set this automatically
    await userCredential.user.updateProfile({
      displayName: 'Test User'
    })
  })
  
  // Wait for authentication to complete and verify welcome message
  await expect(page.locator('text=welcome')).toBeVisible()
})