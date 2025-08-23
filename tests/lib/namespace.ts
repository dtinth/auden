import { BrowserContext } from '@playwright/test'

// Module-level WeakMap for namespace management
// Each BrowserContext gets a unique namespace that persists for the entire test
const namespaceMap = new WeakMap<BrowserContext, string>()

/**
 * Gets or creates a unique database namespace for the given browser context.
 * All users in the same test (same context) will share this namespace,
 * enabling communication between admin and audience users.
 * 
 * @param context - The Playwright BrowserContext from the test
 * @returns A unique namespace string for this test context
 */
export function getOrCreateNamespace(context: BrowserContext): string {
  let namespace = namespaceMap.get(context)
  
  if (!namespace) {
    // Create a unique namespace for this test context
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2, 8)
    namespace = `test-${timestamp}-${randomId}`
    
    namespaceMap.set(context, namespace)
  }
  
  return namespace
}

/**
 * Clears the namespace for a given context (mainly for testing purposes).
 * In normal usage, the WeakMap will automatically clean up when contexts are garbage collected.
 * 
 * @param context - The BrowserContext to clear
 */
export function clearNamespace(context: BrowserContext): void {
  namespaceMap.delete(context)
}