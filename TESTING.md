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

The application provides a user-friendly testing interface to configure Firebase emulator mode without code changes:

### Testing UI (localhost only)

When running on `localhost`, the login page includes a "Show Testing Config" option that allows:

```
🧪 Firebase Emulator Configuration
┌─────────────────────────────────────────┐
│ Current: OFF                            │
│ ☐ Enable Firebase Emulator Mode        │
│ Database Namespace: [test-1234567890]   │
│ [Apply & Reload]                        │
└─────────────────────────────────────────┘
```

### Authentication in Emulator Mode

When emulator mode is active, the login page shows custom token authentication:

```
🧪 Emulator Mode Active
┌─────────────────────────────────────────┐
│ Paste custom JWT token here...          │
│ {"uid":"test-user","name":"Test User"}  │
│ [Sign in with Custom Token]             │
└─────────────────────────────────────────┘
```

### Backend Detection

The application automatically detects emulator mode via localStorage:

```typescript
// Runtime emulator detection in AppInitializer.ts
if (localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true') {
  const dbNamespace = localStorage.getItem('FIREBASE_DB_NAMESPACE') || 'default'
  firebase.database().useEmulator('localhost', 9000)
  firebase.auth().useEmulator('http://localhost:9099')
}
```

**Benefits:**
- **Manual Testing**: Everything E2E tests do can be done manually
- **Exploratory Testing**: Easy to test different user scenarios by hand  
- **Debugging**: Reproduce any test scenario manually for investigation
- **No Rebuilds**: Same build artifact for production and testing
- **Developer Friendly**: UI-guided configuration

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

#### Specific Patterns

**Semantic Regions**: Use `getByRole('region', { name: 'Section Title' })` for page sections:
```typescript
// Target specific form sections
await page.getByRole('region', { name: 'Question' }).getByRole('textbox')
await page.getByRole('region', { name: 'Available options' }).getByRole('textbox')
```

**Table Assertions**: Use table structure to avoid strict mode violations:
```typescript
// ❌ Avoid - ambiguous when multiple elements match
await expect(page.getByText('0')).toBeVisible() // Fails if multiple "0"s exist

// ✅ Correct - use table row structure  
await expect(page.getByRole('row', { name: 'Python 0' })).toBeVisible()
```

**First/Nth Selection**: Use `.first()` when multiple similar elements exist:
```typescript
// When multiple options might match, target the first one
await expect(page.getByText(option).first()).toBeVisible()
```

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
  
  // Create different user types with automatic emulator setup
  const admin = await app.createAdmin('admin-1')
  await admin.setupEmulatorAndAuthenticate('Admin User')
  
  const display = await app.createPresentation('display-1')
  await display.setupEmulatorAndAuthenticate('Display')
  
  const user1 = await app.createAudience('user-1')  
  await user1.setupEmulatorAndAuthenticate('Alice')
  
  const user2 = await app.createAudience('user-2')
  await user2.setupEmulatorAndAuthenticate('Bob')
  
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

### Implemented Vote Test

Complete multi-user vote flow with real-time synchronization:

```typescript
test('complete vote flow: admin creates vote, audience participates', async ({ context }) => {
  const app = new AppTester(context)

  // Create users (all using shared namespace via WeakMap)
  const [admin, user1, user2] = await Promise.all([
    app.createAdmin('admin-user', 'Admin User'),
    app.createAudience('user-1', 'Alice'),
    app.createAudience('user-2', 'Bob'),
  ])

  // Admin workflow using getter pattern
  const screenId = await admin.createVoteScene()
  await admin.vote.expectVoteScene()
  await admin.vote.setQuestionText('What is your favorite programming language?')
  await admin.vote.setVoteOptions(['JavaScript', 'TypeScript', 'Python', 'Go'])
  await admin.activateScene(screenId)
  await admin.vote.enableVoting()

  // Audience workflow using getter pattern
  await user1.navigateToAudience()
  await user2.navigateToAudience()
  
  await user1.vote.expectVotingInterface(questionText)
  await user1.vote.selectOption('TypeScript')
  await user2.vote.selectOption('JavaScript')
  
  // Verify real-time results
  await admin.vote.expectResults({
    TypeScript: 1, JavaScript: 1, Python: 0, Go: 0
  })
})
```

**Key Features Tested**:
- Multi-user real-time synchronization
- Admin scene creation and configuration  
- Audience voting participation
- Live result updates
- Database namespace isolation per test

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

### Manual Testing with Emulator UI

For exploratory testing and debugging:

1. **Start Firebase Emulators**: `firebase emulators:start` or use the dockerized version
2. **Start Development Server**: `yarn start` (serves on `localhost:3000`)
3. **Navigate to Application**: Open `http://localhost:3000` in browser
4. **Configure Testing**:
   - Click "Show Testing Config" on login page
   - Enable "Firebase Emulator Mode"
   - Set database namespace (e.g., `manual-testing-${Date.now()}`)
   - Click "Apply & Reload"
5. **Authenticate**: Use custom token authentication with JSON like `{"uid":"manual-user","name":"Developer"}`
6. **Test Features**: Navigate to `/admin`, `/display`, or `/` to test different user roles

### Running Automated Tests

```bash
# Start Firebase emulators (or use docker-firebase-emulator-suite)
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

### Phase 2: Core Testing ✅
- [x] Authentication flow implementation  
- [x] Vote scene multi-user testing
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