# Testing Strategy for Auden

This document outlines the comprehensive testing strategy for the Auden audience engagement platform using Playwright with Firebase Emulator Suite integration.

## Overview

Auden is a real-time audience engagement platform with three distinct user interfaces:
- **Audience View** (`#/`) - Mobile-optimized participant interface
- **Presentation View** (`#/display`) - Large screen display for projectors
- **Admin View** (`#/admin`) - Backstage management interface

Our testing strategy focuses on multi-user scenarios to ensure real-time synchronization works correctly across all views.

## Technology Stack

- **Testing Framework**: [Playwright](https://playwright.dev/) - Modern browser automation
- **Firebase Emulation**: [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) - Local Firebase services
- **Page Object Pattern**: Centralized tester classes for maintainable tests
- **Multi-User Testing**: Concurrent browser contexts for realistic scenarios

## Firebase Testing Setup

### Emulator Configuration

We use Firebase Emulator Suite for isolated testing environments:

- **Database Emulator**: `localhost:9000` - Real-time database with per-test namespaces
- **Auth Emulator**: `localhost:9099` - Authentication with hand-crafted tokens
- **Documentation**: [Firebase Emulator Setup](https://firebase.google.com/docs/emulator-suite/install_and_configure)

### Database Isolation Strategy

Each test gets a unique database namespace to prevent test interference:

```javascript
// Test-specific database URL
http://localhost:9000/?ns=test-${timestamp}-${testId}
```

**Benefits:**
- Complete test isolation with concurrent execution
- No test data pollution between runs
- Original Firebase security rules apply (no rule modifications needed)
- Auto-cleanup (namespaces are ephemeral)

**Reference**: [Firebase Emulator Database Instances](https://firebase.google.com/docs/emulator-suite/connect_rtdb#choose_a_database_instance)

### Authentication Strategy

Firebase Auth Emulator allows hand-crafted JWT tokens without signature validation:

```javascript
// Hand-crafted token for testing
const testAdminToken = btoa(JSON.stringify({
  "iss": "test",
  "aud": "test-project", 
  "sub": "test-admin-123",
  "iat": Math.floor(Date.now() / 1000),
  "admin": true  // custom claims
}))
```

**Benefits:**
- No Firebase Admin SDK required
- Reusable tokens (no expiry validation in emulator)
- Custom claims for admin/user role testing
- Works with existing security rules

**Reference**: [Firebase Auth Emulator Custom Tokens](https://firebase.google.com/docs/emulator-suite/connect_auth#custom_token_authentication)

## Runtime Configuration

The application detects test mode via localStorage flags to avoid rebuilding for different environments:

```typescript
// Runtime emulator detection
if (localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true') {
  const dbNamespace = localStorage.getItem('FIREBASE_DB_NAMESPACE') || 'default'
  firebase.database().useEmulator('localhost', 9000)
  firebase.auth().useEmulator('http://localhost:9099')
  // Use custom database namespace
}
```

**Benefits:**
- Same build artifact for production and testing
- No environment variables or rebuild required
- Easy to toggle per test

## Page Object Architecture

We use a centralized Page Object pattern based on [this approach](https://notes.dt.in.th/PlaywrightPageObject) with role-specific tester classes:

### Structure

```
AppTester (manages browser, creates users)
├── AdminTester (backstage management)
├── AudienceTester (participant interface)  
└── PresentationTester (display screen)
```

### Implementation

```typescript
// Central tester with user management
export class AppTester {
  constructor(private browser: Browser) {}
  
  async createAdmin(adminId: string): Promise<AdminTester>
  async createAudience(userId: string): Promise<AudienceTester>
  async createPresentation(displayId: string): Promise<PresentationTester>
}

// Role-specific testers
export class AdminTester extends PageObject {
  get quiz() { return new QuizAdminTester(this.page) }
  get vote() { return new VoteAdminTester(this.page) }
  get freestyle() { return new FreestyleAdminTester(this.page) }
}

export class AudienceTester extends PageObject {
  get quiz() { return new QuizAudienceTester(this.page) }
  get vote() { return new VoteAudienceTester(this.page) }
  get freestyle() { return new FreestyleAudienceTester(this.page) }
}
```

### Locator Strategy

Following [Playwright best practices](https://playwright.dev/docs/locators#quick-guide), we prioritize semantic locators:

1. `getByRole()` - Most reliable, accessibility-friendly
2. `getByTestId()` - Explicit test targeting
3. `getByText()` - Content-based selection
4. `locator()` - CSS/XPath as last resort

## Test Structure

### File Organization

Simple flat structure in `e2e/tests/`:

```
e2e/tests/
├── vote.spec.ts       # Multi-user voting scenarios
├── quiz.spec.ts       # Multi-user quiz scenarios  
├── freestyle.spec.ts  # Chat and custom content
└── auth.spec.ts       # Authentication flows
```

### Multi-User Test Pattern

```typescript
test('complete vote flow', async ({ browser }) => {
  const app = new AppTester(browser)
  
  // Create different user types
  const admin = await app.createAdmin('admin-1')
  const display = await app.createPresentation('display-1')
  const user1 = await app.createAudience('user-1')
  const user2 = await app.createAudience('user-2')
  
  // Test real-time synchronization
  await admin.vote.createQuestion('Favorite language?')
  await admin.vote.addOptions(['JavaScript', 'TypeScript', 'Python'])
  await admin.vote.enableVoting()
  
  await user1.vote.selectOption('TypeScript')
  await user2.vote.selectOption('JavaScript')
  
  // Verify real-time updates on display
  await expect(display.vote.results).toContainText('TypeScript: 1')
  await expect(display.vote.results).toContainText('JavaScript: 1')
  
  // No manual cleanup needed - Playwright handles it
})
```

## Visual Testing

### Screenshot Strategy

- **Generation**: Dump screenshots to `e2e/screenshots/` organized by scene/viewport/user-type
- **Integration**: [Percy](https://percy.io/) for visual regression testing
- **Mobile Testing**: iPhone/Android viewports for audience interface testing

### Implementation

```typescript
// Component-specific screenshots
await audienceTester.takeScreenshot('vote-mobile-view')
await presentationTester.takeScreenshot('vote-results-display')
```

## Performance Testing

### Real-Time Metrics

- **Synchronization Latency**: Time for updates to propagate between views
- **Load Testing**: Multiple concurrent users voting/participating
- **Firebase Performance**: Real-time database update performance

### Tools

- **Playwright**: Built-in performance metrics
- **Firebase Emulator**: Performance monitoring capabilities
- **Browser DevTools**: Network and timing analysis

## Test Categories

### 1. Core Scene Testing

**Vote Scene**:
- Admin creates questions and options
- Multiple users vote concurrently
- Real-time result updates on presentation view
- Vote limits and validation

**Quiz Scene**:
- Admin imports quiz data
- Multiple users answer questions
- Real-time leaderboard updates
- Scoring and timing mechanics

**Freestyle Scene**:
- Chat functionality with multiple users
- Custom HTML/CSS content injection
- Admin scene switching capabilities

### 2. Integration Testing

- Scene switching workflows
- Cross-route navigation consistency
- Authentication state persistence
- Real-time data synchronization

### 3. Security Testing

- Admin vs regular user access controls
- Firebase security rules enforcement
- XSS prevention in user inputs
- Authentication boundary testing

## Development Workflow

### Running Tests

```bash
# Start Firebase emulators
firebase emulators:start

# Run all tests
cd e2e && yarn playwright test

# Run specific test
cd e2e && yarn playwright test vote.spec.ts

# Debug mode
cd e2e && yarn playwright test --debug
```

### CI/CD Integration

Tests run in GitHub Actions with:
- Firebase emulators started automatically
- Full recording (traces, screenshots, videos) in CI
- Parallel execution with proper test isolation
- Visual regression testing via Percy

## Implementation Phases

### Phase 1: Infrastructure ✅
- [x] Firebase emulator configuration
- [x] Runtime configuration setup
- [x] Page Object framework design

### Phase 2: Core Testing (Next)
- [ ] Authentication flow implementation
- [ ] Vote scene multi-user testing
- [ ] Quiz scene multi-user testing
- [ ] Freestyle scene testing

### Phase 3: Advanced Testing
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Security testing
- [ ] Mobile viewport testing

### Phase 4: CI/CD Integration
- [ ] GitHub Actions workflow
- [ ] Percy integration
- [ ] Performance monitoring
- [ ] Test reporting

## Future Considerations

### Modernization Support
- Tests designed to support React/Firebase SDK upgrades
- TypeScript strict mode compatibility
- Modern React patterns migration

### Scalability
- Test suite designed for additional scenes
- Extensible page object architecture
- Performance testing for larger audiences

## References

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Page Object Pattern Guide](https://notes.dt.in.th/PlaywrightPageObject)
- [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Firebase Database Emulator](https://firebase.google.com/docs/emulator-suite/connect_rtdb)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Percy Visual Testing](https://percy.io/)